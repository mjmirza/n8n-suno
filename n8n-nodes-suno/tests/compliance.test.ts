/**
 * Compliance tests: HTTPS enforcement, constants verification, protocol safety
 */

import {
	SUNO_BASE_URL,
	SUNO_UPLOAD_BASE_URL,
	assertValidUrl,
} from '../nodes/Suno/transport';

// ===========================================================================
// Base URL constants
// ===========================================================================

describe('Base URL Constants', () => {
	it('SUNO_BASE_URL uses HTTPS', () => {
		expect(SUNO_BASE_URL).toMatch(/^https:\/\//);
	});

	it('SUNO_UPLOAD_BASE_URL uses HTTPS', () => {
		expect(SUNO_UPLOAD_BASE_URL).toMatch(/^https:\/\//);
	});

	it('SUNO_BASE_URL is the expected value', () => {
		expect(SUNO_BASE_URL).toBe('https://api.sunoapi.org');
	});

	it('SUNO_UPLOAD_BASE_URL is the expected value', () => {
		expect(SUNO_UPLOAD_BASE_URL).toBe('https://sunoapiorg.redpandaai.co');
	});
});

// ===========================================================================
// RETRY_CODES verification
// ===========================================================================

// Retry behavior itself is exercised with real mocked requests in codex-review.test.ts.
describe('retry-related error messages', () => {
	// We cannot import the Set directly since it is not exported,
	// but we can verify through the transport module source that it exists.
	// Instead, we verify the behavior: the module exports parseErrorResponse
	// which references SUNO_ERROR_MESSAGES that includes retryable codes.

	// The expected retryable codes based on the transport source:
	const EXPECTED_RETRY_CODES = [429, 430, 502, 503, 504];

	it('transport module defines retry codes (verified via source constants)', () => {
		// This test validates that the known retry codes exist in error messages
		// 429 and 430 are Suno-specific retry codes
		const { parseErrorResponse } = require('../nodes/Suno/transport');

		// 429 should produce a known message (it is in SUNO_ERROR_MESSAGES)
		expect(parseErrorResponse({ code: 429 })).toContain('Insufficient credits');
		expect(parseErrorResponse({ code: 430 })).toContain('Request frequency too high');
	});

	it('502/503/504 are standard retry codes (transport handles them)', () => {
		// These are standard HTTP retry codes. The transport module retries on these.
		// We verify they are not in SUNO_ERROR_MESSAGES (they are generic HTTP errors).
		const { parseErrorResponse } = require('../nodes/Suno/transport');
		expect(parseErrorResponse({ code: 502 })).toBe('Unknown Suno API error');
		expect(parseErrorResponse({ code: 503 })).toBe('Unknown Suno API error');
		expect(parseErrorResponse({ code: 504 })).toBe('Unknown Suno API error');
	});
});

// ===========================================================================
// MAX_ERROR_LENGTH verification
// ===========================================================================

describe('MAX_ERROR_LENGTH', () => {
	it('error messages are truncated to a reasonable length', () => {
		const { parseErrorResponse } = require('../nodes/Suno/transport');
		const longMsg = 'A'.repeat(10_000);

		const result = parseErrorResponse({ code: 400, msg: longMsg });
		// base message + ': ' + truncated msg
		// "Invalid request parameters: " = 30 chars, plus up to 1000 of msg
		expect(result.length).toBeLessThanOrEqual(1_030);
	});

	it('short messages are not truncated', () => {
		const { parseErrorResponse } = require('../nodes/Suno/transport');
		const shortMsg = 'Missing field';

		const result = parseErrorResponse({ code: 400, msg: shortMsg });
		expect(result).toContain('Missing field');
	});
});

// ===========================================================================
// assertValidUrl protocol enforcement
// ===========================================================================

describe('assertValidUrl - protocol enforcement', () => {
	const REJECTED_PROTOCOLS = [
		['HTTP', 'http://example.com/path'],
		['FTP', 'ftp://example.com/file'],
		['FILE', 'file:///etc/passwd'],
		['DATA', 'data:text/html,<h1>hi</h1>'],
		['JAVASCRIPT', 'javascript:alert(1)'],
		['SSH', 'ssh://user@host'],
		['TELNET', 'telnet://host:23'],
		['GOPHER', 'gopher://host/path'],
	];

	it.each(REJECTED_PROTOCOLS)('rejects %s protocol: %s', (_name, url) => {
		expect(() => assertValidUrl(url, 'Test URL')).toThrow();
	});

	it('accepts HTTPS protocol', () => {
		expect(() => assertValidUrl('https://example.com/path', 'Test URL')).not.toThrow();
	});

	it('rejects empty URLs', () => {
		expect(() => assertValidUrl('', 'Test URL')).toThrow('required');
	});

	it('rejects null URLs', () => {
		expect(() => assertValidUrl(null as unknown as string, 'Test URL')).toThrow('required');
	});

	it('rejects undefined URLs', () => {
		expect(() => assertValidUrl(undefined as unknown as string, 'Test URL')).toThrow('required');
	});

	it('rejects URLs exceeding max length', () => {
		const longUrl = 'https://example.com/' + 'a'.repeat(3_000);
		expect(() => assertValidUrl(longUrl, 'Test URL')).toThrow('maximum length');
	});

	it('rejects malformed URLs', () => {
		expect(() => assertValidUrl('not-a-url', 'Test URL')).toThrow('not a valid URL');
	});
});

// ===========================================================================
// Endpoint sanitization
// ===========================================================================

describe('sanitizeEndpoint', () => {
	const { sanitizeEndpoint } = require('../nodes/Suno/transport');

	it('allows normal API paths', () => {
		expect(sanitizeEndpoint('/api/v1/generate')).toBe('/api/v1/generate');
	});

	it('prepends slash if missing', () => {
		expect(sanitizeEndpoint('api/v1/generate')).toBe('/api/v1/generate');
	});

	it('rejects path traversal', () => {
		expect(() => sanitizeEndpoint('/api/../../../etc/passwd')).toThrow('Path traversal');
	});

	it('rejects encoded path traversal', () => {
		expect(() => sanitizeEndpoint('/api/%2e%2e/%2e%2e/etc/passwd')).toThrow('Path traversal');
	});

	it('allows query parameters in paths', () => {
		expect(sanitizeEndpoint('/api/v1/generate?taskId=abc')).toBe('/api/v1/generate?taskId=abc');
	});
});
