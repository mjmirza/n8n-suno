import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

jest.mock('n8n-workflow', () => ({
	...jest.requireActual('n8n-workflow'),
	sleep: jest.fn().mockResolvedValue(undefined),
}));

import { sleep } from 'n8n-workflow';
import { sunoRequest, assertValidUrl } from '../nodes/Suno/transport';
import { handleMusicGeneration } from '../nodes/Suno/resources/musicGeneration/musicGeneration.handler';
import { handleVocals } from '../nodes/Suno/resources/vocals/vocals.handler';
import { handleVocalSeparation } from '../nodes/Suno/resources/vocalSeparation/vocalSeparation.handler';
import { handleFileUpload } from '../nodes/Suno/resources/fileUpload/fileUpload.handler';
import * as d from '../nodes/Suno/utils/descriptions';
import { assertPromptLength, assertStyleLength, assertTitleLength } from '../nodes/Suno/utils/validators';
import { SunoApi } from '../credentials/SunoApi.credentials';
import { createMockContext } from './helpers/mockContext';

const CB = 'https://hooks.example.com/cb';
const URL1 = 'https://cdn.example.com/a.mp3';
const sleepMock = sleep as unknown as jest.Mock;
const full = (statusCode: number, body: unknown, headers: Record<string, unknown> = {}) => ({ statusCode, headers, body });
const exec = (ctx: ReturnType<typeof createMockContext>) => ctx as unknown as IExecuteFunctions;
const sent = (ctx: ReturnType<typeof createMockContext>) => ctx.helpers.httpRequestWithAuthentication.mock.calls[0][1];

beforeEach(() => sleepMock.mockClear());

describe('transport branches', () => {
	it('sends query parameters', async () => {
		const ctx = createMockContext(undefined, full(200, { code: 200 }));
		await sunoRequest.call(exec(ctx), 'GET', '/x', undefined, { taskId: 't1' });
		expect(sent(ctx).qs).toEqual({ taskId: 't1' });
	});

	it('rejects IPv4-mapped IPv6 private and odd mapped forms', () => {
		expect(() => assertValidUrl('https://[::ffff:10.0.0.1]/a', 'URL')).toThrow(/private IPv6/);
		expect(() => assertValidUrl('https://[::ffff:1:2:3]/a', 'URL')).toThrow(/private IPv6/);
		expect(() => assertValidUrl('https://[::ffff:808:808]/a', 'URL')).not.toThrow();
	});

	it('reads Retry-After from an array header', async () => {
		const ctx = createMockContext();
		ctx.helpers.httpRequestWithAuthentication
			.mockResolvedValueOnce(full(430, { code: 430 }, { 'retry-after': ['7'] }))
			.mockResolvedValueOnce(full(200, { code: 200 }));
		await sunoRequest.call(exec(ctx), 'POST', '/x');
		expect(sleepMock).toHaveBeenCalledWith(7_000);
	});

	it('reports an HTTP error with a text or empty body by status', async () => {
		for (const body of ['Bad Gateway', '', null]) {
			const ctx = createMockContext();
			ctx.helpers.httpRequestWithAuthentication.mockResolvedValue(full(502, body));
			const err = (await sunoRequest.call(exec(ctx), 'POST', '/x').catch((e: unknown) => e)) as NodeApiError;
			expect(err.message).toMatch(body ? /Bad Gateway/ : /HTTP 502/);
			expect(err.httpCode).toBe('502');
		}
	});

	it('uses the Suno message for an HTTP error with a JSON body', async () => {
		const ctx = createMockContext();
		ctx.helpers.httpRequestWithAuthentication.mockResolvedValue(full(401, { code: 401, msg: 'bad key' }));
		const err = (await sunoRequest.call(exec(ctx), 'POST', '/x').catch((e: unknown) => e)) as NodeApiError;
		expect(err.message).toMatch(/Invalid API key/);
	});

	it('retries a GET after HTTP 503 and returns the body', async () => {
		const ctx = createMockContext();
		ctx.helpers.httpRequestWithAuthentication
			.mockResolvedValueOnce(full(503, 'down'))
			.mockResolvedValueOnce(full(200, { code: 200, data: 2 }));
		await expect(sunoRequest.call(exec(ctx), 'GET', '/x')).resolves.toEqual({ code: 200, data: 2 });
	});

	it('honors Retry-After on a body-level rate limit', async () => {
		const ctx = createMockContext();
		ctx.helpers.httpRequestWithAuthentication
			.mockResolvedValueOnce(full(200, { code: 430 }, { 'Retry-After': '9' }))
			.mockResolvedValueOnce(full(200, { code: 200 }));
		await sunoRequest.call(exec(ctx), 'POST', '/x');
		expect(sleepMock).toHaveBeenCalledWith(9_000);
	});

	it('stops a body-level rate limit whose Retry-After is too long', async () => {
		const ctx = createMockContext();
		ctx.helpers.httpRequestWithAuthentication.mockResolvedValue(full(200, { code: 405, msg: 'slow' }, { 'retry-after': '600' }));
		const err = (await sunoRequest.call(exec(ctx), 'POST', '/x').catch((e: unknown) => e)) as NodeApiError;
		expect(ctx.helpers.httpRequestWithAuthentication).toHaveBeenCalledTimes(1);
		expect(err.message).toMatch(/600 seconds/);
	});

	it('rethrows a NodeOperationError after GET retries run out', async () => {
		const ctx = createMockContext();
		const op = new NodeOperationError({ name: 'Suno' } as never, 'boom');
		ctx.helpers.httpRequestWithAuthentication.mockRejectedValue(op);
		await expect(sunoRequest.call(exec(ctx), 'GET', '/x')).rejects.toBe(op);
		expect(ctx.helpers.httpRequestWithAuthentication).toHaveBeenCalledTimes(4);
	});

	it('wraps a plain network error after GET retries run out', async () => {
		const ctx = createMockContext();
		ctx.helpers.httpRequestWithAuthentication.mockRejectedValue(new Error('socket closed'));
		const err = (await sunoRequest.call(exec(ctx), 'GET', '/x').catch((e: unknown) => e)) as NodeApiError;
		expect(err).toBeInstanceOf(NodeApiError);
		expect(err.message).toBe('Suno API request failed');
	});

	it('the credential test fails on every documented error code', () => {
		const values = (new SunoApi().test.rules ?? []).map((r) => (r.properties as { value: number }).value);
		expect(values).toEqual(expect.arrayContaining([401, 402, 405, 429, 430, 455, 500, 501]));
	});
});

describe('handler branches', () => {
	it('simple mode without prompt or style fails before any request', async () => {
		const ctx = createMockContext({ customMode: false, instrumental: false, prompt: ' ', model: 'V5', callBackUrl: CB });
		await expect(handleMusicGeneration.call(exec(ctx), 'generate', 0)).rejects.toThrow(/Prompt or a Style/);
		expect(ctx.helpers.httpRequestWithAuthentication).not.toHaveBeenCalled();
	});

	it('Upload and Cover accepts a 4000-character prompt, the custom limit', async () => {
		const ctx = createMockContext({ uploadUrl: URL1, customMode: false, instrumental: false, prompt: 'p'.repeat(4000), model: 'V6', callBackUrl: CB }, full(200, { code: 200 }));
		await expect(handleMusicGeneration.call(exec(ctx), 'uploadCover', 0)).resolves.toBeDefined();
	});

	it('Upload and Extend with default parameters sends no custom fields', async () => {
		const ctx = createMockContext({ uploadUrl: URL1, defaultParamFlag: false, instrumental: false, model: 'V5', callBackUrl: CB }, full(200, { code: 200 }));
		await handleMusicGeneration.call(exec(ctx), 'uploadExtend', 0);
		expect(sent(ctx).body).not.toHaveProperty('title');
	});

	it('Mashup sends instrumental when set', async () => {
		const ctx = createMockContext({ uploadUrl1: URL1, uploadUrl2: URL1, customMode: false, model: 'V5', callBackUrl: CB, instrumental: true }, full(200, { code: 200 }));
		await handleMusicGeneration.call(exec(ctx), 'mashup', 0);
		expect(sent(ctx).body.instrumental).toBe(true);
	});

	it('Vocal Separation leaves out an empty type', async () => {
		const ctx = createMockContext({ taskId: 't1', audioId: 'a1', callBackUrl: CB, type: '' }, full(200, { code: 200 }));
		await handleVocalSeparation.call(exec(ctx), 'generate', 0);
		expect(sent(ctx).body).not.toHaveProperty('type');
	});

	it('Add Vocals and Add Instrumental send gender, weights and model', async () => {
		const extras = { vocalGender: 'f', styleWeight: 0.1, weirdnessConstraint: 0.2, audioWeight: 0.3, model: 'V5' };
		const vocals = createMockContext({ uploadUrl: URL1, prompt: 'p', title: 'T', style: 's', negativeTags: 'n', callBackUrl: CB, ...extras }, full(200, { code: 200 }));
		await handleVocals.call(exec(vocals), 'addVocals', 0);
		expect(sent(vocals).body).toMatchObject(extras);
		const inst = createMockContext({ uploadUrl: URL1, title: 'T', tags: 't', negativeTags: 'n', callBackUrl: CB, ...extras }, full(200, { code: 200 }));
		await handleVocals.call(exec(inst), 'addInstrumental', 0);
		expect(sent(inst).body).toMatchObject(extras);
	});

	it('Add Vocals and Add Instrumental leave out an empty model', async () => {
		const vocals = createMockContext({ uploadUrl: URL1, prompt: 'p', title: 'T', style: 's', negativeTags: 'n', callBackUrl: CB, model: '' }, full(200, { code: 200 }));
		await handleVocals.call(exec(vocals), 'addVocals', 0);
		expect(sent(vocals).body).not.toHaveProperty('model');
		const inst = createMockContext({ uploadUrl: URL1, title: 'T', tags: 't', negativeTags: 'n', callBackUrl: CB, model: '' }, full(200, { code: 200 }));
		await handleVocals.call(exec(inst), 'addInstrumental', 0);
		expect(sent(inst).body).not.toHaveProperty('model');
	});

	it('Upload Stream falls back to a generic type and name', async () => {
		const ctx = createMockContext({ binaryPropertyName: 'data', uploadPath: 'p', fileName: '' }, full(200, { code: 200 }));
		const helpers = ctx.helpers as unknown as Record<string, jest.Mock>;
		helpers.assertBinaryData = jest.fn().mockReturnValue({});
		helpers.getBinaryDataBuffer = jest.fn().mockResolvedValue(Buffer.from('abc'));
		await handleFileUpload.call(exec(ctx), 'uploadStream', 0);
		const form = sent(ctx).body as FormData;
		const file = form.get('file') as File;
		expect(file.type).toBe('application/octet-stream');
		expect(file.name).toBe('upload');
		expect(form.has('fileName')).toBe(false);
	});
});

describe('description builders without an operation filter', () => {
	it('show the field for the whole resource', () => {
		const fields = [
			d.taskIdField(['r']), d.audioIdField(['r']), d.callBackUrlField(['r']), d.modelField(['r']),
			d.uploadUrlField(['r']), d.negativeTagsField(['r']), d.vocalGenderField(['r']),
			...d.weightFields(['r']), ...d.personaFields(['r']),
		];
		for (const f of fields) expect(f.displayOptions?.show).toEqual({ resource: ['r'] });
	});
});

describe('validators ignore non-string input', () => {
	it('returns without throwing', () => {
		expect(() => assertPromptLength(5 as unknown as string, 'V5', true)).not.toThrow();
		expect(() => assertStyleLength(5 as unknown as string, 'V5')).not.toThrow();
		expect(() => assertTitleLength(5 as unknown as string, 'V5')).not.toThrow();
	});
});

describe('remaining branches', () => {
	it('every resource appears once in the Resource list', () => {
		const values = (d.buildResourceProperty().options as Array<{ value: string }>).map((o) => o.value);
		expect(new Set(values).size).toBe(values.length);
		expect(values).toHaveLength(11);
	});

	it('an unknown model falls back to the general limits', () => {
		expect(() => assertPromptLength('a'.repeat(5000), 'FUTURE', true)).not.toThrow();
		expect(() => assertPromptLength('a'.repeat(5001), 'FUTURE', true)).toThrow(/5000/);
		expect(() => assertStyleLength('a'.repeat(1001), 'FUTURE')).toThrow(/1000/);
		expect(() => assertTitleLength('a'.repeat(101), 'FUTURE')).toThrow(/100/);
	});

	it('Upload and Extend with custom parameters leaves out continueAt 0', async () => {
		const ctx = createMockContext({
			uploadUrl: URL1, defaultParamFlag: true, instrumental: false, prompt: 'l', style: 's', title: 'T', continueAt: 0, model: 'V5', callBackUrl: CB,
		}, full(200, { code: 200 }));
		await handleMusicGeneration.call(exec(ctx), 'uploadExtend', 0);
		expect(sent(ctx).body).not.toHaveProperty('continueAt');
	});
});
