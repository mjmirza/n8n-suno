import type { INodeProperties } from 'n8n-workflow';

export const personaOperations: INodeProperties[] = [{
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['persona'],
		},
	},
	options: [
		{
			name: 'Generate Persona',
			value: 'generate',
			description: 'Create a reusable persona from a completed music generation',
			action: 'Generate persona',
		},
	],
	default: 'generate',
}];
