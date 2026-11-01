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
// On most endpoints body code 429 means insufficient credits. Retrying cannot succeed.
const NO_RETRY_BODY_CODES = new Set([429]);
// These endpoints document 429 as rate limited and 402 as insufficient credits.
const RATE_LIMIT_429_PATHS = new Set([
	'/api/v1/generate/generate-persona',
	'/api/v1/generate/mashup',
	'/api/v1/generate/replace-section',
]);
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

const IPV4_LITERAL = /^[0-9]{1,3}(?:[.][0-9]{1,3}){3}$/;

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
		// WHATWG URL parsing always rewrites a dotted IPv4 tail as two hex groups.
		const groups = mapped[1].split(':');
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

/** Parses a URL without URL.canParse, which needs Node 18.17 and older n8n 1.x runtimes lack. */
function parseUrl(url: string): URL | undefined {
	try {
		return new URL(url);
	} catch {
		return undefined;
	}
}

export function assertValidUrl(url: string, label: string): void {
	if (!url || typeof url !== 'string') {
		throw new Error(`${label} is required`);
	}
	if (url.length > MAX_URL_LENGTH) {
		throw new Error(`${label} exceeds maximum length of ${MAX_URL_LENGTH} characters`);
	}

	const parsed = parseUrl(url);
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

	// Only an IPv4 literal is checked against private ranges, so a hostname like 10.example.com is allowed.
	if (IPV4_LITERAL.test(hostname) && isPrivateIpv4(hostname)) {
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

export function parseErrorResponse(body: unknown, path?: string): string {
	if (body && typeof body === 'object') {
		const obj = body as Record<string, unknown>;
		const code = obj.code as number | undefined;
		const msg = obj.msg as string | undefined;

		if (code && SUNO_ERROR_MESSAGES[code]) {
			const base =
				code === 429 && path !== undefined && RATE_LIMIT_429_PATHS.has(path)
					? 'Rate limit exceeded — slow down'
					: SUNO_ERROR_MESSAGES[code];
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

/** Reads Retry-After from a full response's headers, or from an error's headers or cause. */
function retryAfterOf(source: unknown): unknown {
	const err = source as {
		headers?: Record<string, unknown>;
		cause?: { response?: { headers?: Record<string, unknown> }; headers?: Record<string, unknown> };
	};
	const headers = err?.headers ?? err?.cause?.response?.headers ?? err?.cause?.headers;
	if (!headers) return undefined;
	const key = Object.keys(headers).find((k) => k.toLowerCase() === 'retry-after');
	const value = key === undefined ? undefined : headers[key];
	return Array.isArray(value) ? value[0] : value;
}

/** Longest Retry-After the node waits through. A longer one stops the retries with a clear message. */
export const MAX_RETRY_AFTER_MS = 60_000;

/** Retry-After in milliseconds, from seconds or an HTTP date, or undefined when absent or invalid. */
export function retryAfterMs(value: unknown, now = Date.now()): number | undefined {
	if (value === undefined || value === null || value === '') return undefined;
	const seconds = Number(value);
	if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1_000;
	const date = Date.parse(String(value));
	return Number.isFinite(date) ? Math.max(date - now, 0) : undefined;
}

function waitNote(wait: number): string {
	return ` Suno asked to wait ${Math.ceil(wait / 1_000)} seconds (Retry-After), longer than this node waits.`;
}

interface FullResponse {
	statusCode: number;
	headers?: Record<string, unknown>;
	body: unknown;
}

function isFullResponse(value: unknown): value is FullResponse {
	return !!value && typeof value === 'object' && typeof (value as FullResponse).statusCode === 'number' && 'body' in (value as object);
}

const SECRET_PATTERNS = [/Bearer\s+[^\s"',;]+/gi, /\b(sk|pk|sp|key)[-_][A-Za-z0-9_-]{8,}\b/g, /\b[A-Fa-f0-9]{24,}\b/g];

/** Masks token-like strings, and the configured key itself, so an upstream echo never reaches the n8n UI. */
export function redactSecrets(text: string, literals: readonly string[] = []): string {
	const masked = SECRET_PATTERNS.reduce((out, pattern) => out.replace(pattern, '[redacted]'), text);
	return literals.reduce((out, literal) => out.split(literal).join('[redacted]'), masked);
}

const MAX_REDACT_DEPTH = 8;

/** Masks token-like strings in every string inside a value. Deeper or repeated objects are replaced, never passed through raw. */
export function redactDeep<T>(value: T, literals: readonly string[] = [], seen = new WeakSet<object>(), depth = 0): T {
	if (typeof value === 'string') return redactSecrets(value, literals) as unknown as T;
	if (!value || typeof value !== 'object') return value;
	if (seen.has(value as object)) return '[circular]' as unknown as T;
	// An Error keeps message and stack in non-enumerable properties, so copy them explicitly.
	if (value instanceof Error && !seen.has(value)) {
		const plain = { ...(value as unknown as Record<string, unknown>), name: value.name, message: value.message, stack: value.stack };
		seen.add(value);
		return redactDeep(plain, literals, seen, depth) as unknown as T;
	}
	if (depth > MAX_REDACT_DEPTH) return '[nested too deep]' as unknown as T;
	seen.add(value as object);
	if (Array.isArray(value)) return value.map((v) => redactDeep(v, literals, seen, depth + 1)) as unknown as T;
	const out: Record<string, unknown> = {};
	// Property names are masked too, since a response can echo a secret as a key.
	for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
		out[redactSecrets(k, literals)] = redactDeep(v, literals, seen, depth + 1);
	}
	return out as T;
}

/** Masks tokens in an n8n error in place, across message, stack, description, messages and any response data it holds. */
function redactError<E extends Error>(error: E, literals: readonly string[]): E {
	const e = error as unknown as Record<string, unknown>;
	for (const key of ['message', 'stack', 'description', 'messages', 'context', 'errorResponse', 'cause']) {
		if (e[key] !== undefined) e[key] = redactDeep(e[key], literals);
	}
	return error;
}

/** The configured API key, masked verbatim wherever an error echoes it. Short or missing keys are skipped. */
async function credentialLiterals(ctx: IExecuteFunctions | ILoadOptionsFunctions): Promise<string[]> {
	try {
		const credentials = await ctx.getCredentials('sunoApi');
		const key = typeof credentials?.apiKey === 'string' ? credentials.apiKey.trim() : '';
		return key.length >= 8 ? [key] : [];
	} catch {
		return [];
	}
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
	// A documented 429 rate limit is a rejection before any work, so any method may resend.
	const limit429 = RATE_LIMIT_429_PATHS.has(safePath);
	const canRetry = (code: number) =>
		RATE_LIMIT_CODES.has(code) || (limit429 && code === 429) || (safeMethod && TRANSIENT_CODES.has(code));
	const noRetryBody = (code: number) => NO_RETRY_BODY_CODES.has(code) && !(limit429 && code === 429);

	// The full response keeps the headers, which n8n drops when it wraps an HTTP error.
	options.returnFullResponse = true;
	options.ignoreHttpStatusErrors = true;

	const literals = await credentialLiterals(ctx);
	let lastError: unknown;
	let thrown: NodeApiError | undefined;
	const fail = (body: object, code: number, message: string) => {
		thrown = redactError(
			new NodeApiError(ctx.getNode(), redactDeep(body, literals) as JsonObject, {
				message: redactSecrets(message, literals),
				httpCode: String(code),
			}),
			literals,
		);
		return thrown;
	};

	for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
		try {
			const raw = await ctx.helpers.httpRequestWithAuthentication.call(ctx, 'sunoApi', options);
			const full: FullResponse = isFullResponse(raw) ? raw : { statusCode: 200, body: raw };

			if (full.statusCode >= 400) {
				const wait = retryAfterMs(retryAfterOf(full));
				if (canRetry(full.statusCode) && attempt < MAX_RETRIES && (wait === undefined || wait <= MAX_RETRY_AFTER_MS)) {
					await sleep(wait ?? jitteredDelay(attempt));
					continue;
				}
				const note = wait !== undefined && wait > MAX_RETRY_AFTER_MS ? waitNote(wait) : '';
				const bodyMessage = full.body && typeof full.body === 'object' ? parseErrorResponse(full.body, safePath) : String(full.body ?? '');
				const known = bodyMessage && bodyMessage !== 'Unknown Suno API error' ? bodyMessage : `Suno API returned HTTP ${full.statusCode}`;
				throw fail(full.body && typeof full.body === 'object' ? full.body : { message: String(full.body ?? '') }, full.statusCode, known + note);
			}

			const response = full.body;
			if (response && typeof response === 'object') {
				const resp = response as Record<string, unknown>;
				const code = resp.code as number | undefined;

				if (code !== undefined && code !== 200) {
					const wait = retryAfterMs(retryAfterOf(full));
					const tooLong = wait !== undefined && wait > MAX_RETRY_AFTER_MS;
					if (!noRetryBody(code) && canRetry(code) && attempt < MAX_RETRIES && !tooLong) {
						await sleep(wait ?? jitteredDelay(attempt));
						continue;
					}
					const note = tooLong ? waitNote(wait) : '';
					throw fail(resp, code, parseErrorResponse(response, safePath) + note);
				}
			}

			return response;
		} catch (error) {
			// The retry decision for an HTTP status or a body-level code was already made above.
			if (error === thrown) throw new NodeApiError(ctx.getNode(), thrown as unknown as JsonObject);
			lastError = error;

			// An HTTP error from a helper that still throws on status. A non-numeric code such as ECONNRESET is a network failure.
			const httpCode = error instanceof NodeApiError ? Number((error as NodeApiError & { httpCode?: string }).httpCode) : NaN;
			if (Number.isFinite(httpCode) && httpCode >= 400) {
				const wait = retryAfterMs(retryAfterOf(error));
				if (canRetry(httpCode) && attempt < MAX_RETRIES && (wait === undefined || wait <= MAX_RETRY_AFTER_MS)) {
					await sleep(wait ?? jitteredDelay(attempt));
					continue;
				}
				// The constructor returns an existing NodeApiError unchanged.
				throw new NodeApiError(ctx.getNode(), redactError(error as NodeApiError, literals) as unknown as JsonObject);
			}

			// A network failure on a write may have reached Suno, so only safe methods resend.
			if (safeMethod && attempt < MAX_RETRIES) {
				await sleep(jitteredDelay(attempt));
				continue;
			}
			break;
		}
	}

	if (lastError instanceof NodeApiError) {
		throw new NodeApiError(ctx.getNode(), redactError(lastError, literals) as unknown as JsonObject);
	}
	if (lastError instanceof NodeOperationError) {
		throw redactError(lastError, literals);
	}
	const cause = lastError instanceof Error ? lastError.message : '';
	throw redactError(
		new NodeApiError(ctx.getNode(), redactDeep(lastError as JsonObject, literals), {
			message: 'Suno API request failed',
			description: cause ? redactSecrets(cause, literals) : undefined,
		}),
		literals,
	);
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
