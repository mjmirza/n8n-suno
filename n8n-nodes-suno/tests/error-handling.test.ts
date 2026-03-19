/**
 * Error handling tests: Suno error codes, parseErrorResponse, unknown operations
 */

import { createMockContext, MockContext } from './helpers/mockContext';

// ---------------------------------------------------------------------------
// Mock transport
// ---------------------------------------------------------------------------

jest.mock('../nodes/Suno/transport', () => ({
	...jest.requireActual('../nodes/Suno/transport'),
	sunoRequest: jest.fn(),
	sunoUploadRequest: jest.fn(),
}));

import { parseErrorResponse } from '../nodes/Suno/transport';

import { handleMusicGeneration } from '../nodes/Suno/resources/musicGeneration/musicGeneration.handler';
import { handleVocals } from '../nodes/Suno/resources/vocals/vocals.handler';
import { handleLyrics } from '../nodes/Suno/resources/lyrics/lyrics.handler';
import { handleTaskDetails } from '../nodes/Suno/resources/taskDetails/taskDetails.handler';
import { handleCredit } from '../nodes/Suno/resources/credit/credit.handler';
import { handleFileUpload } from '../nodes/Suno/resources/fileUpload/fileUpload.handler';
import { handlePersona } from '../nodes/Suno/resources/persona/persona.handler';
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
): Promise<T> {
	return handler.call(ctx, operation, 0);
}

beforeEach(() => {
	jest.clearAllMocks();
});

// ===========================================================================
// parseErrorResponse
// ===========================================================================

describe('parseErrorResponse', () => {
	const ERROR_CODE_MAP: Array<[number, string]> = [
		[400, 'Invalid request parameters'],
		[401, 'Invalid API key'],
		[402, 'Insufficient credits'],
		[404, 'Resource not found'],
		[405, 'Rate limit exceeded'],
		[409, 'Conflict'],
		[413, 'Content exceeds maximum length'],
		[422, 'Validation failed'],
		[429, 'Insufficient credits'],
		[430, 'Request frequency too high'],
		[451, 'Download failed or access restricted'],
		[455, 'Suno API is under maintenance'],
		[500, 'Suno server error'],
		[501, 'Suno server error'],
	];

	it.each(ERROR_CODE_MAP)(
		'code %d produces message containing "%s"',
		(code, expectedFragment) => {
			const result = parseErrorResponse({ code, msg: 'Details here' });
			expect(result).toContain(expectedFragment);
		},
	);

	it('includes the msg field from the response when known code', () => {
		const result = parseErrorResponse({ code: 400, msg: 'Missing field: prompt' });
		expect(result).toContain('Invalid request parameters');
		expect(result).toContain('Missing field: prompt');
	});

	it('returns just the base message when no msg provided', () => {
		const result = parseErrorResponse({ code: 401 });
		expect(result).toContain('Invalid API key');
	});

	it('returns msg when code is unknown', () => {
		const result = parseErrorResponse({ code: 999, msg: 'Something went wrong' });
		expect(result).toBe('Something went wrong');
	});

	it('returns generic message when response is null', () => {
		expect(parseErrorResponse(null)).toBe('Unknown Suno API error');
	});

	it('returns generic message when response is undefined', () => {
		expect(parseErrorResponse(undefined)).toBe('Unknown Suno API error');
	});

	it('returns generic message when response is empty object', () => {
		expect(parseErrorResponse({})).toBe('Unknown Suno API error');
	});

	it('returns generic message when response is a string', () => {
		expect(parseErrorResponse('something')).toBe('Unknown Suno API error');
	});

	it('truncates long error messages', () => {
		const longMsg = 'x'.repeat(5_000);
		const result = parseErrorResponse({ code: 400, msg: longMsg });
		// MAX_ERROR_LENGTH is 1000; the result should be base msg + truncated msg
		expect(result.length).toBeLessThanOrEqual(
			'Invalid request parameters'.length + 2 + 1_000,
		);
	});

	it('truncates msg even for unknown codes', () => {
		const longMsg = 'y'.repeat(5_000);
		const result = parseErrorResponse({ code: 999, msg: longMsg });
		expect(result.length).toBeLessThanOrEqual(1_000);
	});
});

// ===========================================================================
// Unknown operations throw for every handler
// ===========================================================================

describe('Unknown operations throw for all handlers', () => {
	const handlers: Array<[string, (this: any, op: string, i: number) => Promise<any>]> = [
		['musicGeneration', handleMusicGeneration],
		['vocals', handleVocals],
		['lyrics', handleLyrics],
		['taskDetails', handleTaskDetails],
		['credit', handleCredit],
		['fileUpload', handleFileUpload],
		['persona', handlePersona],
		['vocalSeparation', handleVocalSeparation],
		['audioConversion', handleAudioConversion],
		['styleBoost', handleStyleBoost],
		['coverImage', handleCoverImage],
	];

	it.each(handlers)('%s throws on unknown operation', async (name, handler) => {
		const ctx = createMockContext({});
		await expect(callHandler(handler, ctx, 'totallyFakeOp')).rejects.toThrow(
			/[Uu]nknown/,
		);
	});
});
