import type { INodeProperties } from 'n8n-workflow';
import {
	callBackUrlField,
	modelField,
	uploadUrlField,
	negativeTagsField,
	vocalGenderField,
	weightFields,
	personaFields,
	taskIdField,
	audioIdField,
} from '../../utils/descriptions';

// ============================================================================
// GENERATE fields
// ============================================================================

const generateCustomMode: INodeProperties = {
	displayName: 'Custom Mode',
	name: 'customMode',
	type: 'boolean',
	default: false,
	required: true,
	description: 'Whether to use custom mode with full control over prompt, style, and title',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['generate'],
		},
	},
};

const generateInstrumental: INodeProperties = {
	displayName: 'Instrumental',
	name: 'instrumental',
	type: 'boolean',
	default: false,
	required: true,
	description: 'Whether to generate an instrumental-only track without vocals',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['generate'],
		},
	},
};

const generatePromptCustom: INodeProperties = {
	displayName: 'Prompt',
	name: 'prompt',
	type: 'string',
	typeOptions: { rows: 4 },
	default: '',
	description:
		'Lyrics or text prompt for the music. Max 3,000 characters on V4, 5,000 on the other models.',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['generate'],
			customMode: [true],
		},
	},
};

const generatePromptNonCustom: INodeProperties = {
	displayName: 'Prompt',
	name: 'prompt',
	type: 'string',
	typeOptions: { rows: 4 },
	default: '',
	description: 'A text description of the music you want to generate. Max 3,000 characters.',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['generate'],
			customMode: [false],
		},
	},
};

const generateStyle: INodeProperties = {
	displayName: 'Style',
	name: 'style',
	type: 'string',
	default: '',
	description:
		'Music style or genre tags. In simple mode the prompt is sent as the style when this is empty. Max 200 characters on V4, 1,000 on the other models.',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['generate'],
		},
	},
};

const generateTitle: INodeProperties = {
	displayName: 'Title',
	name: 'title',
	type: 'string',
	default: '',
	description:
		'Title of the generated track. Max 80 characters.',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['generate'],
			customMode: [true],
		},
	},
};

// ============================================================================
// EXTEND fields
// ============================================================================

const extendDefaultParamFlag: INodeProperties = {
	displayName: 'Use Custom Parameters',
	name: 'defaultParamFlag',
	type: 'boolean',
	default: true,
	required: true,
	description:
		'Whether to provide custom prompt, style, title, and other parameters for the extension',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['extend'],
		},
	},
};

const extendPrompt: INodeProperties = {
	displayName: 'Prompt',
	name: 'prompt',
	type: 'string',
	typeOptions: { rows: 4 },
	default: '',
	description:
		'Lyrics or text prompt for the extension. Max 3,000 characters on V4, 5,000 on the other models.',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['extend'],
			defaultParamFlag: [true],
		},
	},
};

const extendStyle: INodeProperties = {
	displayName: 'Style',
	name: 'style',
	type: 'string',
	default: '',
	description:
		'Music style or genre tags for the extension. Max 200 characters on V4, 1,000 on the other models.',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['extend'],
			defaultParamFlag: [true],
		},
	},
};

const extendTitle: INodeProperties = {
	displayName: 'Title',
	name: 'title',
	type: 'string',
	default: '',
	description:
		'Title for the extended track. Max 100 characters.',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['extend'],
			defaultParamFlag: [true],
		},
	},
};

const extendContinueAt: INodeProperties = {
	displayName: 'Continue At (Seconds)',
	name: 'continueAt',
	type: 'number',
	typeOptions: { numberPrecision: 2 },
	default: 0,
	description: 'The timestamp in seconds from which to continue the extension',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['extend'],
			defaultParamFlag: [true],
		},
	},
};

const extendInstrumental: INodeProperties = {
	displayName: 'Instrumental',
	name: 'instrumental',
	type: 'boolean',
	default: false,
	description: 'Whether to generate an instrumental-only extension without vocals',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['extend'],
			defaultParamFlag: [true],
		},
	},
};

// ============================================================================
// UPLOAD COVER fields
// ============================================================================

const uploadCoverCustomMode: INodeProperties = {
	displayName: 'Custom Mode',
	name: 'customMode',
	type: 'boolean',
	default: false,
	required: true,
	description: 'Whether to use custom mode with full control over style and title',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['uploadCover'],
		},
	},
};

const uploadCoverInstrumental: INodeProperties = {
	displayName: 'Instrumental',
	name: 'instrumental',
	type: 'boolean',
	default: false,
	required: true,
	description: 'Whether to generate an instrumental-only cover without vocals',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['uploadCover'],
		},
	},
};

const uploadCoverPrompt: INodeProperties = {
	displayName: 'Prompt',
	name: 'prompt',
	type: 'string',
	typeOptions: { rows: 4 },
	default: '',
	description:
		'Lyrics or text prompt for the cover. Max 3,000 characters on V4, 5,000 on the other models.',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['uploadCover'],
		},
	},
};

const uploadCoverStyle: INodeProperties = {
	displayName: 'Style',
	name: 'style',
	type: 'string',
	default: '',
	description:
		'Music style or genre tags for the cover. Max 200 characters on V4, 1,000 on the other models.',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['uploadCover'],
			customMode: [true],
		},
	},
};

const uploadCoverTitle: INodeProperties = {
	displayName: 'Title',
	name: 'title',
	type: 'string',
	default: '',
	description:
		'Title for the cover track. Max 80 characters.',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['uploadCover'],
			customMode: [true],
		},
	},
};

// ============================================================================
// UPLOAD EXTEND fields
// ============================================================================

const uploadExtendDefaultParamFlag: INodeProperties = {
	displayName: 'Use Custom Parameters',
	name: 'defaultParamFlag',
	type: 'boolean',
	default: true,
	required: true,
	description:
		'Whether to provide custom prompt, style, title, and other parameters for the upload extension',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['uploadExtend'],
		},
	},
};

const uploadExtendPrompt: INodeProperties = {
	displayName: 'Prompt',
	name: 'prompt',
	type: 'string',
	typeOptions: { rows: 4 },
	default: '',
	description:
		'Lyrics or text prompt for the extension. Max 3,000 characters on V4, 5,000 on the other models.',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['uploadExtend'],
			defaultParamFlag: [true],
		},
	},
};

const uploadExtendStyle: INodeProperties = {
	displayName: 'Style',
	name: 'style',
	type: 'string',
	default: '',
	description:
		'Music style or genre tags for the extension. Max 200 characters on V4, 1,000 on the other models.',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['uploadExtend'],
			defaultParamFlag: [true],
		},
	},
};

const uploadExtendTitle: INodeProperties = {
	displayName: 'Title',
	name: 'title',
	type: 'string',
	default: '',
	description:
		'Title for the extended track. Max 100 characters.',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['uploadExtend'],
			defaultParamFlag: [true],
		},
	},
};

const uploadExtendContinueAt: INodeProperties = {
	displayName: 'Continue At (Seconds)',
	name: 'continueAt',
	type: 'number',
	typeOptions: { numberPrecision: 2 },
	default: 0,
	description: 'The timestamp in seconds from which to continue the extension',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['uploadExtend'],
			defaultParamFlag: [true],
		},
	},
};

const uploadExtendInstrumental: INodeProperties = {
	displayName: 'Instrumental',
	name: 'instrumental',
	type: 'boolean',
	default: false,
	description: 'Whether to generate an instrumental-only extension without vocals',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['uploadExtend'],
			defaultParamFlag: [true],
		},
	},
};

// ============================================================================
// MASHUP fields
// ============================================================================

const mashupUploadUrl1: INodeProperties = {
	displayName: 'Upload URL 1',
	name: 'uploadUrl1',
	type: 'string',
	default: '',
	required: true,
	description: 'HTTPS URL of the first audio file for the mashup. Private IPs are rejected.',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['mashup'],
		},
	},
};

const mashupUploadUrl2: INodeProperties = {
	displayName: 'Upload URL 2',
	name: 'uploadUrl2',
	type: 'string',
	default: '',
	required: true,
	description: 'HTTPS URL of the second audio file for the mashup. Private IPs are rejected.',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['mashup'],
		},
	},
};

const mashupCustomMode: INodeProperties = {
	displayName: 'Custom Mode',
	name: 'customMode',
	type: 'boolean',
	default: false,
	required: true,
	description: 'Whether to use custom mode with full control over prompt, style, and title',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['mashup'],
		},
	},
};

const mashupPrompt: INodeProperties = {
	displayName: 'Prompt',
	name: 'prompt',
	type: 'string',
	typeOptions: { rows: 4 },
	default: '',
	description:
		'Lyrics or text prompt for the mashup. Max 3,000 characters on V4, 5,000 on the other models.',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['mashup'],
			customMode: [true],
		},
	},
};

const mashupStyle: INodeProperties = {
	displayName: 'Style',
	name: 'style',
	type: 'string',
	default: '',
	description:
		'Music style or genre tags for the mashup. Max 200 characters on V4, 1,000 on the other models.',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['mashup'],
			customMode: [true],
		},
	},
};

const mashupTitle: INodeProperties = {
	displayName: 'Title',
	name: 'title',
	type: 'string',
	default: '',
	description:
		'Title for the mashup track. Max 80 characters.',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['mashup'],
			customMode: [true],
		},
	},
};

const mashupInstrumental: INodeProperties = {
	displayName: 'Instrumental',
	name: 'instrumental',
	type: 'boolean',
	default: false,
	description: 'Whether to generate an instrumental-only mashup without vocals',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['mashup'],
		},
	},
};

// ============================================================================
// REPLACE SECTION fields
// ============================================================================

const replaceSectionPrompt: INodeProperties = {
	displayName: 'Prompt',
	name: 'prompt',
	type: 'string',
	typeOptions: { rows: 4 },
	default: '',
	required: true,
	description: 'Lyrics or text prompt for the replacement section',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['replaceSection'],
		},
	},
};

const replaceSectionTags: INodeProperties = {
	displayName: 'Tags',
	name: 'tags',
	type: 'string',
	default: '',
	required: true,
	description: 'Music style or genre tags for the replacement section',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['replaceSection'],
		},
	},
};

const replaceSectionTitle: INodeProperties = {
	displayName: 'Title',
	name: 'title',
	type: 'string',
	default: '',
	required: true,
	description: 'Title for the track with the replaced section',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['replaceSection'],
		},
	},
};

const replaceSectionInfillStartS: INodeProperties = {
	displayName: 'Infill Start (Seconds)',
	name: 'infillStartS',
	type: 'number',
	typeOptions: { minValue: 0, numberPrecision: 2 },
	default: 0,
	required: true,
	description: 'Start time in seconds for the section to replace (2 decimal precision)',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['replaceSection'],
		},
	},
};

const replaceSectionInfillEndS: INodeProperties = {
	displayName: 'Infill End (Seconds)',
	name: 'infillEndS',
	type: 'number',
	typeOptions: { minValue: 0, numberPrecision: 2 },
	default: 0,
	required: true,
	description: 'End time in seconds for the section to replace (2 decimal precision)',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['replaceSection'],
		},
	},
};

const replaceSectionFullLyrics: INodeProperties = {
	displayName: 'Full Lyrics',
	name: 'fullLyrics',
	type: 'string',
	typeOptions: { rows: 6 },
	default: '',
	required: true,
	description: 'Complete lyrics of the whole song after the replacement, as the API requires',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['replaceSection'],
		},
	},
};

const replaceSectionNegativeTags: INodeProperties = {
	displayName: 'Negative Tags',
	name: 'negativeTags',
	type: 'string',
	default: '',
	description: 'Music styles or traits to exclude from the replacement section',
	displayOptions: {
		show: {
			resource: ['musicGeneration'],
			operation: ['replaceSection'],
		},
	},
};

// ============================================================================
// Export all fields
// ============================================================================

/** Generate accepts these only in custom mode, so they are hidden in simple mode. */
function customModeOnly(field: INodeProperties): INodeProperties {
	return { ...field, displayOptions: { ...field.displayOptions, show: { ...field.displayOptions?.show, customMode: [true] } } };
}

export const musicGenerationFields: INodeProperties[] = [
	// --- GENERATE ---
	generateCustomMode,
	generateInstrumental,
	callBackUrlField(['musicGeneration'], ['generate']),
	modelField(['musicGeneration'], ['generate']),
	generatePromptCustom,
	generatePromptNonCustom,
	generateStyle,
	generateTitle,
	customModeOnly(negativeTagsField(['musicGeneration'], ['generate'])),
	...personaFields(['musicGeneration'], ['generate']),
	...weightFields(['musicGeneration'], ['generate']).map(customModeOnly),
	customModeOnly(vocalGenderField(['musicGeneration'], ['generate'])),

	// --- EXTEND ---
	extendDefaultParamFlag,
	audioIdField(['musicGeneration'], ['extend']),
	callBackUrlField(['musicGeneration'], ['extend']),
	modelField(['musicGeneration'], ['extend']),
	extendPrompt,
	extendStyle,
	extendTitle,
	extendContinueAt,
	extendInstrumental,
	negativeTagsField(['musicGeneration'], ['extend']),
	...personaFields(['musicGeneration'], ['extend']),
	...weightFields(['musicGeneration'], ['extend']),
	vocalGenderField(['musicGeneration'], ['extend']),

	// --- UPLOAD COVER ---
	uploadUrlField(['musicGeneration'], ['uploadCover']),
	uploadCoverCustomMode,
	uploadCoverInstrumental,
	callBackUrlField(['musicGeneration'], ['uploadCover']),
	modelField(['musicGeneration'], ['uploadCover']),
	uploadCoverPrompt,
	uploadCoverStyle,
	uploadCoverTitle,
	negativeTagsField(['musicGeneration'], ['uploadCover']),
	...personaFields(['musicGeneration'], ['uploadCover']),
	...weightFields(['musicGeneration'], ['uploadCover']),
	vocalGenderField(['musicGeneration'], ['uploadCover']),

	// --- UPLOAD EXTEND ---
	uploadUrlField(['musicGeneration'], ['uploadExtend']),
	uploadExtendDefaultParamFlag,
	callBackUrlField(['musicGeneration'], ['uploadExtend']),
	modelField(['musicGeneration'], ['uploadExtend']),
	uploadExtendPrompt,
	uploadExtendStyle,
	uploadExtendTitle,
	uploadExtendContinueAt,
	uploadExtendInstrumental,
	negativeTagsField(['musicGeneration'], ['uploadExtend']),
	...personaFields(['musicGeneration'], ['uploadExtend']),
	...weightFields(['musicGeneration'], ['uploadExtend']),
	vocalGenderField(['musicGeneration'], ['uploadExtend']),

	// --- MASHUP ---
	mashupUploadUrl1,
	mashupUploadUrl2,
	mashupCustomMode,
	modelField(['musicGeneration'], ['mashup']),
	callBackUrlField(['musicGeneration'], ['mashup']),
	mashupPrompt,
	mashupStyle,
	mashupTitle,
	mashupInstrumental,
	negativeTagsField(['musicGeneration'], ['mashup']),
	...personaFields(['musicGeneration'], ['mashup']),
	...weightFields(['musicGeneration'], ['mashup']),
	vocalGenderField(['musicGeneration'], ['mashup']),

	// --- REPLACE SECTION ---
	taskIdField(['musicGeneration'], ['replaceSection'], 'The task ID of the original generation'),
	audioIdField(
		['musicGeneration'],
		['replaceSection'],
		'The audio ID of the track to modify',
	),
	replaceSectionPrompt,
	replaceSectionTags,
	replaceSectionTitle,
	replaceSectionInfillStartS,
	replaceSectionInfillEndS,
	replaceSectionFullLyrics,
	replaceSectionNegativeTags,
	callBackUrlField(['musicGeneration'], ['replaceSection'], false),
];
