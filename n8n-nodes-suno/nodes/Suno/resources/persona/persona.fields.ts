import type { INodeProperties } from 'n8n-workflow';

import { taskIdField, audioIdField } from '../../utils/descriptions';

// ---------------------------------------------------------------------------
// Generate Persona fields
// ---------------------------------------------------------------------------

const personaName: INodeProperties = {
	displayName: 'Name',
	name: 'name',
	type: 'string',
	default: '',
	required: true,
	description: 'Recognizable name for the persona',
	displayOptions: {
		show: {
			resource: ['persona'],
			operation: ['generate'],
		},
	},
};

const personaDescription: INodeProperties = {
	displayName: 'Description',
	name: 'description',
	type: 'string',
	default: '',
	required: true,
	description: 'Detailed description of musical characteristics',
	displayOptions: {
		show: {
			resource: ['persona'],
			operation: ['generate'],
		},
	},
};

const vocalStart: INodeProperties = {
	displayName: 'Vocal Start',
	name: 'vocalStart',
	type: 'number',
	default: 0,
	typeOptions: { minValue: 0 },
	description: 'Start time in seconds for vocal analysis',
	displayOptions: {
		show: {
			resource: ['persona'],
			operation: ['generate'],
		},
	},
};

const vocalEnd: INodeProperties = {
	displayName: 'Vocal End',
	name: 'vocalEnd',
	type: 'number',
	default: 30,
	typeOptions: { minValue: 0 },
	description: 'End time in seconds for vocal analysis',
	displayOptions: {
		show: {
			resource: ['persona'],
			operation: ['generate'],
		},
	},
};

const personaStyle: INodeProperties = {
	displayName: 'Style',
	name: 'style',
	type: 'string',
	default: '',
	description: 'Music style label',
	displayOptions: {
		show: {
			resource: ['persona'],
			operation: ['generate'],
		},
	},
};

// ---------------------------------------------------------------------------
// Export all fields
// ---------------------------------------------------------------------------

export const personaFields: INodeProperties[] = [
	taskIdField(['persona'], ['generate'], 'Task ID from a completed V4+ music generation'),
	audioIdField(['persona'], ['generate']),
	personaName,
	personaDescription,
	vocalStart,
	vocalEnd,
	personaStyle,
];
