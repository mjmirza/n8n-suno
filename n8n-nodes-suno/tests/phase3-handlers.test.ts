/**
 * Phase 3 handler tests: taskDetails, credit, fileUpload, persona
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
	data: { url: 'https://cdn.example.com/file.mp3' },
});

jest.mock('../nodes/Suno/transport', () => ({
	...jest.requireActual('../nodes/Suno/transport'),
	sunoRequest: mockSunoRequest,
	sunoUploadRequest: mockSunoUploadRequest,
}));

import { handleTaskDetails } from '../nodes/Suno/resources/taskDetails/taskDetails.handler';
import { handleCredit } from '../nodes/Suno/resources/credit/credit.handler';
import { handleFileUpload } from '../nodes/Suno/resources/fileUpload/fileUpload.handler';
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
	mockSunoRequest.mockResolvedValue({
		code: 200,
		msg: 'success',
		data: { taskId: 'test-task-123' },
	});
	mockSunoUploadRequest.mockResolvedValue({
		code: 200,
		msg: 'success',
		data: { url: 'https://cdn.example.com/file.mp3' },
	});
});

// ===========================================================================
// Task Details
// ===========================================================================

describe('handleTaskDetails', () => {
	const endpointMap: Record<string, string> = {
		getMusicDetails: '/api/v1/generate/record-info',
		getLyricsDetails: '/api/v1/lyrics/record-info',
		getWavDetails: '/api/v1/wav/record-info',
		getVocalSeparationDetails: '/api/v1/vocal-removal/record-info',
		getVideoDetails: '/api/v1/mp4/record-info',
		getMidiDetails: '/api/v1/midi/record-info',
		getCoverDetails: '/api/v1/suno/cover/record-info',
	};

	it.each(Object.entries(endpointMap))(
		'%s calls GET %s with taskId as query param',
		async (operation, expectedEndpoint) => {
			const ctx = createMockContext({ taskId: 'task-lookup-123' });
			await callHandler(handleTaskDetails, ctx, operation);

			expect(mockSunoRequest).toHaveBeenCalledTimes(1);
			const [method, endpoint, body, qs] = mockSunoRequest.mock.calls[0];
			expect(method).toBe('GET');
			expect(endpoint).toBe(expectedEndpoint);
			expect(body).toBeUndefined();
			expect(qs).toEqual({ taskId: 'task-lookup-123' });
		},
	);

	it('throws on unknown operation', async () => {
		const ctx = createMockContext({ taskId: 'task-abc' });
		await expect(
			callHandler(handleTaskDetails, ctx, 'nonexistent'),
		).rejects.toThrow('Unknown taskDetails operation');
	});
});

// ===========================================================================
// Credit
// ===========================================================================

describe('handleCredit', () => {
	it('calls GET /api/v1/generate/credit with no params', async () => {
		const ctx = createMockContext({});
		await callHandler(handleCredit, ctx, 'get');

		expect(mockSunoRequest).toHaveBeenCalledTimes(1);
		const [method, endpoint] = mockSunoRequest.mock.calls[0];
		expect(method).toBe('GET');
		expect(endpoint).toBe('/api/v1/generate/credit');
	});

	it('returns the response directly', async () => {
		const expected = { code: 200, msg: 'success', data: { credits: 100 } };
		mockSunoRequest.mockResolvedValueOnce(expected);

		const ctx = createMockContext({});
		const result = await callHandler(handleCredit, ctx, 'get');
		expect(result).toEqual(expected);
	});

	it('throws on unknown operation', async () => {
		const ctx = createMockContext({});
		await expect(
			callHandler(handleCredit, ctx, 'nonexistent'),
		).rejects.toThrow('Unknown credit operation');
	});
});

// ===========================================================================
// File Upload
// ===========================================================================

describe('handleFileUpload', () => {
	// -----------------------------------------------------------------------
	// uploadBase64
	// -----------------------------------------------------------------------
	describe('uploadBase64', () => {
		const baseParams = {
			base64Data: 'SGVsbG8gV29ybGQ=',
			uploadPath: '/music/uploads',
			fileName: '',
		};

		it('calls POST /api/file-base64-upload via sunoUploadRequest', async () => {
			const ctx = createMockContext(baseParams);
			await callHandler(handleFileUpload, ctx, 'uploadBase64');

			expect(mockSunoUploadRequest).toHaveBeenCalledTimes(1);
			const [method, endpoint, body] = mockSunoUploadRequest.mock.calls[0];
			expect(method).toBe('POST');
			expect(endpoint).toBe('/api/file-base64-upload');
			expect(body).toMatchObject({
				base64Data: 'SGVsbG8gV29ybGQ=',
				uploadPath: '/music/uploads',
			});
		});

		it('excludes fileName when empty', async () => {
			const ctx = createMockContext(baseParams);
			await callHandler(handleFileUpload, ctx, 'uploadBase64');

			const body = mockSunoUploadRequest.mock.calls[0][2];
			expect(body).not.toHaveProperty('fileName');
		});

		it('includes fileName when provided', async () => {
			const ctx = createMockContext({ ...baseParams, fileName: 'track.mp3' });
			await callHandler(handleFileUpload, ctx, 'uploadBase64');

			const body = mockSunoUploadRequest.mock.calls[0][2];
			expect(body.fileName).toBe('track.mp3');
		});
	});

	// -----------------------------------------------------------------------
	// uploadUrl
	// -----------------------------------------------------------------------
	describe('uploadUrl', () => {
		const baseParams = {
			fileUrl: 'https://example.com/file.mp3',
			uploadPath: '/music/uploads',
			fileName: '',
		};

		it('calls POST /api/file-url-upload via sunoUploadRequest', async () => {
			const ctx = createMockContext(baseParams);
			await callHandler(handleFileUpload, ctx, 'uploadUrl');

			expect(mockSunoUploadRequest).toHaveBeenCalledTimes(1);
			const [method, endpoint, body] = mockSunoUploadRequest.mock.calls[0];
			expect(method).toBe('POST');
			expect(endpoint).toBe('/api/file-url-upload');
			expect(body).toMatchObject({
				fileUrl: 'https://example.com/file.mp3',
				uploadPath: '/music/uploads',
			});
		});

		it('excludes fileName when empty', async () => {
			const ctx = createMockContext(baseParams);
			await callHandler(handleFileUpload, ctx, 'uploadUrl');

			const body = mockSunoUploadRequest.mock.calls[0][2];
			expect(body).not.toHaveProperty('fileName');
		});

		it('includes fileName when provided', async () => {
			const ctx = createMockContext({ ...baseParams, fileName: 'song.wav' });
			await callHandler(handleFileUpload, ctx, 'uploadUrl');

			const body = mockSunoUploadRequest.mock.calls[0][2];
			expect(body.fileName).toBe('song.wav');
		});
	});

	it('throws on unknown operation', async () => {
		const ctx = createMockContext({});
		await expect(
			callHandler(handleFileUpload, ctx, 'nonexistent'),
		).rejects.toThrow('Unknown fileUpload operation');
	});
});

// ===========================================================================
// Persona
// ===========================================================================

describe('handlePersona', () => {
	const baseParams = {
		taskId: 'task-persona',
		audioId: 'audio-persona',
		name: 'My Persona',
		description: 'A test persona',
		vocalStart: 5,
		vocalEnd: 25,
		style: '',
	};

	it('calls POST /api/v1/generate/generate-persona', async () => {
		const ctx = createMockContext(baseParams);
		await callHandler(handlePersona, ctx, 'generate');

		expect(mockSunoRequest).toHaveBeenCalledTimes(1);
		const [method, endpoint, body] = mockSunoRequest.mock.calls[0];
		expect(method).toBe('POST');
		expect(endpoint).toBe('/api/v1/generate/generate-persona');
		expect(body).toMatchObject({
			taskId: 'task-persona',
			audioId: 'audio-persona',
			name: 'My Persona',
			description: 'A test persona',
			vocalStart: 5,
			vocalEnd: 25,
		});
	});

	it('includes style when provided', async () => {
		const ctx = createMockContext({ ...baseParams, style: 'jazz' });
		await callHandler(handlePersona, ctx, 'generate');

		const body = mockSunoRequest.mock.calls[0][2];
		expect(body.style).toBe('jazz');
	});

	it('excludes style when empty', async () => {
		const ctx = createMockContext(baseParams);
		await callHandler(handlePersona, ctx, 'generate');

		const body = mockSunoRequest.mock.calls[0][2];
		expect(body).not.toHaveProperty('style');
	});

	it('validates vocalSegment - start must be less than end', async () => {
		const ctx = createMockContext({ ...baseParams, vocalStart: 25, vocalEnd: 5 });
		await expect(
			callHandler(handlePersona, ctx, 'generate'),
		).rejects.toThrow('Vocal start must be less than vocal end');
	});

	it('validates vocalSegment - minimum 10 seconds', async () => {
		const ctx = createMockContext({ ...baseParams, vocalStart: 10, vocalEnd: 15 });
		await expect(
			callHandler(handlePersona, ctx, 'generate'),
		).rejects.toThrow('at least 10 seconds');
	});

	it('validates vocalSegment - maximum 30 seconds', async () => {
		const ctx = createMockContext({ ...baseParams, vocalStart: 0, vocalEnd: 35 });
		await expect(
			callHandler(handlePersona, ctx, 'generate'),
		).rejects.toThrow('must not exceed 30 seconds');
	});

	it('throws on unknown operation', async () => {
		const ctx = createMockContext({});
		await expect(
			callHandler(handlePersona, ctx, 'nonexistent'),
		).rejects.toThrow('Unknown persona operation');
	});
});
