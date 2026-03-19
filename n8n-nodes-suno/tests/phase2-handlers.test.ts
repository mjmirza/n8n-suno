/**
 * Phase 2 handler tests: vocalSeparation, audioConversion, styleBoost, coverImage
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

jest.mock('../nodes/Suno/transport', () => ({
	...jest.requireActual('../nodes/Suno/transport'),
	sunoRequest: mockSunoRequest,
	sunoUploadRequest: jest.fn().mockResolvedValue({ code: 200, msg: 'success', data: {} }),
}));

import { handleVocalSeparation } from '../nodes/Suno/resources/vocalSeparation/vocalSeparation.handler';
import { handleAudioConversion } from '../nodes/Suno/resources/audioConversion/audioConversion.handler';
import { handleStyleBoost } from '../nodes/Suno/resources/styleBoost/styleBoost.handler';
import { handleCoverImage } from '../nodes/Suno/resources/coverImage/coverImage.handler';

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
	mockSunoRequest.mockResolvedValue({
		code: 200,
		msg: 'success',
		data: { taskId: 'test-task-123' },
	});
});

// ===========================================================================
// Vocal Separation
// ===========================================================================

describe('handleVocalSeparation', () => {
	const baseParams = {
		taskId: 'task-abc',
		audioId: 'audio-def',
		callBackUrl: 'https://example.com/callback',
		type: 'separate_vocal',
	};

	it('calls POST /api/v1/vocal-removal/generate', async () => {
		const ctx = createMockContext(baseParams);
		await callHandler(handleVocalSeparation, ctx, 'generate');

		const [method, endpoint, body] = mockSunoRequest.mock.calls[0];
		expect(method).toBe('POST');
		expect(endpoint).toBe('/api/v1/vocal-removal/generate');
		expect(body).toMatchObject({
			taskId: 'task-abc',
			audioId: 'audio-def',
			callBackUrl: 'https://example.com/callback',
			type: 'separate_vocal',
		});
	});

	it('sends type=separate_vocal', async () => {
		const ctx = createMockContext({ ...baseParams, type: 'separate_vocal' });
		await callHandler(handleVocalSeparation, ctx, 'generate');

		const body = mockSunoRequest.mock.calls[0][2];
		expect(body.type).toBe('separate_vocal');
	});

	it('sends type=split_stem', async () => {
		const ctx = createMockContext({ ...baseParams, type: 'split_stem' });
		await callHandler(handleVocalSeparation, ctx, 'generate');

		const body = mockSunoRequest.mock.calls[0][2];
		expect(body.type).toBe('split_stem');
	});

	it('throws on unknown operation', async () => {
		const ctx = createMockContext({});
		await expect(
			callHandler(handleVocalSeparation, ctx, 'nonexistent'),
		).rejects.toThrow('Unknown vocalSeparation operation');
	});
});

// ===========================================================================
// Audio Conversion
// ===========================================================================

describe('handleAudioConversion', () => {
	// -----------------------------------------------------------------------
	// convertWav
	// -----------------------------------------------------------------------
	describe('convertWav', () => {
		const baseParams = {
			taskId: 'task-wav',
			audioId: 'audio-wav',
			callBackUrl: 'https://example.com/callback',
		};

		it('calls POST /api/v1/wav/generate', async () => {
			const ctx = createMockContext(baseParams);
			await callHandler(handleAudioConversion, ctx, 'convertWav');

			const [method, endpoint, body] = mockSunoRequest.mock.calls[0];
			expect(method).toBe('POST');
			expect(endpoint).toBe('/api/v1/wav/generate');
			expect(body).toMatchObject({
				taskId: 'task-wav',
				audioId: 'audio-wav',
				callBackUrl: 'https://example.com/callback',
			});
		});
	});

	// -----------------------------------------------------------------------
	// generateMidi
	// -----------------------------------------------------------------------
	describe('generateMidi', () => {
		const baseParams = {
			taskId: 'task-midi',
			callBackUrl: 'https://example.com/callback',
			audioId: '',
		};

		it('calls POST /api/v1/midi/generate', async () => {
			const ctx = createMockContext(baseParams);
			await callHandler(handleAudioConversion, ctx, 'generateMidi');

			const [method, endpoint, body] = mockSunoRequest.mock.calls[0];
			expect(method).toBe('POST');
			expect(endpoint).toBe('/api/v1/midi/generate');
			expect(body).toMatchObject({
				taskId: 'task-midi',
				callBackUrl: 'https://example.com/callback',
			});
		});

		it('omits audioId when empty', async () => {
			const ctx = createMockContext(baseParams);
			await callHandler(handleAudioConversion, ctx, 'generateMidi');

			const body = mockSunoRequest.mock.calls[0][2];
			expect(body).not.toHaveProperty('audioId');
		});

		it('includes audioId when provided', async () => {
			const ctx = createMockContext({ ...baseParams, audioId: 'audio-midi-123' });
			await callHandler(handleAudioConversion, ctx, 'generateMidi');

			const body = mockSunoRequest.mock.calls[0][2];
			expect(body.audioId).toBe('audio-midi-123');
		});
	});

	// -----------------------------------------------------------------------
	// generateVideo
	// -----------------------------------------------------------------------
	describe('generateVideo', () => {
		const baseParams = {
			taskId: 'task-vid',
			audioId: 'audio-vid',
			callBackUrl: 'https://example.com/callback',
			author: '',
			domainName: '',
		};

		it('calls POST /api/v1/mp4/generate', async () => {
			const ctx = createMockContext(baseParams);
			await callHandler(handleAudioConversion, ctx, 'generateVideo');

			const [method, endpoint, body] = mockSunoRequest.mock.calls[0];
			expect(method).toBe('POST');
			expect(endpoint).toBe('/api/v1/mp4/generate');
			expect(body).toMatchObject({
				taskId: 'task-vid',
				audioId: 'audio-vid',
				callBackUrl: 'https://example.com/callback',
			});
		});

		it('excludes author and domainName when empty', async () => {
			const ctx = createMockContext(baseParams);
			await callHandler(handleAudioConversion, ctx, 'generateVideo');

			const body = mockSunoRequest.mock.calls[0][2];
			expect(body).not.toHaveProperty('author');
			expect(body).not.toHaveProperty('domainName');
		});

		it('includes author and domainName when provided', async () => {
			const ctx = createMockContext({
				...baseParams,
				author: 'Test Author',
				domainName: 'example.com',
			});
			await callHandler(handleAudioConversion, ctx, 'generateVideo');

			const body = mockSunoRequest.mock.calls[0][2];
			expect(body.author).toBe('Test Author');
			expect(body.domainName).toBe('example.com');
		});
	});

	it('throws on unknown operation', async () => {
		const ctx = createMockContext({});
		await expect(
			callHandler(handleAudioConversion, ctx, 'nonexistent'),
		).rejects.toThrow('Unknown audioConversion operation');
	});
});

// ===========================================================================
// Style Boost
// ===========================================================================

describe('handleStyleBoost', () => {
	it('calls POST /api/v1/style/generate with content', async () => {
		const ctx = createMockContext({ content: 'My amazing style' });
		await callHandler(handleStyleBoost, ctx, 'generate');

		const [method, endpoint, body] = mockSunoRequest.mock.calls[0];
		expect(method).toBe('POST');
		expect(endpoint).toBe('/api/v1/style/generate');
		expect(body).toMatchObject({ content: 'My amazing style' });
	});

	it('returns the response synchronously', async () => {
		const expected = { code: 200, msg: 'success', data: { boostedStyle: 'pop rock' } };
		mockSunoRequest.mockResolvedValueOnce(expected);

		const ctx = createMockContext({ content: 'pop' });
		const result = await callHandler(handleStyleBoost, ctx, 'generate');

		expect(result).toEqual(expected);
	});

	it('throws on unknown operation', async () => {
		const ctx = createMockContext({});
		await expect(
			callHandler(handleStyleBoost, ctx, 'nonexistent'),
		).rejects.toThrow('Unknown styleBoost operation');
	});
});

// ===========================================================================
// Cover Image
// ===========================================================================

describe('handleCoverImage', () => {
	it('calls POST /api/v1/suno/cover/generate', async () => {
		const ctx = createMockContext({
			taskId: 'task-cover',
			callBackUrl: 'https://example.com/callback',
		});
		await callHandler(handleCoverImage, ctx, 'generate');

		const [method, endpoint, body] = mockSunoRequest.mock.calls[0];
		expect(method).toBe('POST');
		expect(endpoint).toBe('/api/v1/suno/cover/generate');
		expect(body).toMatchObject({
			taskId: 'task-cover',
			callBackUrl: 'https://example.com/callback',
		});
	});

	it('throws on unknown operation', async () => {
		const ctx = createMockContext({});
		await expect(
			callHandler(handleCoverImage, ctx, 'nonexistent'),
		).rejects.toThrow('Unknown coverImage operation');
	});
});
