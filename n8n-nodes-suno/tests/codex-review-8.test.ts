import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertValidUrl } from '../nodes/Suno/transport';

describe('runtimes without URL.canParse (round 8)', () => {
	const original = (URL as unknown as { canParse?: unknown }).canParse;

	beforeAll(() => {
		(URL as unknown as { canParse?: unknown }).canParse = undefined;
	});

	afterAll(() => {
		(URL as unknown as { canParse?: unknown }).canParse = original;
	});

	it('validates URLs without URL.canParse', () => {
		expect(() => assertValidUrl('https://cdn.example.com/a.mp3', 'URL')).not.toThrow();
		expect(() => assertValidUrl('not a url', 'URL')).toThrow('URL is not a valid URL');
		expect(() => assertValidUrl('https://10.0.0.1/a', 'URL')).toThrow(/private IP/);
	});

	it('no node source calls URL.canParse', () => {
		const source = readFileSync(join(__dirname, '..', 'nodes', 'Suno', 'transport.ts'), 'utf8');
		expect(source).not.toMatch(/URL\.canParse\(/);
	});
});

describe('declared runtime (round 8)', () => {
	it('package.json and the README state the Node.js 18 minimum', () => {
		const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8')) as { engines?: { node?: string } };
		expect(pkg.engines?.node).toBe('>=18.0.0');
		const readme = readFileSync(join(__dirname, '..', 'README.md'), 'utf8');
		expect(readme).toMatch(/Node\.js 18 or newer/);
	});
});
