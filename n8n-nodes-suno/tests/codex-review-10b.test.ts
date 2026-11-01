import type { IExecuteFunctions } from 'n8n-workflow';

jest.mock('n8n-workflow', () => ({
	...jest.requireActual('n8n-workflow'),
	sleep: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../nodes/Suno/resources/credit/credit.handler', () => ({ handleCredit: jest.fn().mockResolvedValue(undefined) }));

import { Suno } from '../nodes/Suno/Suno.node';
import { redactSecrets, sunoRequest } from '../nodes/Suno/transport';
import { createMockContext } from './helpers/mockContext';

const KEY = '3f2b8c1e-9d4a-4e7b-8c2f-1a6d5e9b0c7d';

describe('round 10b', () => {
	it('masks the configured key in a successful response, keys and values, and leaves other text intact', async () => {
		const ctx = createMockContext();
		ctx.getCredentials.mockResolvedValue({ apiKey: KEY });
		ctx.helpers.httpRequestWithAuthentication.mockResolvedValue({
			statusCode: 200,
			headers: {},
			body: { code: 200, data: { taskId: 'abcdef1234567890abcdef1234567890', errorMessage: `bad key ${KEY}`, [KEY]: 1, list: [KEY, 2, null] } },
		});
		const out = await sunoRequest.call(ctx as unknown as IExecuteFunctions, 'GET', '/api/v1/generate/record-info');
		expect(JSON.stringify(out)).not.toContain(KEY);
		expect((out as { data: { taskId: string } }).data.taskId).toBe('abcdef1234567890abcdef1234567890');
	});

	it.each(['<html>502 Bad Gateway</html>', null])('rejects a non-JSON success body (%p)', async (body) => {
		const ctx = createMockContext();
		ctx.helpers.httpRequestWithAuthentication.mockResolvedValue({ statusCode: 200, headers: {}, body });
		await expect(sunoRequest.call(ctx as unknown as IExecuteFunctions, 'GET', '/x')).rejects.toThrow('unexpected response instead of JSON');
	});

	it('fails an item whose handler produced no result', async () => {
		const ctx = createMockContext({ resource: 'credit', operation: 'get' });
		await expect(new Suno().execute.call(ctx as unknown as IExecuteFunctions)).rejects.toThrow('Suno returned no result');
	});

	it.each([{}, { error: 'gateway failure' }, []])('rejects a JSON body without a status code (%p)', async (body) => {
		const ctx = createMockContext();
		ctx.helpers.httpRequestWithAuthentication.mockResolvedValue({ statusCode: 200, headers: {}, body });
		await expect(sunoRequest.call(ctx as unknown as IExecuteFunctions, 'GET', '/x')).rejects.toThrow('without its status code');
	});

	it('masks the whole key even when it sits past the message length limit', async () => {
		const ctx = createMockContext();
		ctx.getCredentials.mockResolvedValue({ apiKey: KEY });
		ctx.helpers.httpRequestWithAuthentication.mockResolvedValue({ statusCode: 200, headers: {}, body: { code: 400, msg: 'x'.repeat(970) + KEY } });
		const err = (await sunoRequest.call(ctx as unknown as IExecuteFunctions, 'POST', '/x').catch((e: unknown) => e)) as Error;
		expect(JSON.stringify({ ...err, message: err.message, stack: err.stack })).not.toContain(KEY.slice(0, 12));
	});

	it('masks the key before trimming a non-JSON body', async () => {
		const ctx = createMockContext();
		ctx.getCredentials.mockResolvedValue({ apiKey: KEY });
		ctx.helpers.httpRequestWithAuthentication.mockResolvedValue({ statusCode: 200, headers: {}, body: 'y'.repeat(180) + KEY });
		const err = (await sunoRequest.call(ctx as unknown as IExecuteFunctions, 'GET', '/x').catch((e: unknown) => e)) as Error;
		expect(JSON.stringify({ ...err, message: err.message, stack: err.stack })).not.toContain(KEY.slice(0, 12));
	});

	it('redactSecrets masks token patterns when no configured key is given', () => {
		expect(redactSecrets('Bearer abcdef1234567890abcdef1234567890')).not.toContain('abcdef1234567890abcdef1234567890');
	});
});
