import type { INodeProperties } from 'n8n-workflow';

export const coverImageOperations: INodeProperties[] = [{
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['coverImage'],
		},
	},
	options: [
		{
			name: 'Generate',
			value: 'generate',
			description: 'Generate cover artwork for a track',
			action: 'Generate cover image',
		},
	],
	default: 'generate',
}];
