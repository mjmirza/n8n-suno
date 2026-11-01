import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

jest.mock('n8n-workflow', () => ({
	...jest.requireActual('n8n-workflow'),
	sleep: jest.fn().mockResolvedValue(undefined),
}));

import { sleep } from 'n8n-workflow';
import { sunoRequest, retryAfterMs } from '../nodes/Suno/transport';
import { handleMusicGeneration } from '../nodes/Suno/resources/musicGeneration/musicGeneration.handler';
import { musicGenerationFields } from '../nodes/Suno/resources/musicGeneration/musicGeneration.fields';
import { assertTitleLength } from '../nodes/Suno/utils/validators';
import { createMockContext } from './helpers/mockContext';

const NODE = { id: 'n', name: 'Suno', type: 'x', typeVersion: 1, position: [0, 0], parameters: {} };
const CB = 'https://hooks.example.com/cb';
const sleepMock = sleep as unknown as jest.Mock;
const full = (statusCode: number, body: unknown, headers: Record<string, unknown> = {}) => ({ statusCode, headers, body });
const call = (ctx: ReturnType<typeof createMockContext>, method = 'GET') =>
	sunoRequest.call(ctx as unknown as IExecuteFunctions, method as 'GET', '/x');
const bodyOf = (ctx: ReturnType<typeof createMockContext>) => ctx.helpers.httpRequestWithAuthentication.mock.calls[0][1].body;

beforeEach(() => sleepMock.mockClear());

describe('generate, simple mode (round 4)', () => {
	it('cuts a prompt used as the style to the V4 style limit of 200', async () => {
		const ctx = createMockContext({ customMode: false, instrumental: false, prompt: 'p'.repeat(450), model: 'V4', callBackUrl: CB }, full(200, { code: 200 }));
		await handleMusicGeneration.call(ctx as unknown as IExecuteFunctions, 'generate', 0);
		expect(bodyOf(ctx).style).toHaveLength(200);
		expect(bodyOf(ctx).prompt).toHaveLength(450);
	});

	it('rejects an explicit V4 style over 200 characters', async () => {
		const ctx = createMockContext({ customMode: false, instrumental: false, prompt: 'p', style: 's'.repeat(201), model: 'V4', callBackUrl: CB });
		await expect(handleMusicGeneration.call(ctx as unknown as IExecuteFunctions, 'generate', 0)).rejects.toThrow(/200/);
	});

	it('does not send custom-mode-only fields', async () => {
		const ctx = createMockContext({
			customMode: false, instrumental: false, prompt: 'a song', model: 'V5', callBackUrl: CB,
			negativeTags: 'no drums', vocalGender: 'm', styleWeight: 0.5, weirdnessConstraint: 0.2, audioWeight: 0.3, title: 'T',
		}, full(200, { code: 200 }));
		await handleMusicGeneration.call(ctx as unknown as IExecuteFunctions, 'generate', 0);
		const body = bodyOf(ctx);
		for (const key of ['negativeTags', 'vocalGender', 'styleWeight', 'weirdnessConstraint', 'audioWeight', 'title']) {
			expect(body).not.toHaveProperty(key);
		}
	});

	it('hides custom-mode-only fields in simple mode', () => {
		for (const name of ['negativeTags', 'vocalGender', 'styleWeight', 'weirdnessConstraint', 'audioWeight']) {
			const field = musicGenerationFields.find((f) => f.name === name && f.displayOptions?.show?.operation?.includes('generate'));
			expect(field?.displayOptions?.show?.customMode).toEqual([true]);
		}
	});

	it('accepts a 3000-character simple prompt', async () => {
		const ctx = createMockContext({ customMode: false, instrumental: false, prompt: 'p'.repeat(3000), style: 'jazz', model: 'V5', callBackUrl: CB }, full(200, { code: 200 }));
		await expect(handleMusicGeneration.call(ctx as unknown as IExecuteFunctions, 'generate', 0)).resolves.toBeDefined();
	});
});

describe('generate title limit (round 4)', () => {
	it('rejects an 81-character V5 title on Generate', async () => {
		const ctx = createMockContext({ customMode: true, instrumental: false, prompt: 'l', style: 'pop', title: 't'.repeat(81), model: 'V5', callBackUrl: CB });
		await expect(handleMusicGeneration.call(ctx as unknown as IExecuteFunctions, 'generate', 0)).rejects.toThrow(/80/);
	});

	it('an endpoint limit overrides the model limit', () => {
		expect(() => assertTitleLength('t'.repeat(100), 'V4', 100)).not.toThrow();
		expect(() => assertTitleLength('t'.repeat(81), 'V5', 80)).toThrow(/80/);
	});
});

describe('transport retries (round 4)', () => {
	it('retries a GET after an n8n-wrapped connection reset', async () => {
		const reset = new NodeApiError(NODE as never, { message: 'socket hang up', code: 'ECONNRESET' } as never, { httpCode: 'ECONNRESET' });
		const ctx = createMockContext();
		ctx.helpers.httpRequestWithAuthentication.mockRejectedValueOnce(reset).mockResolvedValueOnce(full(200, { code: 200, data: 1 }));
		await expect(call(ctx)).resolves.toEqual({ code: 200, data: 1 });
		expect(ctx.helpers.httpRequestWithAuthentication).toHaveBeenCalledTimes(2);
	});

	it('does not resend a POST after a connection reset', async () => {
		const reset = new NodeApiError(NODE as never, { message: 'socket hang up' } as never, { httpCode: 'ECONNRESET' });
		const ctx = createMockContext();
		ctx.helpers.httpRequestWithAuthentication.mockRejectedValue(reset);
		await expect(call(ctx, 'POST')).rejects.toBeInstanceOf(NodeApiError);
		expect(ctx.helpers.httpRequestWithAuthentication).toHaveBeenCalledTimes(1);
	});

	it('asks n8n for the full response so headers survive', async () => {
		const ctx = createMockContext(undefined, full(200, { code: 200 }));
		await call(ctx);
		const options = ctx.helpers.httpRequestWithAuthentication.mock.calls[0][1];
		expect(options.returnFullResponse).toBe(true);
		expect(options.ignoreHttpStatusErrors).toBe(true);
	});

	it('waits the Retry-After of an HTTP 430 before retrying', async () => {
		const ctx = createMockContext();
		ctx.helpers.httpRequestWithAuthentication
			.mockResolvedValueOnce(full(430, { code: 430, msg: 'slow down' }, { 'Retry-After': '30' }))
			.mockResolvedValueOnce(full(200, { code: 200 }));
		await call(ctx, 'POST');
		expect(sleepMock).toHaveBeenCalledWith(30_000);
	});

	it('stops with a message when Retry-After exceeds the wait budget', async () => {
		const ctx = createMockContext();
		ctx.helpers.httpRequestWithAuthentication.mockResolvedValue(full(430, { code: 430 }, { 'retry-after': '600' }));
		const err = (await call(ctx).catch((e: unknown) => e)) as NodeApiError;
		expect(ctx.helpers.httpRequestWithAuthentication).toHaveBeenCalledTimes(1);
		expect(err.message).toMatch(/600 seconds/);
		expect(err.httpCode).toBe('430');
	});

	it('does not resend a POST after a 503', async () => {
		const ctx = createMockContext();
		ctx.helpers.httpRequestWithAuthentication.mockResolvedValue(full(503, 'Service Unavailable'));
		const err = (await call(ctx, 'POST').catch((e: unknown) => e)) as NodeApiError;
		expect(ctx.helpers.httpRequestWithAuthentication).toHaveBeenCalledTimes(1);
		expect(err.httpCode).toBe('503');
	});

	it('masks tokens in an HTTP status error', async () => {
		const token = 'abcdef1234567890abcdef1234567890';
		const ctx = createMockContext();
		ctx.helpers.httpRequestWithAuthentication.mockResolvedValue(full(401, { msg: `bad key ${token}` }));
		const err = (await call(ctx, 'POST').catch((e: unknown) => e)) as NodeApiError;
		expect(JSON.stringify({ ...err, message: err.message, description: err.description })).not.toContain(token);
	});

	it('parses Retry-After as seconds or an HTTP date', () => {
		expect(retryAfterMs('5')).toBe(5_000);
		expect(retryAfterMs(new Date(10_000).toUTCString(), 0)).toBe(10_000);
		expect(retryAfterMs('soon')).toBeUndefined();
		expect(retryAfterMs(undefined)).toBeUndefined();
	});
});

describe('current models and endpoint title limits (round 4)', () => {
	it('offers the current V6 models and V5.5 next to the existing ones', () => {
		const model = musicGenerationFields.find((f) => f.name === 'model' && f.displayOptions?.show?.operation?.includes('generate'));
		const values = (model?.options as Array<{ value: string }>).map((o) => o.value);
		expect(values).toEqual(expect.arrayContaining(['V6', 'V6_MINI', 'V6_WILD', 'V5_5', 'V5', 'V4']));
		expect(model?.default).toBe('V5');
	});

	it('applies the Mashup limit of 80 and the Upload and Extend limit of 100', async () => {
		const mashup = createMockContext({
			uploadUrl1: 'https://cdn.example.com/a.mp3', uploadUrl2: 'https://cdn.example.com/b.mp3',
			customMode: true, instrumental: false, prompt: 'l', style: 'pop', title: 't'.repeat(81), model: 'V6', callBackUrl: CB,
		});
		await expect(handleMusicGeneration.call(mashup as unknown as IExecuteFunctions, 'mashup', 0)).rejects.toThrow(/80/);
		const extend = createMockContext({
			uploadUrl: 'https://cdn.example.com/a.mp3', defaultParamFlag: true, instrumental: false, prompt: 'l', style: 'pop',
			title: 't'.repeat(100), continueAt: 10, model: 'V6', callBackUrl: CB,
		}, full(200, { code: 200 }));
		await expect(handleMusicGeneration.call(extend as unknown as IExecuteFunctions, 'uploadExtend', 0)).resolves.toBeDefined();
	});
});
