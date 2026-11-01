import type { INodeProperties } from 'n8n-workflow';

// ---------------------------------------------------------------------------
// Category & resource definitions
// ---------------------------------------------------------------------------

export const CATEGORIES: INodeProperties = {
	displayName: 'Category',
	name: 'category',
	type: 'options',
	noDataExpression: true,
	options: [
		{ name: 'Account', value: 'account', description: 'Check remaining credits' },
		{ name: 'Audio Processing', value: 'audioProcessing', description: 'Separate vocals, convert formats, boost style, generate covers' },
		{ name: 'File Upload', value: 'fileUpload', description: 'Upload files via base64, stream, or URL' },
		{ name: 'Lyrics', value: 'lyrics', description: 'Generate lyrics and retrieve timestamped lyrics' },
		{ name: 'Music Generation', value: 'musicGeneration', description: 'Generate, extend, mashup, and manipulate music' },
		{ name: 'Status & Details', value: 'statusDetails', description: 'Query task status and generation details' },
	],
	default: 'musicGeneration',
};

export const CATEGORY_RESOURCE_MAP: Record<string, Array<{ name: string; value: string; description: string }>> = {
	musicGeneration: [
		{ name: 'Music Generation', value: 'musicGeneration', description: 'Generate, extend, cover, mashup, and replace music' },
		{ name: 'Vocals', value: 'vocals', description: 'Add vocals or instrumental to uploaded audio' },
		{ name: 'Persona', value: 'persona', description: 'Create reusable music personas from tracks' },
	],
	lyrics: [
		{ name: 'Lyrics', value: 'lyrics', description: 'Generate lyrics and retrieve timestamped lyrics' },
	],
	audioProcessing: [
		{ name: 'Vocal Separation', value: 'vocalSeparation', description: 'Separate vocals and instruments into stems' },
		{ name: 'Audio Conversion', value: 'audioConversion', description: 'Convert to WAV, generate MIDI, create music video' },
		{ name: 'Style Boost', value: 'styleBoost', description: 'Enhance music style descriptions' },
		{ name: 'Cover Image', value: 'coverImage', description: 'Generate cover artwork for tracks' },
	],
	statusDetails: [
		{ name: 'Task Details', value: 'taskDetails', description: 'Query status and results of any generation task' },
	],
	account: [
		{ name: 'Credit', value: 'credit', description: 'Check remaining API credits' },
	],
	fileUpload: [
		{ name: 'File Upload', value: 'fileUpload', description: 'Upload audio files for processing' },
	],
};

export function buildResourceProperty(): INodeProperties {
	const allResources: Array<{ name: string; value: string; description: string }> = [];
	const seen = new Set<string>();
	for (const resources of Object.values(CATEGORY_RESOURCE_MAP)) {
		for (const r of resources) {
			if (!seen.has(r.value)) {
				allResources.push(r);
				seen.add(r.value);
			}
		}
	}
	return {
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		noDataExpression: true,
		options: allResources,
		default: 'musicGeneration',
	};
}

// ---------------------------------------------------------------------------
// Shared field builders
// ---------------------------------------------------------------------------

export function taskIdField(
	resources: string[],
	operations?: string[],
	description?: string,
): INodeProperties {
	const field: INodeProperties = {
		displayName: 'Task ID',
		name: 'taskId',
		type: 'string',
		default: '',
		required: true,
		description: description ?? 'The task ID returned from a previous generation request',
		displayOptions: {
			show: {
				resource: resources,
			},
		},
	};
	if (operations) {
		field.displayOptions!.show!.operation = operations;
	}
	return field;
}

export function audioIdField(
	resources: string[],
	operations?: string[],
	description?: string,
): INodeProperties {
	const field: INodeProperties = {
		displayName: 'Audio ID',
		name: 'audioId',
		type: 'string',
		default: '',
		required: true,
		description: description ?? 'The audio ID of the specific track',
		displayOptions: {
			show: {
				resource: resources,
			},
		},
	};
	if (operations) {
		field.displayOptions!.show!.operation = operations;
	}
	return field;
}

export function callBackUrlField(
	resources: string[],
	operations?: string[],
	required = true,
): INodeProperties {
	const field: INodeProperties = {
		displayName: 'Callback URL',
		name: 'callBackUrl',
		type: 'string',
		default: '',
		required,
		description: 'HTTPS URL to receive task completion notifications. Must be publicly accessible. Private IPs are rejected.',
		displayOptions: {
			show: {
				resource: resources,
			},
		},
	};
	if (operations) {
		field.displayOptions!.show!.operation = operations;
	}
	return field;
}

export function modelField(
	resources: string[],
	operations?: string[],
	modelOptions?: Array<{ name: string; value: string; description: string }>,
): INodeProperties {
	const defaultModels = [
		{ name: 'V5', value: 'V5', description: 'Superior musical expression, faster generation' },
		{ name: 'V4.5 Plus', value: 'V4_5PLUS', description: 'Richer sound, new creation methods, max 8 minutes' },
		{ name: 'V4.5 All', value: 'V4_5ALL', description: 'Better song structure, max 8 minutes' },
		{ name: 'V4.5', value: 'V4_5', description: 'Superior genre blending, faster output, max 8 minutes' },
		{ name: 'V4', value: 'V4', description: 'Best audio quality, refined structure, max 4 minutes' },
	];
	const field: INodeProperties = {
		displayName: 'Model',
		name: 'model',
		type: 'options',
		options: modelOptions ?? defaultModels,
		default: 'V5',
		required: true,
		description: 'The AI model version to use for generation',
		displayOptions: {
			show: {
				resource: resources,
			},
		},
	};
	if (operations) {
		field.displayOptions!.show!.operation = operations;
	}
	return field;
}

export function uploadUrlField(
	resources: string[],
	operations?: string[],
): INodeProperties {
	const field: INodeProperties = {
		displayName: 'Upload URL',
		name: 'uploadUrl',
		type: 'string',
		default: '',
		required: true,
		description: 'HTTPS URL of the uploaded audio file. Max 8 minutes (1 minute for V4_5ALL). Private IPs are rejected.',
		displayOptions: {
			show: {
				resource: resources,
			},
		},
	};
	if (operations) {
		field.displayOptions!.show!.operation = operations;
	}
	return field;
}

export function negativeTagsField(
	resources: string[],
	operations?: string[],
	required = false,
): INodeProperties {
	const field: INodeProperties = {
		displayName: 'Negative Tags',
		name: 'negativeTags',
		type: 'string',
		default: '',
		required,
		description: 'Music styles or traits to exclude from the generated track',
		displayOptions: {
			show: {
				resource: resources,
			},
		},
	};
	if (operations) {
		field.displayOptions!.show!.operation = operations;
	}
	return field;
}

export function vocalGenderField(
	resources: string[],
	operations?: string[],
): INodeProperties {
	const field: INodeProperties = {
		displayName: 'Vocal Gender',
		name: 'vocalGender',
		type: 'options',
		options: [
			{ name: 'No Preference', value: '' },
			{ name: 'Male', value: 'm' },
			{ name: 'Female', value: 'f' },
		],
		default: '',
		description: 'Preferred vocal gender for the generated track',
		displayOptions: {
			show: {
				resource: resources,
			},
		},
	};
	if (operations) {
		field.displayOptions!.show!.operation = operations;
	}
	return field;
}

export function weightFields(
	resources: string[],
	operations?: string[],
): INodeProperties[] {
	const base: Partial<INodeProperties> = {
		type: 'number' as const,
		default: undefined,
		typeOptions: { minValue: 0, maxValue: 1, numberPrecision: 2 },
		displayOptions: {
			show: {
				resource: resources,
			},
		},
	};
	if (operations) {
		base.displayOptions!.show!.operation = operations;
	}
	return [
		{
			...base,
			displayName: 'Style Weight',
			name: 'styleWeight',
			description: 'Style influence strength (0.00-1.00)',
		} as INodeProperties,
		{
			...base,
			displayName: 'Weirdness Constraint',
			name: 'weirdnessConstraint',
			description: 'Creative deviation limit (0.00-1.00)',
		} as INodeProperties,
		{
			...base,
			displayName: 'Audio Weight',
			name: 'audioWeight',
			description: 'Input audio influence (0.00-1.00)',
		} as INodeProperties,
	];
}

export function personaFields(
	resources: string[],
	operations?: string[],
): INodeProperties[] {
	const showOpts: INodeProperties['displayOptions'] = {
		show: { resource: resources },
	};
	if (operations) {
		showOpts.show!.operation = operations;
	}
	return [
		{
			displayName: 'Persona ID',
			name: 'personaId',
			type: 'string',
			default: '',
			description: 'Persona ID for custom style. Obtain from the Generate Persona operation.',
			displayOptions: showOpts,
		},
		{
			displayName: 'Persona Model',
			name: 'personaModel',
			type: 'options',
			options: [
				{ name: 'Style Persona', value: 'style_persona' },
				{ name: 'Voice Persona', value: 'voice_persona' },
			],
			default: 'style_persona',
			description: 'Type of persona to apply. Voice persona is only available with V5.',
			displayOptions: showOpts,
		},
	];
}
