import type { INodeProperties } from 'n8n-workflow';

import {
	uploadUrlField,
	callBackUrlField,
	negativeTagsField,
	vocalGenderField,
	weightFields,
} from '../../utils/descriptions';

// ---------------------------------------------------------------------------
// Shared model options (V4_5PLUS / V5 only)
// ---------------------------------------------------------------------------

const vocalsModelOptions = [
	{ name: 'V4.5 Plus', value: 'V4_5PLUS', description: 'Richer sound, new creation methods, max 8 minutes' },
	{ name: 'V5', value: 'V5', description: 'Superior musical expression, faster generation' },
];

// ---------------------------------------------------------------------------
// Add Vocals fields
// ---------------------------------------------------------------------------

const addVocalsPrompt: INodeProperties = {
	displayName: 'Prompt',
	name: 'prompt',
	type: 'string',
	default: '',
	description: 'Optional lyrics or vocal prompt. Leave empty to let Suno write vocals from the source audio.',
	displayOptions: {
		show: {
			resource: ['vocals'],
			operation: ['addVocals'],
		},
	},
};

const addVocalsTitle: INodeProperties = {
	displayName: 'Title',
	name: 'title',
	type: 'string',
	default: '',
	required: true,
	description: 'Title for the generated track (max 100 characters)',
	displayOptions: {
		show: {
			resource: ['vocals'],
			operation: ['addVocals'],
		},
	},
};

const addVocalsStyle: INodeProperties = {
	displayName: 'Style',
	name: 'style',
	type: 'string',
	default: '',
	required: true,
	description: 'Music style tags for the vocal generation',
	displayOptions: {
		show: {
			resource: ['vocals'],
			operation: ['addVocals'],
		},
	},
};

const addVocalsModel: INodeProperties = {
	displayName: 'Model',
	name: 'model',
	type: 'options',
	options: vocalsModelOptions,
	default: 'V4_5PLUS',
	description: 'The AI model version to use for generation',
	displayOptions: {
		show: {
			resource: ['vocals'],
			operation: ['addVocals'],
		},
	},
};

// ---------------------------------------------------------------------------
// Add Instrumental fields
// ---------------------------------------------------------------------------

const addInstrumentalTitle: INodeProperties = {
	displayName: 'Title',
	name: 'title',
	type: 'string',
	default: '',
	required: true,
	description: 'Title for the generated track (max 100 characters)',
	displayOptions: {
		show: {
			resource: ['vocals'],
			operation: ['addInstrumental'],
		},
	},
};

const addInstrumentalTags: INodeProperties = {
	displayName: 'Tags',
	name: 'tags',
	type: 'string',
	default: '',
	required: true,
	description: 'Instrumental style tags describing the desired output',
	displayOptions: {
		show: {
			resource: ['vocals'],
			operation: ['addInstrumental'],
		},
	},
};

const addInstrumentalModel: INodeProperties = {
	displayName: 'Model',
	name: 'model',
	type: 'options',
	options: vocalsModelOptions,
	default: 'V4_5PLUS',
	description: 'The AI model version to use for generation',
	displayOptions: {
		show: {
			resource: ['vocals'],
			operation: ['addInstrumental'],
		},
	},
};

// ---------------------------------------------------------------------------
// Export all fields
// ---------------------------------------------------------------------------

export const vocalsFields: INodeProperties[] = [
	// Add Vocals
	uploadUrlField(['vocals'], ['addVocals']),
	addVocalsPrompt,
	addVocalsTitle,
	addVocalsStyle,
	negativeTagsField(['vocals'], ['addVocals'], true),
	callBackUrlField(['vocals'], ['addVocals']),
	vocalGenderField(['vocals'], ['addVocals']),
	...weightFields(['vocals'], ['addVocals']),
	addVocalsModel,

	// Add Instrumental
	uploadUrlField(['vocals'], ['addInstrumental']),
	addInstrumentalTitle,
	addInstrumentalTags,
	negativeTagsField(['vocals'], ['addInstrumental'], true),
	callBackUrlField(['vocals'], ['addInstrumental']),
	vocalGenderField(['vocals'], ['addInstrumental']),
	...weightFields(['vocals'], ['addInstrumental']),
	addInstrumentalModel,
];
