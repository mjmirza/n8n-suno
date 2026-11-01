import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

jest.mock('n8n-workflow', () => ({
	...jest.requireActual('n8n-workflow'),
	sleep: jest.fn().mockResolvedValue(undefined),
}));

import { sunoRequest, redactDeep, parseErrorResponse } from '../nodes/Suno/transport';
import { assertVocalSegment } from '../nodes/Suno/utils/validators';
import { personaFields } from '../nodes/Suno/resources/persona/persona.fields';
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

describe('body code 429 on endpoints that document it as a rate limit (round 10)', () => {
	const limited = { code: 429, msg: 'Rate Limited' };

	it.each(['/api/v1/generate/generate-persona', '/api/v1/generate/mashup', '/api/v1/generate/replace-section'])(
		'retries a POST to %s and labels it a rate limit',
		async (path) => {
			const ctx = createMockContext();
			ctx.helpers.httpRequestWithAuthentication
				.mockResolvedValueOnce({ statusCode: 200, headers: { 'retry-after': '1' }, body: limited })
				.mockResolvedValueOnce({ statusCode: 200, headers: {}, body: { code: 200, data: { ok: true } } });
			const out = await sunoRequest.call(ctx as unknown as IExecuteFunctions, 'POST', path, {});
			expect(out).toEqual({ code: 200, data: { ok: true } });
			expect(ctx.helpers.httpRequestWithAuthentication).toHaveBeenCalledTimes(2);
			expect(parseErrorResponse(limited, path)).toBe('Rate limit exceeded — slow down: Rate Limited');
		},
	);

	it('still treats 429 as insufficient credits on Generate and does not retry', async () => {
		const ctx = createMockContext();
		ctx.helpers.httpRequestWithAuthentication.mockResolvedValue({ statusCode: 200, headers: {}, body: { code: 429, msg: 'no credits' } });
		await expect(sunoRequest.call(ctx as unknown as IExecuteFunctions, 'POST', '/api/v1/generate', {})).rejects.toThrow('Insufficient credits');
		expect(ctx.helpers.httpRequestWithAuthentication).toHaveBeenCalledTimes(1);
	});
});

describe('persona vocal segment bounds (round 10)', () => {
	it('rejects a negative start or end', () => {
		expect(() => assertVocalSegment(-10, 10)).toThrow('must not be negative');
		expect(() => assertVocalSegment(-30, -10)).toThrow('must not be negative');
		expect(() => assertVocalSegment(0, 20)).not.toThrow();
	});

	it('sets minValue 0 on both fields in the editor', () => {
		for (const name of ['vocalStart', 'vocalEnd']) {
			const field = personaFields.find((f) => f.name === name);
			expect(field?.typeOptions?.minValue).toBe(0);
		}
	});
});

describe('a secret echoed as the body code (round 10)', () => {
	it('is masked in httpCode and everywhere else in the thrown error', async () => {
		const ctx = createMockContext();
		ctx.getCredentials.mockResolvedValue({ apiKey: KEY });
		ctx.helpers.httpRequestWithAuthentication.mockResolvedValue({ statusCode: 200, headers: {}, body: { code: KEY, msg: 'rejected' } });
		const err = (await sunoRequest.call(ctx as unknown as IExecuteFunctions, 'POST', '/x').catch((e: unknown) => e)) as NodeApiError;
		expect(String(err.httpCode)).not.toContain(KEY);
		expect(JSON.stringify({ ...err, message: err.message, stack: err.stack })).not.toContain(KEY);
	});
});
