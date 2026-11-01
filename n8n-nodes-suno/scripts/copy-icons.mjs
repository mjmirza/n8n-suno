// Copies node icons and node metadata (*.node.json) into dist, since tsc only emits compiled sources.
import { cpSync, globSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

for (const file of globSync('nodes/**/*.{svg,png,node.json}')) {
	const target = join('dist', file);
	mkdirSync(dirname(target), { recursive: true });
	cpSync(file, target);
}
