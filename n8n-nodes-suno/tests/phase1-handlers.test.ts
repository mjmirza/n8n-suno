/**
 * Phase 1 handler tests: musicGeneration, vocals, lyrics
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

import { handleMusicGeneration } from '../nodes/Suno/resources/musicGeneration/musicGeneration.handler';
import { handleVocals } from '../nodes/Suno/resources/vocals/vocals.handler';
import { handleLyrics } from '../nodes/Suno/resources/lyrics/lyrics.handler';

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
// Music Generation
// ===========================================================================

describe('handleMusicGeneration', () => {
	// -----------------------------------------------------------------------
	// generate
	// -----------------------------------------------------------------------
	describe('generate', () => {
		const baseParams = {
			customMode: false,
			instrumental: false,
			callBackUrl: 'https://example.com/callback',
			model: 'V4_5',
			prompt: 'A happy song',
			negativeTags: '',
			personaId: '',
			personaModel: '',
			vocalGender: '',
			styleWeight: undefined,
			weirdnessConstraint: undefined,
			audioWeight: undefined,
		};

		it('calls POST /api/v1/generate with correct body', async () => {
			const ctx = createMockContext(baseParams);
			await callHandler(handleMusicGeneration, ctx, 'generate');

			expect(mockSunoRequest).toHaveBeenCalledTimes(1);
			const [method, endpoint, body] = mockSunoRequest.mock.calls[0];
			expect(method).toBe('POST');
			expect(endpoint).toBe('/api/v1/generate');
			expect(body).toMatchObject({
				customMode: false,
				instrumental: false,
				callBackUrl: 'https://example.com/callback',
				model: 'V4_5',
				prompt: 'A happy song',
			});
		});

		it('excludes optional fields when empty', async () => {
			const ctx = createMockContext(baseParams);
			await callHandler(handleMusicGeneration, ctx, 'generate');

			const body = mockSunoRequest.mock.calls[0][2];
			expect(body).not.toHaveProperty('negativeTags');
			expect(body).not.toHaveProperty('personaId');
			expect(body).not.toHaveProperty('personaModel');
			expect(body).not.toHaveProperty('vocalGender');
			expect(body).not.toHaveProperty('styleWeight');
		});

		it('includes optional fields when provided', async () => {
			const ctx = createMockContext({
				...baseParams,
				negativeTags: 'no drums',
				personaId: 'persona-1',
				personaModel: 'V4_5',
				vocalGender: 'male',
				styleWeight: 0.5,
				weirdnessConstraint: 0.3,
				audioWeight: 0.8,
			});
			await callHandler(handleMusicGeneration, ctx, 'generate');

			const body = mockSunoRequest.mock.calls[0][2];
			expect(body.negativeTags).toBe('no drums');
			expect(body.personaId).toBe('persona-1');
			expect(body.personaModel).toBe('V4_5');
			expect(body.vocalGender).toBe('male');
			expect(body.styleWeight).toBe(0.5);
			expect(body.weirdnessConstraint).toBe(0.3);
			expect(body.audioWeight).toBe(0.8);
		});

		it('customMode=true adds style and title to body', async () => {
			const ctx = createMockContext({
				...baseParams,
				customMode: true,
				style: 'pop rock',
				title: 'My Song',
			});
			await callHandler(handleMusicGeneration, ctx, 'generate');

			const body = mockSunoRequest.mock.calls[0][2];
			expect(body.customMode).toBe(true);
			expect(body.style).toBe('pop rock');
			expect(body.title).toBe('My Song');
		});

		it('customMode=false does NOT add style/title', async () => {
			const ctx = createMockContext(baseParams);
			await callHandler(handleMusicGeneration, ctx, 'generate');

			const body = mockSunoRequest.mock.calls[0][2];
			expect(body).not.toHaveProperty('style');
			expect(body).not.toHaveProperty('title');
		});
	});

	// -----------------------------------------------------------------------
	// extend
	// -----------------------------------------------------------------------
	describe('extend', () => {
		const baseParams = {
			defaultParamFlag: false,
			audioId: 'audio-123',
			callBackUrl: 'https://example.com/callback',
			model: 'V4_5',
			negativeTags: '',
			personaId: '',
			personaModel: '',
			vocalGender: '',
			styleWeight: undefined,
			weirdnessConstraint: undefined,
			audioWeight: undefined,
		};

		it('calls POST /api/v1/generate/extend', async () => {
			const ctx = createMockContext(baseParams);
			await callHandler(handleMusicGeneration, ctx, 'extend');

			expect(mockSunoRequest).toHaveBeenCalledTimes(1);
			const [method, endpoint] = mockSunoRequest.mock.calls[0];
			expect(method).toBe('POST');
			expect(endpoint).toBe('/api/v1/generate/extend');
		});

		it('defaultParamFlag=false omits prompt/style/title', async () => {
			const ctx = createMockContext(baseParams);
			await callHandler(handleMusicGeneration, ctx, 'extend');

			const body = mockSunoRequest.mock.calls[0][2];
			expect(body.defaultParamFlag).toBe(false);
			expect(body).not.toHaveProperty('prompt');
			expect(body).not.toHaveProperty('style');
			expect(body).not.toHaveProperty('title');
			expect(body).not.toHaveProperty('continueAt');
			expect(body).not.toHaveProperty('instrumental');
		});

		it('defaultParamFlag=true includes prompt/style/title/continueAt/instrumental', async () => {
			const ctx = createMockContext({
				...baseParams,
				defaultParamFlag: true,
				prompt: 'Extended lyrics',
				style: 'jazz',
				title: 'Extended Song',
				continueAt: 30,
				instrumental: true,
			});
			await callHandler(handleMusicGeneration, ctx, 'extend');

			const body = mockSunoRequest.mock.calls[0][2];
			expect(body.defaultParamFlag).toBe(true);
			expect(body.prompt).toBe('Extended lyrics');
			expect(body.style).toBe('jazz');
			expect(body.title).toBe('Extended Song');
			expect(body.continueAt).toBe(30);
			expect(body.instrumental).toBe(true);
		});
	});

	// -----------------------------------------------------------------------
	// uploadCover
	// -----------------------------------------------------------------------
	describe('uploadCover', () => {
		const baseParams = {
			uploadUrl: 'https://example.com/audio.mp3',
			customMode: false,
			instrumental: false,
			callBackUrl: 'https://example.com/callback',
			model: 'V4_5',
			prompt: 'A cover',
			negativeTags: '',
			personaId: '',
			personaModel: '',
			vocalGender: '',
			styleWeight: undefined,
			weirdnessConstraint: undefined,
			audioWeight: undefined,
		};

		it('calls POST /api/v1/generate/upload-cover', async () => {
			const ctx = createMockContext(baseParams);
			await callHandler(handleMusicGeneration, ctx, 'uploadCover');

			const [method, endpoint, body] = mockSunoRequest.mock.calls[0];
			expect(method).toBe('POST');
			expect(endpoint).toBe('/api/v1/generate/upload-cover');
			expect(body.uploadUrl).toBe('https://example.com/audio.mp3');
		});

		it('customMode=true includes style/title', async () => {
			const ctx = createMockContext({
				...baseParams,
				customMode: true,
				style: 'pop',
				title: 'Cover Title',
			});
			await callHandler(handleMusicGeneration, ctx, 'uploadCover');

			const body = mockSunoRequest.mock.calls[0][2];
			expect(body.style).toBe('pop');
			expect(body.title).toBe('Cover Title');
		});
	});

	// -----------------------------------------------------------------------
	// uploadExtend
	// -----------------------------------------------------------------------
	describe('uploadExtend', () => {
		const baseParams = {
			uploadUrl: 'https://example.com/audio.mp3',
			defaultParamFlag: false,
			callBackUrl: 'https://example.com/callback',
			model: 'V4_5',
			negativeTags: '',
			personaId: '',
			personaModel: '',
			vocalGender: '',
			styleWeight: undefined,
			weirdnessConstraint: undefined,
			audioWeight: undefined,
		};

		it('calls POST /api/v1/generate/upload-extend', async () => {
			const ctx = createMockContext(baseParams);
			await callHandler(handleMusicGeneration, ctx, 'uploadExtend');

			const [method, endpoint] = mockSunoRequest.mock.calls[0];
			expect(method).toBe('POST');
			expect(endpoint).toBe('/api/v1/generate/upload-extend');
		});

		it('defaultParamFlag=true includes extra fields', async () => {
			const ctx = createMockContext({
				...baseParams,
				defaultParamFlag: true,
				prompt: 'Extended',
				style: 'rock',
				title: 'Ext Song',
				continueAt: 15,
				instrumental: false,
			});
			await callHandler(handleMusicGeneration, ctx, 'uploadExtend');

			const body = mockSunoRequest.mock.calls[0][2];
			expect(body.prompt).toBe('Extended');
			expect(body.style).toBe('rock');
			expect(body.title).toBe('Ext Song');
			expect(body.continueAt).toBe(15);
			expect(body.instrumental).toBe(false);
		});
	});

	// -----------------------------------------------------------------------
	// mashup
	// -----------------------------------------------------------------------
	describe('mashup', () => {
		const baseParams = {
			uploadUrl1: 'https://example.com/audio1.mp3',
			uploadUrl2: 'https://example.com/audio2.mp3',
			customMode: false,
			model: 'V4_5',
			callBackUrl: 'https://example.com/callback',
			instrumental: false,
			negativeTags: '',
			personaId: '',
			personaModel: '',
			vocalGender: '',
			styleWeight: undefined,
			weirdnessConstraint: undefined,
			audioWeight: undefined,
		};

		it('calls POST /api/v1/generate/mashup with uploadUrlList array', async () => {
			const ctx = createMockContext(baseParams);
			await callHandler(handleMusicGeneration, ctx, 'mashup');

			const [method, endpoint, body] = mockSunoRequest.mock.calls[0];
			expect(method).toBe('POST');
			expect(endpoint).toBe('/api/v1/generate/mashup');
			expect(body.uploadUrlList).toEqual([
				'https://example.com/audio1.mp3',
				'https://example.com/audio2.mp3',
			]);
		});

		it('customMode=true includes prompt/style/title', async () => {
			const ctx = createMockContext({
				...baseParams,
				customMode: true,
				prompt: 'Mashup prompt',
				style: 'EDM',
				title: 'Mashup',
			});
			await callHandler(handleMusicGeneration, ctx, 'mashup');

			const body = mockSunoRequest.mock.calls[0][2];
			expect(body.prompt).toBe('Mashup prompt');
			expect(body.style).toBe('EDM');
			expect(body.title).toBe('Mashup');
		});
	});

	// -----------------------------------------------------------------------
	// replaceSection
	// -----------------------------------------------------------------------
	describe('replaceSection', () => {
		const baseParams = {
			taskId: 'task-abc',
			audioId: 'audio-def',
			prompt: 'New section lyrics',
			tags: 'verse',
			title: 'Song Title',
			infillStartS: 10,
			infillEndS: 30,
			negativeTags: '',
			callBackUrl: '',
		};

		it('calls POST /api/v1/generate/replace-section', async () => {
			const ctx = createMockContext(baseParams);
			await callHandler(handleMusicGeneration, ctx, 'replaceSection');

			const [method, endpoint, body] = mockSunoRequest.mock.calls[0];
			expect(method).toBe('POST');
			expect(endpoint).toBe('/api/v1/generate/replace-section');
			expect(body).toMatchObject({
				taskId: 'task-abc',
				audioId: 'audio-def',
				prompt: 'New section lyrics',
				tags: 'verse',
				title: 'Song Title',
				infillStartS: 10,
				infillEndS: 30,
			});
		});

		it('includes callBackUrl when provided', async () => {
			const ctx = createMockContext({
				...baseParams,
				callBackUrl: 'https://example.com/cb',
			});
			await callHandler(handleMusicGeneration, ctx, 'replaceSection');

			const body = mockSunoRequest.mock.calls[0][2];
			expect(body.callBackUrl).toBe('https://example.com/cb');
		});
	});

	// -----------------------------------------------------------------------
	// unknown operation
	// -----------------------------------------------------------------------
	it('throws on unknown operation', async () => {
		const ctx = createMockContext({});
		await expect(
			callHandler(handleMusicGeneration, ctx, 'nonexistent'),
		).rejects.toThrow('Unknown operation');
	});
});

// ===========================================================================
// Vocals
// ===========================================================================

describe('handleVocals', () => {
	describe('addVocals', () => {
		const baseParams = {
			uploadUrl: 'https://example.com/vocal.mp3',
			prompt: 'Sing along',
			title: 'Vocal Track',
			style: 'pop',
			negativeTags: 'no screaming',
			callBackUrl: 'https://example.com/callback',
			vocalGender: '',
			styleWeight: undefined,
			weirdnessConstraint: undefined,
			audioWeight: undefined,
			model: 'V4_5PLUS',
		};

		it('calls POST /api/v1/generate/add-vocals', async () => {
			const ctx = createMockContext(baseParams);
			await callHandler(handleVocals, ctx, 'addVocals');

			const [method, endpoint, body] = mockSunoRequest.mock.calls[0];
			expect(method).toBe('POST');
			expect(endpoint).toBe('/api/v1/generate/add-vocals');
			expect(body).toMatchObject({
				uploadUrl: 'https://example.com/vocal.mp3',
				prompt: 'Sing along',
				title: 'Vocal Track',
				style: 'pop',
				negativeTags: 'no screaming',
				callBackUrl: 'https://example.com/callback',
			});
		});

		it('includes optional vocalGender when provided', async () => {
			const ctx = createMockContext({
				...baseParams,
				vocalGender: 'female',
			});
			await callHandler(handleVocals, ctx, 'addVocals');

			const body = mockSunoRequest.mock.calls[0][2];
			expect(body.vocalGender).toBe('female');
		});

		it('excludes vocalGender when empty', async () => {
			const ctx = createMockContext(baseParams);
			await callHandler(handleVocals, ctx, 'addVocals');

			const body = mockSunoRequest.mock.calls[0][2];
			expect(body).not.toHaveProperty('vocalGender');
		});
	});

	describe('addInstrumental', () => {
		const baseParams = {
			uploadUrl: 'https://example.com/inst.mp3',
			title: 'Instrumental Track',
			tags: 'ambient',
			negativeTags: 'no bass',
			callBackUrl: 'https://example.com/callback',
			vocalGender: '',
			styleWeight: undefined,
			audioWeight: undefined,
			weirdnessConstraint: undefined,
			model: 'V4_5PLUS',
		};

		it('calls POST /api/v1/generate/add-instrumental', async () => {
			const ctx = createMockContext(baseParams);
			await callHandler(handleVocals, ctx, 'addInstrumental');

			const [method, endpoint, body] = mockSunoRequest.mock.calls[0];
			expect(method).toBe('POST');
			expect(endpoint).toBe('/api/v1/generate/add-instrumental');
			expect(body).toMatchObject({
				uploadUrl: 'https://example.com/inst.mp3',
				title: 'Instrumental Track',
				tags: 'ambient',
				negativeTags: 'no bass',
				callBackUrl: 'https://example.com/callback',
			});
		});
	});

	it('throws on unknown operation', async () => {
		const ctx = createMockContext({});
		await expect(
			callHandler(handleVocals, ctx, 'nonexistent'),
		).rejects.toThrow('Unknown vocals operation');
	});
});

// ===========================================================================
// Lyrics
// ===========================================================================

describe('handleLyrics', () => {
	describe('generate', () => {
		const baseParams = {
			prompt: 'Write a love song',
			callBackUrl: 'https://example.com/callback',
		};

		it('calls POST /api/v1/lyrics', async () => {
			const ctx = createMockContext(baseParams);
			await callHandler(handleLyrics, ctx, 'generate');

			const [method, endpoint, body] = mockSunoRequest.mock.calls[0];
			expect(method).toBe('POST');
			expect(endpoint).toBe('/api/v1/lyrics');
			expect(body).toMatchObject({
				prompt: 'Write a love song',
				callBackUrl: 'https://example.com/callback',
			});
		});
	});

	describe('getTimestamped', () => {
		const baseParams = {
			taskId: 'task-123',
			audioId: 'audio-456',
		};

		it('calls POST /api/v1/generate/get-timestamped-lyrics', async () => {
			const ctx = createMockContext(baseParams);
			await callHandler(handleLyrics, ctx, 'getTimestamped');

			const [method, endpoint, body] = mockSunoRequest.mock.calls[0];
			expect(method).toBe('POST');
			expect(endpoint).toBe('/api/v1/generate/get-timestamped-lyrics');
			expect(body).toMatchObject({
				taskId: 'task-123',
				audioId: 'audio-456',
			});
		});
	});

	it('throws on unknown operation', async () => {
		const ctx = createMockContext({});
		await expect(
			callHandler(handleLyrics, ctx, 'nonexistent'),
		).rejects.toThrow('Unknown lyrics operation');
	});
});
