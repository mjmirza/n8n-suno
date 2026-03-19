import type { INodeProperties } from 'n8n-workflow';

export const vocalSeparationOperations: INodeProperties[] = [{
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['vocalSeparation'],
		},
	},
	options: [
		{
			name: 'Generate',
			value: 'generate',
			description: 'Separate vocals and instruments into stems',
			action: 'Generate vocal separation',
		},
	],
	default: 'generate',
}];
