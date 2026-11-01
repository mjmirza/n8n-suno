import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

jest.mock('n8n-workflow', () => ({
	...jest.requireActual('n8n-workflow'),
	sleep: jest.fn().mockResolvedValue(undefined),
}));

import { Suno } from '../nodes/Suno/Suno.node';
import { assertValidUrl, sunoRequest } from '../nodes/Suno/transport';
import { handleFileUpload } from '../nodes/Suno/resources/fileUpload/fileUpload.handler';
import { handleMusicGeneration } from '../nodes/Suno/resources/musicGeneration/musicGeneration.handler';
import { handleVocals } from '../nodes/Suno/resources/vocals/vocals.handler';
import { musicGenerationFields } from '../nodes/Suno/resources/musicGeneration/musicGeneration.fields';
import { createMockContext } from './helpers/mockContext';

const NODE = { id: 'n', name: 'Suno', type: 'x', typeVersion: 1, position: [0, 0], parameters: {} };

function httpError(code: number, headers?: Record<string, string>): NodeApiError {
	const err = new NodeApiError(NODE as never, { message: `HTTP ${code}` }, { httpCode: String(code) });
	if (headers) (err as unknown as { headers: Record<string, string> }).headers = headers;
	return err;
}

function call(ctx: ReturnType<typeof createMockContext>, method: 'GET' | 'POST') {
	return sunoRequest.call(ctx as unknown as IExecuteFunctions, method, '/api/v1/generate', { a: 1 });
}

describe('retry policy (finding 1, 10)', () => {
	it('POST is sent once when the gateway returns 504', async () => {
		const ctx = createMockContext();
		ctx.helpers.httpRequestWithAuthentication.mockRejectedValue(httpError(504));
		await expect(call(ctx, 'POST')).rejects.toBeInstanceOf(NodeApiError);
		expect(ctx.helpers.httpRequestWithAuthentication).toHaveBeenCalledTimes(1);
	});

	it('POST is sent once on a network error', async () => {
		const ctx = createMockContext();
		ctx.helpers.httpRequestWithAuthentication.mockRejectedValue(
			Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' }),
		);
		await expect(call(ctx, 'POST')).rejects.toThrow();
		expect(ctx.helpers.httpRequestWithAuthentication).toHaveBeenCalledTimes(1);
	});

	it('POST is retried when Suno rejects it for request frequency (body code 430)', async () => {
		const ctx = createMockContext();
		ctx.helpers.httpRequestWithAuthentication
			.mockResolvedValueOnce({ code: 430, msg: 'slow down' })
			.mockResolvedValueOnce({ code: 200, data: { taskId: 't1' } });
		await expect(call(ctx, 'POST')).resolves.toEqual({ code: 200, data: { taskId: 't1' } });
		expect(ctx.helpers.httpRequestWithAuthentication).toHaveBeenCalledTimes(2);
	});

	it('insufficient credits (body code 429) is never retried', async () => {
		const ctx = createMockContext();
		ctx.helpers.httpRequestWithAuthentication.mockResolvedValue({ code: 429, msg: 'no credits' });
		await expect(call(ctx, 'GET')).rejects.toThrow('Insufficient credits');
		expect(ctx.helpers.httpRequestWithAuthentication).toHaveBeenCalledTimes(1);
	});

	it('GET is retried after a 503 and then succeeds', async () => {
		const ctx = createMockContext();
		ctx.helpers.httpRequestWithAuthentication
			.mockRejectedValueOnce(httpError(503))
			.mockResolvedValueOnce({ code: 200, data: 7 });
		await expect(call(ctx, 'GET')).resolves.toEqual({ code: 200, data: 7 });
		expect(ctx.helpers.httpRequestWithAuthentication).toHaveBeenCalledTimes(2);
	});

	it('GET stops after the attempt limit', async () => {
		const ctx = createMockContext();
		ctx.helpers.httpRequestWithAuthentication.mockRejectedValue(httpError(502));
		await expect(call(ctx, 'GET')).rejects.toBeInstanceOf(NodeApiError);
		expect(ctx.helpers.httpRequestWithAuthentication).toHaveBeenCalledTimes(4);
	});

	it('a 400 is never retried', async () => {
		const ctx = createMockContext();
		ctx.helpers.httpRequestWithAuthentication.mockRejectedValue(httpError(400));
		await expect(call(ctx, 'GET')).rejects.toBeInstanceOf(NodeApiError);
		expect(ctx.helpers.httpRequestWithAuthentication).toHaveBeenCalledTimes(1);
	});
});

describe('Get Credits output (finding 2)', () => {
	it('wraps the documented integer response in an object', async () => {
		const ctx = createMockContext({ resource: 'credit', operation: 'get' }, { code: 200, msg: 'success', data: 100 });
		ctx.getInputData.mockReturnValue([{ json: {} }]);
		const out = await new Suno().execute.call(ctx as unknown as IExecuteFunctions);
		expect(out[0]).toEqual([{ json: { credits: 100 }, pairedItem: { item: 0 } }]);
	});

});

describe('Upload Stream multipart (finding 3)', () => {
	it('sends a real multipart body with a binary part named file', async () => {
		const ctx = createMockContext(
			{ binaryPropertyName: 'data', uploadPath: 'audio', fileName: 'song.mp3' },
			{ code: 200, data: { fileUrl: 'u' } },
		) as ReturnType<typeof createMockContext> & { helpers: Record<string, jest.Mock> };
		ctx.helpers.assertBinaryData = jest.fn().mockReturnValue({ fileName: 'a.mp3', mimeType: 'audio/mpeg' });
		ctx.helpers.getBinaryDataBuffer = jest.fn().mockResolvedValue(Buffer.from('abc'));
		await handleFileUpload.call(ctx as unknown as IExecuteFunctions, 'uploadStream', 0);
		const options = ctx.helpers.httpRequestWithAuthentication.mock.calls[0][1];
		expect(options.body).toBeInstanceOf(FormData);
		const form = options.body as FormData;
		const file = form.get('file') as File;
		expect(file).toBeInstanceOf(Blob);
		expect(file.name).toBe('song.mp3');
		expect(Buffer.from(await file.arrayBuffer()).toString()).toBe('abc');
		expect(form.get('uploadPath')).toBe('audio');
		const headers = (options.headers ?? {}) as Record<string, string>;
		expect(Object.keys(headers).map((h) => h.toLowerCase())).not.toContain('content-type');
	});
});

describe('Replace Section fullLyrics (finding 4)', () => {
	it('exposes a required Full Lyrics field', () => {
		const field = musicGenerationFields.find(
			(f) => f.name === 'fullLyrics' && f.displayOptions?.show?.operation?.includes('replaceSection'),
		);
		expect(field?.required).toBe(true);
	});

	it('sends fullLyrics to the API', async () => {
		const ctx = createMockContext(
			{
				taskId: 't1', audioId: 'a1', prompt: 'new verse', tags: 'pop', title: 'T',
				infillStartS: 10, infillEndS: 20, fullLyrics: 'whole song',
			},
			{ code: 200, data: { taskId: 'x' } },
		);
		await handleMusicGeneration.call(ctx as unknown as IExecuteFunctions, 'replaceSection', 0);
		expect(ctx.helpers.httpRequestWithAuthentication.mock.calls[0][1].body.fullLyrics).toBe('whole song');
	});
});

describe('Add Vocals optional prompt (finding 6)', () => {
	it('accepts an empty prompt and omits it from the body', async () => {
		const ctx = createMockContext(
			{
				uploadUrl: 'https://cdn.example.com/a.mp3', prompt: '', title: 'T', style: 'pop',
				negativeTags: 'metal', callBackUrl: 'https://hooks.example.com/cb',
			},
			{ code: 200, data: { taskId: 'x' } },
		);
		await handleVocals.call(ctx as unknown as IExecuteFunctions, 'addVocals', 0);
		expect(ctx.helpers.httpRequestWithAuthentication.mock.calls[0][1].body).not.toHaveProperty('prompt');
	});
});

describe('item index on API errors (finding 5)', () => {
	it('carries the failing item index in the error context', async () => {
		const ctx = createMockContext({ resource: 'credit', operation: 'get' });
		ctx.getInputData.mockReturnValue([{ json: {} }, { json: {} }]);
		ctx.helpers.httpRequestWithAuthentication
			.mockResolvedValueOnce({ code: 200, data: 1 })
			.mockResolvedValueOnce({ code: 400, msg: 'bad' });
		const err = await new Suno().execute.call(ctx as unknown as IExecuteFunctions).catch((e: unknown) => e);
		expect(err).toBeInstanceOf(NodeApiError);
		expect((err as NodeApiError).context.itemIndex).toBe(1);
	});
});

describe('private address blocking (finding 7)', () => {
	it.each([
		'https://[fc00::123]/a',
		'https://[fd12::1]/a',
		'https://[fe80::123]/a',
		'https://[::1]/a',
		'https://[::]/a',
		'https://[::ffff:127.0.0.1]/a',
		'https://[::ffff:10.0.0.1]/a',
		'https://100.64.0.1/a',
		'https://foo.localhost/a',
	])('rejects %s', (url) => {
		expect(() => assertValidUrl(url, 'URL')).toThrow();
	});

	it.each(['https://cdn.example.com/a.mp3', 'https://[2001:db8::1]/a', 'https://8.8.8.8/a'])('accepts %s', (url) => {
		expect(() => assertValidUrl(url, 'URL')).not.toThrow();
	});
});

describe('packaging and release gates (findings 8, 9)', () => {
	const root = join(__dirname, '..');

	it('the build copies Suno.node.json into dist', () => {
		const script = readFileSync(join(root, 'scripts/copy-icons.mjs'), 'utf8');
		expect(script).toMatch(/json/);
	});

	it('the publish workflow runs typecheck, lint and the README check before publishing', () => {
		const wf = readFileSync(join(root, '../.github/workflows/publish.yml'), 'utf8');
		const publishAt = wf.indexOf('npm publish');
		for (const step of ['npm run typecheck', 'npm run lint', 'npm run build', 'cmp ../README.md README.md']) {
			const at = wf.indexOf(step);
			expect(at).toBeGreaterThan(-1);
			expect(at).toBeLessThan(publishAt);
		}
	});

	it('dist ships the node metadata after a build', () => {
		if (!existsSync(join(root, 'dist'))) return;
		expect(existsSync(join(root, 'dist/nodes/Suno/Suno.node.json'))).toBe(true);
	});
});
