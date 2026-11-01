import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

jest.mock('n8n-workflow', () => ({
	...jest.requireActual('n8n-workflow'),
	sleep: jest.fn().mockResolvedValue(undefined),
}));

import { sunoRequest, assertValidUrl, redactDeep } from '../nodes/Suno/transport';
import { handleMusicGeneration } from '../nodes/Suno/resources/musicGeneration/musicGeneration.handler';
import { weightFields } from '../nodes/Suno/utils/descriptions';
import { musicGenerationFields } from '../nodes/Suno/resources/musicGeneration/musicGeneration.fields';
import { createMockContext } from './helpers/mockContext';

const TOKEN = 'abcdef1234567890abcdef1234567890';
const CB = 'https://hooks.example.com/cb';
const full = (statusCode: number, body: unknown) => ({ statusCode, headers: {}, body });

function nest(levels: number, leaf: unknown): Record<string, unknown> {
	let value: unknown = leaf;
	for (let i = 0; i < levels; i++) value = { data: value };
	return value as Record<string, unknown>;
}

describe('masking at any depth (round 6)', () => {
	it('never passes a deeply nested token through', () => {
		const out = redactDeep(nest(12, `Bearer ${TOKEN}`));
		expect(JSON.stringify(out)).not.toContain(TOKEN);
	});

	it('replaces a repeated object instead of returning it raw', () => {
		const a: Record<string, unknown> = { secret: `Bearer ${TOKEN}` };
		a.self = a;
		const out = redactDeep(a) as Record<string, unknown>;
		expect(out.self).toBe('[circular]');
		expect(out.secret).not.toContain(TOKEN);
	});

	it('keeps a deeply nested token out of the error n8n shows', async () => {
		const ctx = createMockContext();
		ctx.helpers.httpRequestWithAuthentication.mockResolvedValue(full(400, nest(10, { message: `Bearer ${TOKEN}` })));
		const err = (await sunoRequest.call(ctx as unknown as IExecuteFunctions, 'POST', '/x').catch((e: unknown) => e)) as NodeApiError;
		expect(JSON.stringify({ ...err, message: err.message, description: err.description, context: err.context })).not.toContain(TOKEN);
	});
});

describe('hostnames that start with private-looking numbers (round 6)', () => {
	it('accepts public DNS names such as 10.example.com', () => {
		expect(() => assertValidUrl('https://10.example.com/callback', 'URL')).not.toThrow();
		expect(() => assertValidUrl('https://192.168.example.com/a.mp3', 'URL')).not.toThrow();
	});

	it('still rejects private IPv4 literals', () => {
		expect(() => assertValidUrl('https://10.0.0.1/cb', 'URL')).toThrow(/private IP/);
		expect(() => assertValidUrl('https://192.168.1.5/cb', 'URL')).toThrow(/private IP/);
	});
});

describe('Audio Weight on instrumental tracks (round 6)', () => {
	it('is not sent when instrumental is on', async () => {
		const ctx = createMockContext(
			{ customMode: true, instrumental: true, style: 'ambient', title: 'T', model: 'V5', callBackUrl: CB, audioWeight: 0.4, styleWeight: 0.5 },
			full(200, { code: 200 }),
		);
		await handleMusicGeneration.call(ctx as unknown as IExecuteFunctions, 'generate', 0);
		const body = ctx.helpers.httpRequestWithAuthentication.mock.calls[0][1].body;
		expect(body).not.toHaveProperty('audioWeight');
		expect(body.styleWeight).toBe(0.5);
	});

	it('is hidden in the editor when instrumental is on', () => {
		const audio = weightFields(['musicGeneration'], ['generate']).find((f) => f.name === 'audioWeight');
		expect(audio).toBeDefined();
		expect(audio?.displayOptions?.hide).toEqual({ instrumental: [true] });
		expect(audio?.displayOptions?.show).toEqual({ resource: ['musicGeneration'], operation: ['generate'] });
	});

	it('stays hidden for instrumental Generate after the custom-mode filter', () => {
		const audio = musicGenerationFields.find((f) => f.name === 'audioWeight' && f.displayOptions?.show?.operation?.includes('generate'));
		expect(audio?.displayOptions?.hide).toEqual({ instrumental: [true] });
		expect(audio?.displayOptions?.show?.customMode).toEqual([true]);
	});
});
