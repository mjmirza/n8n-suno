import type { INodeProperties } from 'n8n-workflow';

export const musicGenerationOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['musicGeneration'],
			},
		},
		options: [
			{
				name: 'Extend Music',
				value: 'extend',
				description: 'Extend an existing music track',
				action: 'Extend music',
			},
			{
				name: 'Generate Mashup',
				value: 'mashup',
				description: 'Generate a mashup from two audio tracks',
				action: 'Generate mashup',
			},
			{
				name: 'Generate Music',
				value: 'generate',
				description: 'Generate a new music track from a prompt',
				action: 'Generate music',
			},
			{
				name: 'Replace Section',
				value: 'replaceSection',
				description: 'Replace a section of an existing track',
				action: 'Replace section',
			},
			{
				name: 'Upload and Cover Audio',
				value: 'uploadCover',
				description: 'Upload audio and generate a cover version',
				action: 'Upload and cover audio',
			},
			{
				name: 'Upload and Extend Audio',
				value: 'uploadExtend',
				description: 'Upload audio and extend it with AI',
				action: 'Upload and extend audio',
			},
		],
		default: 'generate',
	},
];
