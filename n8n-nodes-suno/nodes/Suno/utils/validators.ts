import { assertValidUrl, assertInRange } from '../transport';

// ---------------------------------------------------------------------------
// Model-dependent limits
// ---------------------------------------------------------------------------

const PROMPT_LIMITS: Record<string, number> = {
	V6: 5_000,
	V6_MINI: 5_000,
	V6_WILD: 5_000,
	V5_5: 5_000,
	V4: 3_000,
	V4_5: 5_000,
	V4_5PLUS: 5_000,
	V4_5ALL: 5_000,
	V5: 5_000,
};

const STYLE_LIMITS: Record<string, number> = {
	V6: 1_000,
	V6_MINI: 1_000,
	V6_WILD: 1_000,
	V5_5: 1_000,
	V4: 200,
	V4_5: 1_000,
	V4_5PLUS: 1_000,
	V4_5ALL: 1_000,
	V5: 1_000,
};

const TITLE_LIMITS: Record<string, number> = {
	V4: 80,
	V4_5: 100,
	V4_5PLUS: 100,
	V4_5ALL: 80,
	V5: 100,
};

// docs.sunoapi.org/suno-api/generate-music: the non-custom prompt allows 3000 characters on every model.
const NON_CUSTOM_PROMPT_LIMIT = 3_000;

// ---------------------------------------------------------------------------
// URL validators
// ---------------------------------------------------------------------------

export function assertValidCallbackUrl(url: string): void {
	assertValidUrl(url, 'Callback URL');
}

export function assertValidUploadUrl(url: string): void {
	assertValidUrl(url, 'Upload URL');
}

// ---------------------------------------------------------------------------
// Length validators
// ---------------------------------------------------------------------------

export function assertPromptLength(prompt: string, model: string, customMode: boolean): void {
	if (!prompt || typeof prompt !== 'string') {
		return;
	}
	const maxLength = customMode
		? (PROMPT_LIMITS[model] ?? 5_000)
		: NON_CUSTOM_PROMPT_LIMIT;
	if (prompt.length > maxLength) {
		throw new Error(
			`Prompt exceeds maximum length of ${maxLength} characters for ${customMode ? 'custom mode' : 'non-custom mode'} with model ${model} (got ${prompt.length})`,
		);
	}
}

export function styleLimit(model: string): number {
	return STYLE_LIMITS[model] ?? 1_000;
}

export function assertStyleLength(style: string, model: string): void {
	if (!style || typeof style !== 'string') {
		return;
	}
	const maxLength = styleLimit(model);
	if (style.length > maxLength) {
		throw new Error(
			`Style exceeds maximum length of ${maxLength} characters for model ${model} (got ${style.length})`,
		);
	}
}

/** An endpoint with one documented title limit for every model passes it as `endpointLimit`. */
export function assertTitleLength(title: string, model: string, endpointLimit?: number): void {
	if (!title || typeof title !== 'string') {
		return;
	}
	const maxLength = endpointLimit ?? TITLE_LIMITS[model] ?? 100;
	if (title.length > maxLength) {
		throw new Error(
			`Title exceeds maximum length of ${maxLength} characters for model ${model} (got ${title.length})`,
		);
	}
}

// ---------------------------------------------------------------------------
// Numeric validators
// ---------------------------------------------------------------------------

export function assertWeightValue(value: number, label: string): void {
	assertInRange(value, 0, 1, label);
}

export function assertDurationRange(startS: number, endS: number): void {
	if (typeof startS !== 'number' || !Number.isFinite(startS)) {
		throw new Error('Start time must be a finite number');
	}
	if (typeof endS !== 'number' || !Number.isFinite(endS)) {
		throw new Error('End time must be a finite number');
	}
	if (startS >= endS) {
		throw new Error('Start time must be less than end time');
	}
	const duration = endS - startS;
	if (duration < 10) {
		throw new Error(`Replacement duration must be at least 10 seconds (got ${duration.toFixed(2)})`);
	}
}

export function assertVocalSegment(start: number, end: number): void {
	if (typeof start !== 'number' || !Number.isFinite(start)) {
		throw new Error('Vocal start must be a finite number');
	}
	if (typeof end !== 'number' || !Number.isFinite(end)) {
		throw new Error('Vocal end must be a finite number');
	}
	if (start >= end) {
		throw new Error('Vocal start must be less than vocal end');
	}
	const segment = end - start;
	if (segment < 10) {
		throw new Error(`Vocal segment must be at least 10 seconds (got ${segment.toFixed(2)})`);
	}
	if (segment > 30) {
		throw new Error(`Vocal segment must not exceed 30 seconds (got ${segment.toFixed(2)})`);
	}
}

// ---------------------------------------------------------------------------
// Data validators
// ---------------------------------------------------------------------------

const BASE64_PATTERN = /^[A-Za-z0-9+/]+=*$/;
const DATA_URL_PATTERN = /^data:[a-zA-Z0-9/+.-]+;base64,/;

export function assertBase64Data(data: string): void {
	if (!data || typeof data !== 'string') {
		throw new Error('Base64 data is required');
	}
	if (DATA_URL_PATTERN.test(data)) {
		const payload = data.replace(DATA_URL_PATTERN, '');
		if (!BASE64_PATTERN.test(payload)) {
			throw new Error('Invalid base64 encoding in data URL');
		}
		return;
	}
	if (!BASE64_PATTERN.test(data)) {
		throw new Error('Invalid base64 encoding');
	}
}

export function assertUploadUrlList(urls: string[]): void {
	if (!Array.isArray(urls) || urls.length !== 2) {
		throw new Error('Mashup requires exactly 2 audio URLs');
	}
	for (let i = 0; i < urls.length; i++) {
		assertValidUrl(urls[i], `Upload URL ${i + 1}`);
	}
}
