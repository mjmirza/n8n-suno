import type { INodeProperties } from 'n8n-workflow';

export const lyricsOperations: INodeProperties[] = [{
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['lyrics'],
		},
	},
	options: [
		{
			name: 'Generate Lyrics',
			value: 'generate',
			description: 'Generate lyrics from a text prompt',
			action: 'Generate lyrics',
		},
		{
			name: 'Get Timestamped Lyrics',
			value: 'getTimestamped',
			description: 'Retrieve timestamped lyrics for an existing track',
			action: 'Get timestamped lyrics',
		},
	],
	default: 'generate',
}];
