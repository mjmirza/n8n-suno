'use strict';
// Runs the built node on each supported Node.js version. Plain node:test, no build tools needed.
const test = require('node:test');
const assert = require('node:assert/strict');
const { Suno } = require('../dist/nodes/Suno/Suno.node.js');

function context(params, reply, extra = {}) {
	const calls = [];
	return {
		calls,
		getInputData: () => [{ json: {} }],
		getNodeParameter: (name, _i, fallback) => (name in params ? params[name] : fallback),
		getCredentials: async () => ({ apiKey: 'runtime-test-key-123456' }),
		getNode: () => ({ id: 'n', name: 'Suno', type: 'n8n-nodes-suno.suno', typeVersion: 1, position: [0, 0], parameters: {} }),
		continueOnFail: () => false,
		helpers: {
			httpRequestWithAuthentication: async (_cred, options) => {
				calls.push(options);
				return { statusCode: 200, headers: {}, body: reply };
			},
			...extra,
		},
	};
}

const run = (ctx) => new Suno().execute.call(ctx);

test('Get Credits returns the balance', async () => {
	const ctx = context({ resource: 'credit', operation: 'get' }, { code: 200, data: 42 });
	const out = await run(ctx);
	assert.equal(out[0][0].json.credits, 42);
});

test('Generate validates URLs and sends the request', async () => {
	const ctx = context(
		{ resource: 'musicGeneration', operation: 'generate', customMode: false, instrumental: false, prompt: 'a calm song', model: 'V5', callBackUrl: 'https://hooks.example.com/cb' },
		{ code: 200, data: { taskId: 't1' } },
	);
	await run(ctx);
	assert.equal(ctx.calls[0].body.style, 'a calm song');
	const bad = context(
		{ resource: 'musicGeneration', operation: 'generate', customMode: false, instrumental: false, prompt: 'x', model: 'V5', callBackUrl: 'not a url' },
		{ code: 200 },
	);
	await assert.rejects(run(bad), /not a valid URL/);
});

test('Upload Stream builds a multipart body with the built-in FormData', async () => {
	const ctx = context(
		{ resource: 'fileUpload', operation: 'uploadStream', binaryPropertyName: 'data', uploadPath: 'n8n', fileName: 'a.mp3' },
		{ code: 200, data: { fileUrl: 'https://cdn.example.com/a.mp3' } },
		{
			assertBinaryData: () => ({ mimeType: 'audio/mpeg', fileName: 'a.mp3' }),
			getBinaryDataBuffer: async () => Buffer.from('abc'),
		},
	);
	await run(ctx);
	assert.ok(ctx.calls[0].body instanceof FormData);
	assert.equal(ctx.calls[0].body.get('file').name, 'a.mp3');
});
