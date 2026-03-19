/**
 * Security tests: ID injection, SSRF prevention, error message safety
 */

import { createMockContext, MockContext } from './helpers/mockContext';

// ---------------------------------------------------------------------------
// Mock transport layer
// ---------------------------------------------------------------------------

const mockSunoRequest = jest.fn().mockResolvedValue({
	code: 200,
	msg: 'success',
	data: { taskId: 'test-task-123' },
});

const mockSunoUploadRequest = jest.fn().mockResolvedValue({
	code: 200,
	msg: 'success',
	data: {},
});

jest.mock('../nodes/Suno/transport', () => ({
	...jest.requireActual('../nodes/Suno/transport'),
	sunoRequest: mockSunoRequest,
	sunoUploadRequest: mockSunoUploadRequest,
}));

import { assertSafeId, assertValidUrl } from '../nodes/Suno/transport';
import { assertValidCallbackUrl, assertValidUploadUrl } from '../nodes/Suno/utils/validators';

// Handler imports for integration-level ID injection tests
import { handleMusicGeneration } from '../nodes/Suno/resources/musicGeneration/musicGeneration.handler';
import { handleLyrics } from '../nodes/Suno/resources/lyrics/lyrics.handler';
import { handleTaskDetails } from '../nodes/Suno/resources/taskDetails/taskDetails.handler';
import { handleVocalSeparation } from '../nodes/Suno/resources/vocalSeparation/vocalSeparation.handler';
import { handleAudioConversion } from '../nodes/Suno/resources/audioConversion/audioConversion.handler';
import { handleCoverImage } from '../nodes/Suno/resources/coverImage/coverImage.handler';
import { handlePersona } from '../nodes/Suno/resources/persona/persona.handler';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function callHandler<T>(
	handler: (this: any, operation: string, itemIndex: number) => Promise<T>,
	ctx: MockContext,
	operation: string,
	itemIndex = 0,
): Promise<T> {
	return handler.call(ctx, operation, itemIndex);
}

beforeEach(() => {
	jest.clearAllMocks();
});

// ===========================================================================
// ID Injection
// ===========================================================================

describe('ID Injection Prevention', () => {
	const MALICIOUS_IDS = [
		'../etc/passwd',
		'id; DROP TABLE users',
		'id\' OR 1=1 --',
		'id" OR 1=1 --',
		'../../../etc/shadow',
		'id\ninjected-header: evil',
		'id<script>alert(1)</script>',
		'id%00null',
		'id; curl evil.com',
		'id && rm -rf /',
		'id | cat /etc/passwd',
		'id`whoami`',
		'id$(whoami)',
	];

	describe('assertSafeId rejects all injection patterns', () => {
		it.each(MALICIOUS_IDS)('rejects: %s', (id) => {
			expect(() => assertSafeId(id, 'ID')).toThrow('invalid characters');
		});
	});

	// -----------------------------------------------------------------------
	// Test ID injection through every handler that takes taskId/audioId
	// -----------------------------------------------------------------------

	describe('musicGeneration - extend rejects malicious audioId', () => {
		it.each(MALICIOUS_IDS)('rejects audioId: %s', async (id) => {
			const ctx = createMockContext({
				defaultParamFlag: false,
				audioId: id,
				callBackUrl: 'https://example.com/cb',
				model: 'V4_5',
				negativeTags: '',
				personaId: '',
				personaModel: '',
				vocalGender: '',
				styleWeight: undefined,
				weirdnessConstraint: undefined,
				audioWeight: undefined,
			});
			await expect(
				callHandler(handleMusicGeneration, ctx, 'extend'),
			).rejects.toThrow('invalid characters');
			expect(mockSunoRequest).not.toHaveBeenCalled();
		});
	});

	describe('musicGeneration - replaceSection rejects malicious taskId', () => {
		it.each(MALICIOUS_IDS)('rejects taskId: %s', async (id) => {
			const ctx = createMockContext({
				taskId: id,
				audioId: 'valid-id',
				prompt: 'test',
				tags: 'test',
				title: 'test',
				infillStartS: 10,
				infillEndS: 30,
				negativeTags: '',
				callBackUrl: '',
			});
			await expect(
				callHandler(handleMusicGeneration, ctx, 'replaceSection'),
			).rejects.toThrow('invalid characters');
			expect(mockSunoRequest).not.toHaveBeenCalled();
		});
	});

	describe('musicGeneration - replaceSection rejects malicious audioId', () => {
		it.each(MALICIOUS_IDS)('rejects audioId: %s', async (id) => {
			const ctx = createMockContext({
				taskId: 'valid-task',
				audioId: id,
				prompt: 'test',
				tags: 'test',
				title: 'test',
				infillStartS: 10,
				infillEndS: 30,
				negativeTags: '',
				callBackUrl: '',
			});
			await expect(
				callHandler(handleMusicGeneration, ctx, 'replaceSection'),
			).rejects.toThrow('invalid characters');
			expect(mockSunoRequest).not.toHaveBeenCalled();
		});
	});

	describe('lyrics - getTimestamped rejects malicious IDs', () => {
		it.each(MALICIOUS_IDS)('rejects taskId: %s', async (id) => {
			const ctx = createMockContext({
				taskId: id,
				audioId: 'valid-id',
			});
			await expect(
				callHandler(handleLyrics, ctx, 'getTimestamped'),
			).rejects.toThrow('invalid characters');
			expect(mockSunoRequest).not.toHaveBeenCalled();
		});

		it.each(MALICIOUS_IDS)('rejects audioId: %s', async (id) => {
			const ctx = createMockContext({
				taskId: 'valid-task',
				audioId: id,
			});
			await expect(
				callHandler(handleLyrics, ctx, 'getTimestamped'),
			).rejects.toThrow('invalid characters');
			expect(mockSunoRequest).not.toHaveBeenCalled();
		});
	});

	describe('taskDetails rejects malicious taskId', () => {
		it.each(MALICIOUS_IDS)('rejects taskId: %s', async (id) => {
			const ctx = createMockContext({ taskId: id });
			await expect(
				callHandler(handleTaskDetails, ctx, 'getMusicDetails'),
			).rejects.toThrow('invalid characters');
			expect(mockSunoRequest).not.toHaveBeenCalled();
		});
	});

	describe('vocalSeparation rejects malicious IDs', () => {
		it.each(MALICIOUS_IDS)('rejects taskId: %s', async (id) => {
			const ctx = createMockContext({
				taskId: id,
				audioId: 'valid-id',
				callBackUrl: 'https://example.com/cb',
				type: 'separate_vocal',
			});
			await expect(
				callHandler(handleVocalSeparation, ctx, 'generate'),
			).rejects.toThrow('invalid characters');
			expect(mockSunoRequest).not.toHaveBeenCalled();
		});
	});

	describe('audioConversion - convertWav rejects malicious IDs', () => {
		it.each(MALICIOUS_IDS)('rejects taskId: %s', async (id) => {
			const ctx = createMockContext({
				taskId: id,
				audioId: 'valid-id',
				callBackUrl: 'https://example.com/cb',
			});
			await expect(
				callHandler(handleAudioConversion, ctx, 'convertWav'),
			).rejects.toThrow('invalid characters');
			expect(mockSunoRequest).not.toHaveBeenCalled();
		});
	});

	describe('coverImage rejects malicious taskId', () => {
		it.each(MALICIOUS_IDS)('rejects taskId: %s', async (id) => {
			const ctx = createMockContext({
				taskId: id,
				callBackUrl: 'https://example.com/cb',
			});
			await expect(
				callHandler(handleCoverImage, ctx, 'generate'),
			).rejects.toThrow('invalid characters');
			expect(mockSunoRequest).not.toHaveBeenCalled();
		});
	});

	describe('persona rejects malicious IDs', () => {
		it.each(MALICIOUS_IDS)('rejects taskId: %s', async (id) => {
			const ctx = createMockContext({
				taskId: id,
				audioId: 'valid-id',
				name: 'Test',
				description: 'Test description',
				vocalStart: 5,
				vocalEnd: 25,
				style: '',
			});
			await expect(
				callHandler(handlePersona, ctx, 'generate'),
			).rejects.toThrow('invalid characters');
			expect(mockSunoRequest).not.toHaveBeenCalled();
		});

		it.each(MALICIOUS_IDS)('rejects audioId: %s', async (id) => {
			const ctx = createMockContext({
				taskId: 'valid-task',
				audioId: id,
				name: 'Test',
				description: 'Test description',
				vocalStart: 5,
				vocalEnd: 25,
				style: '',
			});
			await expect(
				callHandler(handlePersona, ctx, 'generate'),
			).rejects.toThrow('invalid characters');
			expect(mockSunoRequest).not.toHaveBeenCalled();
		});
	});
});

// ===========================================================================
// SSRF Prevention
// ===========================================================================

describe('SSRF Prevention', () => {
	const SSRF_VECTORS = [
		'http://127.0.0.1/admin',
		'http://127.0.0.1:8080/internal',
		'http://10.0.0.1/internal',
		'http://10.255.255.255/internal',
		'http://172.16.0.1/internal',
		'http://172.31.255.255/internal',
		'http://192.168.0.1/internal',
		'http://192.168.1.100/internal',
		'http://localhost/admin',
		'http://localhost:3000/internal',
		'http://0.0.0.0/admin',
		'ftp://example.com/file',
		'file:///etc/passwd',
		'javascript:alert(1)',
	];

	// HTTPS versions of private IPs (still SSRF)
	const HTTPS_PRIVATE_VECTORS = [
		'https://127.0.0.1/admin',
		'https://10.0.0.1/internal',
		'https://172.16.0.1/internal',
		'https://192.168.0.1/internal',
		'https://localhost/admin',
		'https://0.0.0.0/admin',
	];

	describe('assertValidUrl blocks non-HTTPS protocols', () => {
		it.each(SSRF_VECTORS)('rejects: %s', (url) => {
			expect(() => assertValidUrl(url, 'Test URL')).toThrow();
		});
	});

	describe('assertValidUrl blocks private IP addresses over HTTPS', () => {
		it.each(HTTPS_PRIVATE_VECTORS)('rejects: %s', (url) => {
			expect(() => assertValidUrl(url, 'Test URL')).toThrow();
		});
	});

	describe('assertValidCallbackUrl blocks SSRF vectors', () => {
		it.each([...SSRF_VECTORS, ...HTTPS_PRIVATE_VECTORS])('rejects: %s', (url) => {
			expect(() => assertValidCallbackUrl(url)).toThrow();
		});
	});

	describe('assertValidUploadUrl blocks SSRF vectors', () => {
		it.each([...SSRF_VECTORS, ...HTTPS_PRIVATE_VECTORS])('rejects: %s', (url) => {
			expect(() => assertValidUploadUrl(url)).toThrow();
		});
	});

	describe('allows legitimate HTTPS URLs', () => {
		const VALID_URLS = [
			'https://example.com/callback',
			'https://api.myservice.com/webhook',
			'https://cdn.example.org/file.mp3',
		];

		it.each(VALID_URLS)('accepts: %s', (url) => {
			expect(() => assertValidUrl(url, 'URL')).not.toThrow();
			expect(() => assertValidCallbackUrl(url)).not.toThrow();
			expect(() => assertValidUploadUrl(url)).not.toThrow();
		});
	});

	// IPv6 SSRF
	describe('blocks IPv6 private addresses', () => {
		it('rejects ::1 (IPv6 loopback) in URL validation', () => {
			// Browsers and URL parsers may handle [::1] differently.
			// The key is the transport-level assertValidUrl should catch them.
			expect(() => assertValidUrl('https://[::1]/admin', 'Test URL')).toThrow();
		});
	});
});

// ===========================================================================
// Error Message Safety
// ===========================================================================

describe('Error Message Safety', () => {
	it('assertSafeId error message does not echo back the full malicious input', () => {
		const malicious = 'x'.repeat(200) + '; DROP TABLE users';
		try {
			assertSafeId(malicious, 'ID');
			fail('Should have thrown');
		} catch (e: any) {
			// The error message should mention "invalid characters" but NOT contain
			// the full SQL injection payload
			expect(e.message).toContain('invalid characters');
			expect(e.message).not.toContain('DROP TABLE');
		}
	});

	it('assertValidUrl error does not leak the API key if embedded in URL', () => {
		const urlWithKey = 'http://evil.com/?key=sk-secret-api-key-12345';
		try {
			assertValidUrl(urlWithKey, 'URL');
			fail('Should have thrown');
		} catch (e: any) {
			// Should fail because it is not HTTPS, error should be generic
			expect(e.message).toContain('HTTPS');
			// The error message should NOT contain the actual secret key
			expect(e.message).not.toContain('sk-secret-api-key-12345');
		}
	});

	it('error messages from invalid IDs are generic and safe', () => {
		const xssPayload = '<script>alert("xss")</script>';
		try {
			assertSafeId(xssPayload, 'ID');
			fail('Should have thrown');
		} catch (e: any) {
			expect(e.message).not.toContain('<script>');
		}
	});
});
