import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

jest.mock('n8n-workflow', () => ({
	...jest.requireActual('n8n-workflow'),
	sleep: jest.fn().mockResolvedValue(undefined),
}));

import { sunoRequest, redactDeep } from '../nodes/Suno/transport';
import { handleMusicGeneration } from '../nodes/Suno/resources/musicGeneration/musicGeneration.handler';
import { musicGenerationFields } from '../nodes/Suno/resources/musicGeneration/musicGeneration.fields';
import { assertDurationRange } from '../nodes/Suno/utils/validators';
import { createMockContext } from './helpers/mockContext';

const CB = 'https://hooks.example.com/cb';

describe('supported n8n range (round 9)', () => {
	it('documents the n8n floor, since n8n requires the peer range to be *', () => {
		const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8')) as {
			peerDependencies?: Record<string, string>;
		};
		expect(pkg.peerDependencies?.['n8n-workflow']).toBe('*');
		const note = readFileSync(join(__dirname, '..', 'docs', 'DESIGN-DECISIONS.md'), 'utf8');
		expect(note).toMatch(/valid-peer-dependencies/);
		const readme = readFileSync(join(__dirname, '..', 'README.md'), 'utf8');
		expect(readme).toMatch(/n8n 1\.85 or newer/);
		expect(readme).not.toMatch(/n8n 1\.x and 2\.x/);
	});

	it('CI and publish run the built node against the oldest supported n8n-workflow', () => {
		for (const file of ['ci.yml', 'publish.yml']) {
			const workflow = readFileSync(join(__dirname, '..', '..', '.github', 'workflows', file), 'utf8');
			expect(workflow).toMatch(/workflow: 1\.83\.0/);
		}
	});
});

describe('network errors keep their cause (round 9)', () => {
	it('copies message and stack out of an Error, masked', () => {
		const out = redactDeep(new Error('certificate has expired')) as Record<string, unknown>;
		expect(out.message).toBe('certificate has expired');
		expect(typeof out.stack).toBe('string');
		expect(out.name).toBe('Error');
	});

	it('shows the original reason on a failed request', async () => {
		const ctx = createMockContext();
		ctx.helpers.httpRequestWithAuthentication.mockRejectedValue(new Error('certificate has expired'));
		const err = (await sunoRequest.call(ctx as unknown as IExecuteFunctions, 'POST', '/x').catch((e: unknown) => e)) as NodeApiError;
		expect(err.message).toBe('Suno API request failed');
		expect(err.description).toBe('certificate has expired');
	});

	it('handles a thrown value that is not an Error', async () => {
		const ctx = createMockContext();
		ctx.helpers.httpRequestWithAuthentication.mockRejectedValue('socket closed');
		const err = (await sunoRequest.call(ctx as unknown as IExecuteFunctions, 'POST', '/x').catch((e: unknown) => e)) as NodeApiError;
		expect(err).toBeInstanceOf(NodeApiError);
		expect(err.message).toBe('Suno API request failed');
	});
});

describe('Replace Section bounds (round 9)', () => {
	it('rejects negative times', () => {
		expect(() => assertDurationRange(-10, 0)).toThrow(/negative/);
		expect(() => assertDurationRange(0, -1)).toThrow(/negative/);
		expect(() => assertDurationRange(0, 20)).not.toThrow();
	});

	it('sends nothing for a negative start', async () => {
		const ctx = createMockContext({
			taskId: 't1', audioId: 'a1', prompt: 'p', tags: 'pop', title: 'T', fullLyrics: 'l', infillStartS: -10, infillEndS: 0, callBackUrl: CB,
		});
		await expect(handleMusicGeneration.call(ctx as unknown as IExecuteFunctions, 'replaceSection', 0)).rejects.toThrow(/negative/);
		expect(ctx.helpers.httpRequestWithAuthentication).not.toHaveBeenCalled();
	});

	it('the editor does not allow negative times', () => {
		for (const name of ['infillStartS', 'infillEndS']) {
			const field = musicGenerationFields.find((f) => f.name === name);
			expect(field?.typeOptions?.minValue).toBe(0);
		}
	});
});
