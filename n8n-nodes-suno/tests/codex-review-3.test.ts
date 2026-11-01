import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

jest.mock('n8n-workflow', () => ({
	...jest.requireActual('n8n-workflow'),
	sleep: jest.fn().mockResolvedValue(undefined),
}));

import { sunoRequest } from '../nodes/Suno/transport';
import { handleMusicGeneration } from '../nodes/Suno/resources/musicGeneration/musicGeneration.handler';
import { musicGenerationFields } from '../nodes/Suno/resources/musicGeneration/musicGeneration.fields';
import { assertDurationRange } from '../nodes/Suno/utils/validators';
import { createMockContext } from './helpers/mockContext';

const NODE = { id: 'n', name: 'Suno', type: 'x', typeVersion: 1, position: [0, 0], parameters: {} };
const TOKEN = 'abcdef1234567890abcdef1234567890';
const CB = 'https://hooks.example.com/cb';

function strict(params: Record<string, unknown>) {
	const ctx = createMockContext(params, { code: 200, data: { taskId: 't' } });
	ctx.getNodeParameter.mockImplementation((name: string, _i: number, fallback?: unknown) => {
		if (name in params) return params[name];
		if (fallback === undefined) throw new Error(`Could not get parameter ${name}`);
		return fallback;
	});
	return ctx;
}

const bodyOf = (ctx: ReturnType<typeof createMockContext>) => ctx.helpers.httpRequestWithAuthentication.mock.calls[0][1].body;

describe('generate input contract (round 3, high 1)', () => {
	it('simple mode sends a style, from the prompt when no style is set', async () => {
		const ctx = strict({ customMode: false, instrumental: false, prompt: 'a calm piano song', model: 'V4_5PLUS', callBackUrl: CB });
		await handleMusicGeneration.call(ctx as unknown as IExecuteFunctions, 'generate', 0);
		expect(bodyOf(ctx).style).toBe('a calm piano song');
	});

	it('simple mode sends the Style field when set', async () => {
		const ctx = strict({ customMode: false, instrumental: false, prompt: 'a song', style: 'jazz', model: 'V4_5PLUS', callBackUrl: CB });
		await handleMusicGeneration.call(ctx as unknown as IExecuteFunctions, 'generate', 0);
		expect(bodyOf(ctx).style).toBe('jazz');
	});

	it('the Style field is shown in simple mode too', () => {
		const style = musicGenerationFields.find((f) => f.name === 'style' && f.displayOptions?.show?.operation?.includes('generate'));
		expect(style?.displayOptions?.show?.customMode).toBeUndefined();
	});

	it('custom mode without style or negative tags fails before any request', async () => {
		const ctx = strict({ customMode: true, instrumental: false, prompt: 'lyrics', title: 'T', model: 'V4_5PLUS', callBackUrl: CB });
		await expect(handleMusicGeneration.call(ctx as unknown as IExecuteFunctions, 'generate', 0)).rejects.toThrow(/Style/);
		expect(ctx.helpers.httpRequestWithAuthentication).not.toHaveBeenCalled();
	});
});

describe('token masking everywhere (round 3, high 2)', () => {
	it('masks tokens in every field of a body error', async () => {
		const ctx = createMockContext();
		ctx.helpers.httpRequestWithAuthentication.mockResolvedValue({ code: 400, msg: 'bad', data: { echo: `Bearer ${TOKEN}`, nested: [`key ${TOKEN}`] } });
		const err = await sunoRequest.call(ctx as unknown as IExecuteFunctions, 'GET', '/x').catch((e: unknown) => e);
		expect(JSON.stringify(err)).not.toContain(TOKEN);
		expect(String((err as NodeApiError).description)).not.toContain(TOKEN);
	});

	it('masks tokens in a wrapped HTTP error', async () => {
		const http = new NodeApiError(NODE as never, { message: `Unauthorized Bearer ${TOKEN}`, description: `got ${TOKEN}`, response: { data: { token: TOKEN } } } as never, { httpCode: '401' });
		const ctx = createMockContext();
		ctx.helpers.httpRequestWithAuthentication.mockRejectedValue(http);
		const err = (await sunoRequest.call(ctx as unknown as IExecuteFunctions, 'GET', '/x').catch((e: unknown) => e)) as NodeApiError;
		expect(err.message).not.toContain(TOKEN);
		expect(String(err.description)).not.toContain(TOKEN);
		expect(JSON.stringify({ ...err, context: err.context, messages: err.messages })).not.toContain(TOKEN);
	});
});

describe('instrumental extend (round 3)', () => {
	it('does not send prompt or vocal gender when instrumental', async () => {
		const ctx = strict({
			defaultParamFlag: true, audioId: 'a1', model: 'V4_5PLUS', callBackUrl: CB, prompt: 'old lyrics',
			style: 'pop', title: 'T', continueAt: 30, instrumental: true, vocalGender: 'm',
		});
		await handleMusicGeneration.call(ctx as unknown as IExecuteFunctions, 'extend', 0);
		const body = bodyOf(ctx);
		expect(body).not.toHaveProperty('prompt');
		expect(body).not.toHaveProperty('vocalGender');
		expect(body.continueAt).toBe(30);
	});

	it('does not send continueAt 0 with custom parameters', async () => {
		const ctx = strict({
			defaultParamFlag: true, audioId: 'a1', model: 'V4_5PLUS', callBackUrl: CB, prompt: 'lyrics',
			style: 'pop', title: 'T', continueAt: 0, instrumental: false,
		});
		await handleMusicGeneration.call(ctx as unknown as IExecuteFunctions, 'extend', 0);
		expect(ctx.helpers.httpRequestWithAuthentication).toHaveBeenCalledTimes(1);
		expect(bodyOf(ctx)).not.toHaveProperty('continueAt');
	});
});

describe('replace section duration (round 3)', () => {
	it('accepts a replacement longer than 60 seconds', () => {
		expect(() => assertDurationRange(30, 150)).not.toThrow();
	});
});
