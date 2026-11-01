import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError, sleep } from 'n8n-workflow';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SUNO_BASE_URL = 'https://api.sunoapi.org';
export const SUNO_UPLOAD_BASE_URL = 'https://sunoapiorg.redpandaai.co';

const MAX_RETRIES = 3;
// Codes a request was rejected with before Suno did any work, so any method may resend.
const RATE_LIMIT_CODES = new Set([405, 430]);
// Codes where a write may already have been accepted. Only safe methods resend.
const TRANSIENT_CODES = new Set([429, 502, 503, 504]);
// Body code 429 means insufficient credits. Retrying cannot succeed.
const NO_RETRY_BODY_CODES = new Set([429]);
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const BASE_DELAY_MS = 1_000;
const MAX_ERROR_LENGTH = 1_000;
const REQUEST_TIMEOUT_MS = 30_000;

// ---------------------------------------------------------------------------
// Error code descriptions (Suno-specific)
// ---------------------------------------------------------------------------

const SUNO_ERROR_MESSAGES: Record<number, string> = {
	400: 'Invalid request parameters',
	401: 'Invalid API key — check your Suno credentials',
	402: 'Insufficient credits — top up at sunoapi.org',
	404: 'Resource not found',
	405: 'Rate limit exceeded — max 20 requests per 10 seconds',
	409: 'Conflict — resource already exists for this task',
	413: 'Content exceeds maximum length',
	422: 'Validation failed',
	429: 'Insufficient credits',
	430: 'Request frequency too high — slow down',
	451: 'Download failed or access restricted',
	455: 'Suno API is under maintenance — try again later',
	500: 'Suno server error',
	501: 'Suno server error',
};

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

const SAFE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const MAX_ID_LENGTH = 255;
const MAX_URL_LENGTH = 2_048;
const SAFE_PATH_CHARS = /^[a-zA-Z0-9\-_/.\[\]?&=,]+$/;

const PRIVATE_IP_RANGES = [
	/^127\./,
	/^10\./,
	/^172\.(1[6-9]|2\d|3[01])\./,
	/^192\.168\./,
	/^169\.254\./,
	/^0\./,
	/^0\.0\.0\.0$/,
];

PRIVATE_IP_RANGES.push(/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, /^(22[4-9]|2[3-5]\d)\./);

function isPrivateIpv4(host: string): boolean {
	return PRIVATE_IP_RANGES.some((range) => range.test(host));
}

/** Returns true for loopback, unspecified, unique local, link local and IPv4-mapped private IPv6. */
function isPrivateIpv6(host: string): boolean {
	const h = host.toLowerCase();
	if (h === '::' || h === '::1') return true;
	if (/^f[cd][0-9a-f]{0,2}:/.test(h)) return true;
	if (/^fe[89ab][0-9a-f]?:/.test(h)) return true;
	const mapped = /^::ffff:(?:0:)?(.+)$/.exec(h);
	if (mapped) {
		const tail = mapped[1];
		if (tail.includes('.')) return isPrivateIpv4(tail);
		const groups = tail.split(':');
		if (groups.length === 2) {
			const hi = parseInt(groups[0], 16);
			const lo = parseInt(groups[1], 16);
			const v4 = [hi >> 8, hi & 255, lo >> 8, lo & 255].join('.');
			return isPrivateIpv4(v4);
		}
		return true;
	}
	return false;
}

export function assertSafeId(value: string, label: string): void {
	if (!value || typeof value !== 'string') {
		throw new Error(`${label} is required`);
	}
	if (value.length > MAX_ID_LENGTH) {
		throw new Error(`${label} exceeds maximum length of ${MAX_ID_LENGTH} characters`);
	}
	if (!SAFE_ID_PATTERN.test(value)) {
		throw new Error(`${label} contains invalid characters — only alphanumeric, hyphens, and underscores are allowed`);
	}
}

export function sanitizeEndpoint(endpoint: string): string {
	const decoded = decodeURIComponent(endpoint);
	if (decoded.includes('..')) {
		throw new Error('Path traversal detected in endpoint');
	}
	if (!SAFE_PATH_CHARS.test(decoded)) {
		throw new Error('Endpoint contains invalid characters');
	}
	return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
}

export function assertValidUrl(url: string, label: string): void {
	if (!url || typeof url !== 'string') {
		throw new Error(`${label} is required`);
	}
	if (url.length > MAX_URL_LENGTH) {
		throw new Error(`${label} exceeds maximum length of ${MAX_URL_LENGTH} characters`);
	}

	const parsed = URL.canParse(url) ? new URL(url) : undefined;
	if (!parsed) {
		throw new Error(`${label} is not a valid URL`);
	}

	if (parsed.protocol !== 'https:') {
		throw new Error(`${label} must use HTTPS`);
	}

	const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '');

	if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === '0.0.0.0') {
		throw new Error(`${label} must not point to a local address`);
	}

	if (isPrivateIpv4(hostname)) {
		throw new Error(`${label} must not point to a private IP address`);
	}

	if (hostname.startsWith('[') && isPrivateIpv6(hostname.slice(1, -1))) {
		throw new Error(`${label} must not point to a private IPv6 address`);
	}
}

export function assertInRange(value: number, min: number, max: number, label: string): void {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		throw new Error(`${label} must be a finite number`);
	}
	if (value < min || value > max) {
		throw new Error(`${label} must be between ${min} and ${max}`);
	}
}

export function assertNonEmpty(value: string, label: string, maxLength?: number): string {
	if (!value || typeof value !== 'string' || value.trim().length === 0) {
		throw new Error(`${label} is required and cannot be empty`);
	}
	const trimmed = value.trim();
	if (maxLength !== undefined && trimmed.length > maxLength) {
		throw new Error(`${label} exceeds maximum length of ${maxLength} characters (got ${trimmed.length})`);
	}
	return trimmed;
}

// ---------------------------------------------------------------------------
// Error parsing
// ---------------------------------------------------------------------------

export function parseErrorResponse(body: unknown): string {
	if (body && typeof body === 'object') {
		const obj = body as Record<string, unknown>;
		const code = obj.code as number | undefined;
		const msg = obj.msg as string | undefined;

		if (code && SUNO_ERROR_MESSAGES[code]) {
			const base = SUNO_ERROR_MESSAGES[code];
			if (msg && typeof msg === 'string') {
				const safeMsg = redactSecrets(msg).slice(0, MAX_ERROR_LENGTH);
				return `${base}: ${safeMsg}`;
			}
			return base;
		}
		if (msg && typeof msg === 'string') {
			return redactSecrets(msg).slice(0, MAX_ERROR_LENGTH);
		}
	}
	return 'Unknown Suno API error';
}

// ---------------------------------------------------------------------------
// Core request function
// ---------------------------------------------------------------------------

/** Reads Retry-After from the HTTP response that n8n wraps in the error's cause. */
function retryAfterOf(error: unknown): unknown {
	const err = error as {
		headers?: Record<string, unknown>;
		cause?: { response?: { headers?: Record<string, unknown> }; headers?: Record<string, unknown> };
	};
	const headers = err.cause?.response?.headers ?? err.cause?.headers ?? err.headers;
	return headers?.['retry-after'];
}

const SECRET_PATTERNS = [/Bearer\s+[^\s"',;]+/gi, /\b(sk|pk|sp|key)[-_][A-Za-z0-9_-]{8,}\b/g, /\b[A-Fa-f0-9]{24,}\b/g];

/** Masks token-like strings so an upstream echo never reaches the n8n UI. */
export function redactSecrets(text: string): string {
	return SECRET_PATTERNS.reduce((out, pattern) => out.replace(pattern, '[redacted]'), text);
}

function jitteredDelay(attempt: number): number {
	const base = BASE_DELAY_MS * Math.pow(2, attempt);
	const jitter = Math.random() * BASE_DELAY_MS;
	return base + jitter;
}

async function makeRequest(
	ctx: IExecuteFunctions | ILoadOptionsFunctions,
	baseUrl: string,
	method: IHttpRequestMethods,
	path: string,
	body?: IDataObject | IDataObject[],
	qs?: IDataObject,
	extraOptions?: Partial<IHttpRequestOptions>,
): Promise<unknown> {
	const safePath = sanitizeEndpoint(path);

	const options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${safePath}`,
		json: true,
		timeout: REQUEST_TIMEOUT_MS,
		...extraOptions,
	};

	if (body && Object.keys(body).length > 0) {
		options.body = body;
	}
	if (qs && Object.keys(qs).length > 0) {
		options.qs = qs;
	}

	const safeMethod = SAFE_METHODS.has(String(method).toUpperCase());
	const canRetry = (code: number) =>
		RATE_LIMIT_CODES.has(code) || (safeMethod && TRANSIENT_CODES.has(code));

	let lastError: unknown;
	let bodyError: NodeApiError | undefined;

	for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
		try {
			const response = await ctx.helpers.httpRequestWithAuthentication.call(
				ctx,
				'sunoApi',
				options,
			);

			if (response && typeof response === 'object') {
				const resp = response as Record<string, unknown>;
				const code = resp.code as number | undefined;

				if (code !== undefined && code !== 200) {
					if (!NO_RETRY_BODY_CODES.has(code) && canRetry(code) && attempt < MAX_RETRIES) {
						await sleep(jitteredDelay(attempt));
						continue;
					}
					const safeBody = { ...resp, msg: typeof resp.msg === 'string' ? redactSecrets(resp.msg) : resp.msg };
					bodyError = new NodeApiError(ctx.getNode(), safeBody as JsonObject, {
						message: parseErrorResponse(response),
						httpCode: String(code),
					});
					throw bodyError;
				}
			}

			return response;
		} catch (error) {
			// The retry decision for a body-level code was already made above.
			if (error === bodyError) throw new NodeApiError(ctx.getNode(), bodyError as unknown as JsonObject);
			lastError = error;

			if (error instanceof NodeApiError) {
				const httpCode = Number((error as NodeApiError & { httpCode?: string }).httpCode);
				if (canRetry(httpCode) && attempt < MAX_RETRIES) {
					const retryAfter = Number(retryAfterOf(error));
					const delay = Number.isFinite(retryAfter) && retryAfter > 0
						? Math.min(retryAfter, 60) * 1_000
						: jitteredDelay(attempt);
					await sleep(delay);
					continue;
				}
				// The constructor returns an existing NodeApiError unchanged.
				throw new NodeApiError(ctx.getNode(), error as unknown as JsonObject);
			}

			// A network failure on a write may have reached Suno, so only safe methods resend.
			if (safeMethod && attempt < MAX_RETRIES) {
				await sleep(jitteredDelay(attempt));
				continue;
			}
			break;
		}
	}

	if (lastError instanceof NodeApiError || lastError instanceof NodeOperationError) {
		throw lastError;
	}
	throw new NodeApiError(ctx.getNode(), (lastError ?? {}) as JsonObject, {
		message: 'Suno API request failed',
	});
}

// ---------------------------------------------------------------------------
// Public request functions
// ---------------------------------------------------------------------------

export async function sunoRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	path: string,
	body?: IDataObject | IDataObject[],
	qs?: IDataObject,
	extraOptions?: Partial<IHttpRequestOptions>,
): Promise<unknown> {
	return makeRequest(this, SUNO_BASE_URL, method, path, body, qs, extraOptions);
}

export async function sunoUploadRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	path: string,
	body?: IDataObject | IDataObject[],
	qs?: IDataObject,
	extraOptions?: Partial<IHttpRequestOptions>,
): Promise<unknown> {
	return makeRequest(this, SUNO_UPLOAD_BASE_URL, method, path, body, qs, extraOptions);
}
