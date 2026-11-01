import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

jest.mock('n8n-workflow', () => ({
	...jest.requireActual('n8n-workflow'),
	sleep: jest.fn().mockResolvedValue(undefined),
}));

import { sleep } from 'n8n-workflow';
import { parseErrorResponse, sunoRequest } from '../nodes/Suno/transport';
import { handleMusicGeneration } from '../nodes/Suno/resources/musicGeneration/musicGeneration.handler';
import { handleVocals } from '../nodes/Suno/resources/vocals/vocals.handler';
import { assertDurationRange } from '../nodes/Suno/utils/validators';
import { SunoApi } from '../credentials/SunoApi.credentials';
import { createMockContext } from './helpers/mockContext';

const NODE = { id: 'n', name: 'Suno', type: 'x', typeVersion: 1, position: [0, 0], parameters: {} };

/** Mirrors n8n: an unset parameter read with an undefined fallback throws. */
function strictContext(params: Record<string, unknown>) {
	const ctx = createMockContext(params, { code: 200, data: { taskId: 't' } });
	ctx.getNodeParameter.mockImplementation((name: string, _i: number, fallback?: unknown) => {
		if (name in params) return params[name];
		if (fallback === undefined) throw new Error(`Could not get parameter ${name}`);
		return fallback;
	});
	return ctx;
}

describe('unset optional weights (round 2, high)', () => {
	it('generate works with only required fields set', async () => {
		const ctx = strictContext({
			customMode: false, instrumental: false, prompt: 'a calm song', model: 'V4_5PLUS',
			callBackUrl: 'https://hooks.example.com/cb',
		});
		await expect(handleMusicGeneration.call(ctx as unknown as IExecuteFunctions, 'generate', 0)).resolves.toBeDefined();
		expect(ctx.helpers.httpRequestWithAuthentication).toHaveBeenCalledTimes(1);
	});

	it('add vocals works with only required fields set', async () => {
		const ctx = strictContext({
			uploadUrl: 'https://cdn.example.com/a.mp3', prompt: '', title: 'T', style: 'pop',
			negativeTags: 'metal', callBackUrl: 'https://hooks.example.com/cb',
		});
		await expect(handleVocals.call(ctx as unknown as IExecuteFunctions, 'addVocals', 0)).resolves.toBeDefined();
	});

	it('no handler reads a parameter with an undefined fallback', () => {
		const dir = join(__dirname, '../nodes/Suno/resources');
		for (const f of ['musicGeneration/musicGeneration.handler.ts', 'vocals/vocals.handler.ts']) {
			const src = readFileSync(join(dir, f), 'utf8');
			expect(src).not.toMatch(/itemIndex,\s*undefined,?\s*\)/);
		}
	});
});

describe('continueAt default (round 2)', () => {
	it('extend does not send continueAt 0', async () => {
		const ctx = createMockContext(
			{ audioId: 'a1', defaultParamFlag: false, continueAt: 0, model: 'V4_5PLUS', callBackUrl: 'https://hooks.example.com/cb' },
			{ code: 200, data: { taskId: 't' } },
		);
		await handleMusicGeneration.call(ctx as unknown as IExecuteFunctions, 'extend', 0).catch(() => undefined);
		const call = ctx.helpers.httpRequestWithAuthentication.mock.calls[0];
		if (call) expect(call[1].body).not.toHaveProperty('continueAt');
	});
});

describe('replace section duration (round 2)', () => {
	it('rejects a replacement shorter than 10 seconds', () => {
		expect(() => assertDurationRange(10, 19)).toThrow('at least 10 seconds');
		expect(() => assertDurationRange(10, 20)).not.toThrow();
	});
});

describe('credential test (round 2)', () => {
	it('fails on an HTTP 200 envelope carrying code 401', () => {
		const rules = new SunoApi().test.rules ?? [];
		expect(rules).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ type: 'responseSuccessBody', properties: expect.objectContaining({ key: 'code', value: 401 }) }),
			]),
		);
	});
});

describe('rate limits (round 2)', () => {
	it('retries body code 405', async () => {
		const ctx = createMockContext();
		ctx.helpers.httpRequestWithAuthentication
			.mockResolvedValueOnce({ code: 405, msg: 'rate limited' })
			.mockResolvedValueOnce({ code: 200, data: { taskId: 't' } });
		await sunoRequest.call(ctx as unknown as IExecuteFunctions, 'POST', '/api/v1/generate', { a: 1 });
		expect(ctx.helpers.httpRequestWithAuthentication).toHaveBeenCalledTimes(2);
	});

	it('reads Retry-After from the wrapped HTTP response', async () => {
		const err = new NodeApiError(NODE as never, { message: 'x' }, { httpCode: '430' });
		(err as unknown as { cause: unknown }).cause = { response: { headers: { 'retry-after': '7' } } };
		const ctx = createMockContext();
		ctx.helpers.httpRequestWithAuthentication.mockRejectedValueOnce(err).mockResolvedValueOnce({ code: 200, data: {} });
		(sleep as jest.Mock).mockClear();
		await sunoRequest.call(ctx as unknown as IExecuteFunctions, 'GET', '/api/v1/generate/credit');
		expect(sleep).toHaveBeenCalledWith(7000);
	});
});

describe('secret redaction (round 2)', () => {
	it('removes tokens from upstream error messages', () => {
		const msg = parseErrorResponse({ code: 400, msg: 'bad key Bearer abcdef1234567890abcdef1234567890 sent' });
		expect(msg).not.toContain('abcdef1234567890abcdef1234567890');
	});
});

describe('publish from main (round 2)', () => {
	it('the publish workflow refuses a tag that is not on main', () => {
		const wf = readFileSync(join(__dirname, '../../.github/workflows/publish.yml'), 'utf8');
		expect(wf).toMatch(/merge-base --is-ancestor/);
	});
});

describe('secret redaction in thrown errors (round 2)', () => {
	it('keeps the token out of message and description', async () => {
		const ctx = createMockContext();
		ctx.helpers.httpRequestWithAuthentication.mockResolvedValue({ code: 400, msg: 'echo Bearer abcdef1234567890abcdef1234567890' });
		const err = (await sunoRequest.call(ctx as unknown as IExecuteFunctions, 'GET', '/x').catch((e: unknown) => e)) as NodeApiError;
		expect(JSON.stringify({ m: err.message, d: err.description })).not.toContain('abcdef1234567890abcdef1234567890');
	});
});
