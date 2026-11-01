import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

jest.mock('n8n-workflow', () => ({
	...jest.requireActual('n8n-workflow'),
	sleep: jest.fn().mockResolvedValue(undefined),
}));

import { sunoRequest, redactDeep } from '../nodes/Suno/transport';
import { createMockContext } from './helpers/mockContext';

const KEY = '3f2b8c1e-9d4a-4e7b-8c2f-1a6d5e9b0c7d';
const TOKEN = 'abcdef1234567890abcdef1234567890';

describe('secrets used as property names (round 10)', () => {
	it('masks a configured key and a token-shaped string when they appear as keys', () => {
		const out = redactDeep({ [KEY]: 'echo', nested: { [`Bearer ${TOKEN}`]: 1 } }, [KEY]);
		expect(JSON.stringify(out)).not.toContain(KEY);
		expect(JSON.stringify(out)).not.toContain(TOKEN);
	});

	it('keeps the key out of a thrown error', async () => {
		const ctx = createMockContext();
		ctx.getCredentials.mockResolvedValue({ apiKey: KEY });
		ctx.helpers.httpRequestWithAuthentication.mockResolvedValue({
			statusCode: 400,
			headers: {},
			body: { code: 400, msg: 'bad request', response: { data: { [KEY]: 'echo' } } },
		});
		const err = (await sunoRequest.call(ctx as unknown as IExecuteFunctions, 'POST', '/x').catch((e: unknown) => e)) as NodeApiError;
		expect(JSON.stringify({ ...err, message: err.message, stack: err.stack, description: err.description, context: err.context })).not.toContain(KEY);
		expect(JSON.stringify(err)).not.toContain(KEY);
	});
});
