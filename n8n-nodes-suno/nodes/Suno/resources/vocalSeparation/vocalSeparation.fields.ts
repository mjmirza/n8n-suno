import type { INodeProperties } from 'n8n-workflow';

import {
	taskIdField,
	audioIdField,
	callBackUrlField,
} from '../../utils/descriptions';

// ---------------------------------------------------------------------------
// Type field
// ---------------------------------------------------------------------------

const separationType: INodeProperties = {
	displayName: 'Type',
	name: 'type',
	type: 'options',
	default: 'separate_vocal',
	description: 'Separation mode to use',
	displayOptions: {
		show: {
			resource: ['vocalSeparation'],
			operation: ['generate'],
		},
	},
	options: [
		{
			name: '2 Stems (Vocals + Instrumental)',
			value: 'separate_vocal',
			description: '2 stems (vocals + instrumental) — 10 credits',
		},
		{
			name: '12 Stems (Full Separation)',
			value: 'split_stem',
			description: '12 stems (vocals, drums, bass, guitar, keyboard, strings, brass, woodwinds, percussion, synth, fx, backing vocals) — 50 credits',
		},
	],
};

// ---------------------------------------------------------------------------
// Export all fields
// ---------------------------------------------------------------------------

export const vocalSeparationFields: INodeProperties[] = [
	taskIdField(['vocalSeparation'], ['generate']),
	audioIdField(['vocalSeparation'], ['generate']),
	callBackUrlField(['vocalSeparation'], ['generate']),
	separationType,
];
