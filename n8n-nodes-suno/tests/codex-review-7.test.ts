import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

jest.mock('n8n-workflow', () => ({
	...jest.requireActual('n8n-workflow'),
	sleep: jest.fn().mockResolvedValue(undefined),
}));

import { sunoRequest, redactSecrets } from '../nodes/Suno/transport';
import { vocalsFields } from '../nodes/Suno/resources/vocals/vocals.fields';
import { createMockContext } from './helpers/mockContext';

const NODE = { id: 'n', name: 'Suno', type: 'x', typeVersion: 1, position: [0, 0], parameters: {} };
const UUID_KEY = '3f2b8c1e-9d4a-4e7b-8c2f-1a6d5e9b0c7d';
const TOKEN = 'abcdef1234567890abcdef1234567890';
const full = (statusCode: number, body: unknown) => ({ statusCode, headers: {}, body });

function withKey(key: string) {
	const ctx = createMockContext();
	ctx.getCredentials.mockResolvedValue({ apiKey: key });
	return ctx;
}

const everything = (err: NodeApiError) =>
	JSON.stringify({ ...err, message: err.message, stack: err.stack, description: err.description, context: err.context, messages: err.messages });

describe('masking the configured key and the stack (round 7)', () => {
	it('masks the exact configured key, even in a shape no pattern matches', async () => {
		const ctx = withKey(UUID_KEY);
		ctx.helpers.httpRequestWithAuthentication.mockResolvedValue(full(401, { msg: `key ${UUID_KEY} rejected` }));
		const err = (await sunoRequest.call(ctx as unknown as IExecuteFunctions, 'POST', '/x').catch((e: unknown) => e)) as NodeApiError;
		expect(everything(err)).not.toContain(UUID_KEY);
	});

	it('masks a token in the stack of a helper-thrown error', async () => {
		const ctx = withKey(UUID_KEY);
		const http = new NodeApiError(NODE as never, { message: `Unauthorized Bearer ${TOKEN}` } as never, { httpCode: '401' });
		http.stack = `NodeApiError: Unauthorized Bearer ${TOKEN}\n    at x (y.js:1:1)`;
		ctx.helpers.httpRequestWithAuthentication.mockRejectedValue(http);
		const err = (await sunoRequest.call(ctx as unknown as IExecuteFunctions, 'POST', '/x').catch((e: unknown) => e)) as NodeApiError;
		expect(err.stack).not.toContain(TOKEN);
	});

	it('masks the key in a rethrown NodeOperationError', async () => {
		const ctx = withKey(UUID_KEY);
		ctx.helpers.httpRequestWithAuthentication.mockRejectedValue(new NodeOperationError(NODE as never, `failed with ${UUID_KEY}`));
		const err = (await sunoRequest.call(ctx as unknown as IExecuteFunctions, 'GET', '/x').catch((e: unknown) => e)) as Error;
		expect(err.message).not.toContain(UUID_KEY);
		expect(String(err.stack)).not.toContain(UUID_KEY);
	});

	it('masks the key in a wrapped network error', async () => {
		const ctx = withKey(UUID_KEY);
		ctx.helpers.httpRequestWithAuthentication.mockRejectedValue(new Error(`connect failed for ${UUID_KEY}`));
		const err = (await sunoRequest.call(ctx as unknown as IExecuteFunctions, 'POST', '/x').catch((e: unknown) => e)) as NodeApiError;
		expect(everything(err)).not.toContain(UUID_KEY);
	});

	it('still runs when credentials cannot be read or the key is short', async () => {
		const failing = createMockContext(undefined, full(200, { code: 200 }));
		failing.getCredentials.mockRejectedValue(new Error('no credentials'));
		await expect(sunoRequest.call(failing as unknown as IExecuteFunctions, 'GET', '/x')).resolves.toEqual({ code: 200 });
		const short = withKey('abc');
		short.helpers.httpRequestWithAuthentication.mockResolvedValue(full(200, { code: 200 }));
		await expect(sunoRequest.call(short as unknown as IExecuteFunctions, 'GET', '/x')).resolves.toEqual({ code: 200 });
		const missing = createMockContext(undefined, full(200, { code: 200 }));
		missing.getCredentials.mockResolvedValue({});
		await expect(sunoRequest.call(missing as unknown as IExecuteFunctions, 'GET', '/x')).resolves.toEqual({ code: 200 });
	});

	it('redactSecrets masks every occurrence of a literal', () => {
		expect(redactSecrets(`${UUID_KEY} and ${UUID_KEY}`, [UUID_KEY])).toBe('[redacted] and [redacted]');
	});
});

describe('current models for vocals (round 7)', () => {
	it('Add Vocals and Add Instrumental offer V6, V6 Mini and V6 Wild', () => {
		const models = vocalsFields.filter((f) => f.name === 'model');
		expect(models.length).toBeGreaterThan(0);
		for (const field of models) {
			const values = (field.options as Array<{ value: string }>).map((o) => o.value);
			expect(values).toEqual(expect.arrayContaining(['V6', 'V6_MINI', 'V6_WILD', 'V5', 'V4_5PLUS']));
		}
	});
});
