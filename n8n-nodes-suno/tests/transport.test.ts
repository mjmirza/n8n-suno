import {
	assertSafeId,
	sanitizeEndpoint,
	assertValidUrl,
	assertInRange,
	assertNonEmpty,
	parseErrorResponse,
} from '../nodes/Suno/transport';

// ---------------------------------------------------------------------------
// assertSafeId
// ---------------------------------------------------------------------------

describe('assertSafeId', () => {
	it.each([
		'abc123',
		'task-id-here',
		'audio_id_123',
		'A',
		'0',
		'a-b_c',
	])('accepts valid ID "%s"', (id) => {
		expect(() => assertSafeId(id, 'ID')).not.toThrow();
	});

	it('rejects empty string', () => {
		expect(() => assertSafeId('', 'ID')).toThrow('ID is required');
	});

	it('rejects path traversal', () => {
		expect(() => assertSafeId('../etc/passwd', 'ID')).toThrow('invalid characters');
	});

	it('rejects SQL injection attempt', () => {
		expect(() => assertSafeId('id;DROP TABLE', 'ID')).toThrow('invalid characters');
	});

	it('rejects ID with spaces', () => {
		expect(() => assertSafeId('id with spaces', 'ID')).toThrow('invalid characters');
	});

	it('rejects null', () => {
		expect(() => assertSafeId(null as unknown as string, 'ID')).toThrow('ID is required');
	});

	it('rejects undefined', () => {
		expect(() => assertSafeId(undefined as unknown as string, 'ID')).toThrow('ID is required');
	});

	it('rejects IDs longer than 255 characters', () => {
		const longId = 'a'.repeat(256);
		expect(() => assertSafeId(longId, 'ID')).toThrow('exceeds maximum length');
	});

	it('accepts ID of exactly 255 characters', () => {
		const maxId = 'a'.repeat(255);
		expect(() => assertSafeId(maxId, 'ID')).not.toThrow();
	});

	it('rejects unicode characters', () => {
		expect(() => assertSafeId('id\u00e9', 'ID')).toThrow('invalid characters');
	});

	it('rejects emoji characters', () => {
		expect(() => assertSafeId('id\u{1F600}', 'ID')).toThrow('invalid characters');
	});
});

// ---------------------------------------------------------------------------
// sanitizeEndpoint
// ---------------------------------------------------------------------------

describe('sanitizeEndpoint', () => {
	it('accepts valid API paths', () => {
		expect(sanitizeEndpoint('/api/v1/generate')).toBe('/api/v1/generate');
	});

	it('accepts wav generate path', () => {
		expect(sanitizeEndpoint('/api/v1/wav/generate')).toBe('/api/v1/wav/generate');
	});

	it('prepends slash when missing', () => {
		expect(sanitizeEndpoint('api/v1/generate')).toBe('/api/v1/generate');
	});

	it('rejects path traversal with ../', () => {
		expect(() => sanitizeEndpoint('../etc')).toThrow('Path traversal');
	});

	it('rejects encoded path traversal', () => {
		expect(() => sanitizeEndpoint('..%2F..%2Fetc')).toThrow('Path traversal');
	});

	it('rejects path traversal in the middle', () => {
		expect(() => sanitizeEndpoint('/api/../admin')).toThrow('Path traversal');
	});

	it('rejects invalid characters', () => {
		expect(() => sanitizeEndpoint('/api/v1/gen;erate')).toThrow('invalid characters');
	});

	it('rejects newlines', () => {
		expect(() => sanitizeEndpoint('/api/v1/gen\nerate')).toThrow('invalid characters');
	});
});

// ---------------------------------------------------------------------------
// assertValidUrl (SSRF protection)
// ---------------------------------------------------------------------------

describe('assertValidUrl', () => {
	it('accepts valid HTTPS URL', () => {
		expect(() => assertValidUrl('https://example.com/callback', 'URL')).not.toThrow();
	});

	it('rejects HTTP', () => {
		expect(() => assertValidUrl('http://example.com', 'URL')).toThrow('must use HTTPS');
	});

	it('rejects file://', () => {
		expect(() => assertValidUrl('file:///etc/passwd', 'URL')).toThrow('must use HTTPS');
	});

	it('rejects ftp://', () => {
		expect(() => assertValidUrl('ftp://example.com', 'URL')).toThrow('must use HTTPS');
	});

	it.each([
		['127.0.0.1', 'local address'],
		['10.0.0.1', 'private IP'],
		['172.16.0.1', 'private IP'],
		['192.168.1.1', 'private IP'],
		['169.254.1.1', 'private IP'],
	])('rejects private IP %s', (ip) => {
		expect(() => assertValidUrl(`https://${ip}/callback`, 'URL')).toThrow();
	});

	it('rejects 0.0.0.0', () => {
		expect(() => assertValidUrl('https://0.0.0.0/callback', 'URL')).toThrow('local address');
	});

	it('rejects localhost', () => {
		expect(() => assertValidUrl('https://localhost/callback', 'URL')).toThrow('local address');
	});

	it('rejects IPv6 loopback ::1', () => {
		expect(() => assertValidUrl('https://[::1]/callback', 'URL')).toThrow();
	});

	it('rejects empty string', () => {
		expect(() => assertValidUrl('', 'URL')).toThrow('URL is required');
	});

	it('rejects null', () => {
		expect(() => assertValidUrl(null as unknown as string, 'URL')).toThrow('URL is required');
	});

	it('rejects URL longer than 2048 characters', () => {
		const longUrl = 'https://example.com/' + 'a'.repeat(2049);
		expect(() => assertValidUrl(longUrl, 'URL')).toThrow('exceeds maximum length');
	});

	it('accepts URL of exactly 2048 characters', () => {
		const baseUrl = 'https://example.com/';
		const url = baseUrl + 'a'.repeat(2048 - baseUrl.length);
		expect(() => assertValidUrl(url, 'URL')).not.toThrow();
	});

	it('rejects invalid URL format', () => {
		expect(() => assertValidUrl('not-a-url', 'URL')).toThrow('not a valid URL');
	});
});

// ---------------------------------------------------------------------------
// assertInRange
// ---------------------------------------------------------------------------

describe('assertInRange', () => {
	it('accepts value within range', () => {
		expect(() => assertInRange(0.5, 0, 1, 'Weight')).not.toThrow();
	});

	it('accepts min boundary', () => {
		expect(() => assertInRange(0, 0, 1, 'Weight')).not.toThrow();
	});

	it('accepts max boundary', () => {
		expect(() => assertInRange(1, 0, 1, 'Weight')).not.toThrow();
	});

	it('rejects NaN', () => {
		expect(() => assertInRange(NaN, 0, 1, 'Weight')).toThrow('finite number');
	});

	it('rejects Infinity', () => {
		expect(() => assertInRange(Infinity, 0, 1, 'Weight')).toThrow('finite number');
	});

	it('rejects -Infinity', () => {
		expect(() => assertInRange(-Infinity, 0, 1, 'Weight')).toThrow('finite number');
	});

	it('rejects value below min', () => {
		expect(() => assertInRange(-0.1, 0, 1, 'Weight')).toThrow('must be between');
	});

	it('rejects value above max', () => {
		expect(() => assertInRange(1.1, 0, 1, 'Weight')).toThrow('must be between');
	});
});

// ---------------------------------------------------------------------------
// assertNonEmpty
// ---------------------------------------------------------------------------

describe('assertNonEmpty', () => {
	it('returns trimmed string for valid input', () => {
		expect(assertNonEmpty('  hello  ', 'Field')).toBe('hello');
	});

	it('rejects empty string', () => {
		expect(() => assertNonEmpty('', 'Field')).toThrow('required and cannot be empty');
	});

	it('rejects whitespace-only string', () => {
		expect(() => assertNonEmpty('   ', 'Field')).toThrow('required and cannot be empty');
	});

	it('rejects null', () => {
		expect(() => assertNonEmpty(null as unknown as string, 'Field')).toThrow('required and cannot be empty');
	});

	it('enforces max length', () => {
		expect(() => assertNonEmpty('abcdef', 'Field', 5)).toThrow('exceeds maximum length of 5');
	});

	it('accepts string at max length', () => {
		expect(assertNonEmpty('abcde', 'Field', 5)).toBe('abcde');
	});

	it('accepts string without max length constraint', () => {
		const longStr = 'x'.repeat(10_000);
		expect(assertNonEmpty(longStr, 'Field')).toBe(longStr);
	});
});

// ---------------------------------------------------------------------------
// parseErrorResponse
// ---------------------------------------------------------------------------

describe('parseErrorResponse', () => {
	it.each([
		[400, 'Invalid request parameters'],
		[401, 'Invalid API key'],
		[402, 'Insufficient credits'],
		[404, 'Resource not found'],
		[405, 'Rate limit exceeded'],
		[429, 'Insufficient credits'],
		[500, 'Suno server error'],
	])('returns known message for code %d', (code, expected) => {
		const result = parseErrorResponse({ code });
		expect(result).toContain(expected);
	});

	it('appends msg to known code', () => {
		const result = parseErrorResponse({ code: 400, msg: 'bad field' });
		expect(result).toBe('Invalid request parameters: bad field');
	});

	it('returns msg for unknown code', () => {
		const result = parseErrorResponse({ code: 999, msg: 'custom error' });
		expect(result).toBe('custom error');
	});

	it('returns generic message for unknown structure', () => {
		expect(parseErrorResponse({})).toBe('Unknown Suno API error');
	});

	it('returns generic message for null', () => {
		expect(parseErrorResponse(null)).toBe('Unknown Suno API error');
	});

	it('returns generic message for string body', () => {
		expect(parseErrorResponse('error text')).toBe('Unknown Suno API error');
	});

	it('truncates long msg to 1000 characters', () => {
		const longMsg = 'x'.repeat(2000);
		const result = parseErrorResponse({ code: 999, msg: longMsg });
		expect(result.length).toBe(1000);
	});
});
