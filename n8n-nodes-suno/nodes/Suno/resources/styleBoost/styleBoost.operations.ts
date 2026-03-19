import type { INodeProperties } from 'n8n-workflow';

export const styleBoostOperations: INodeProperties[] = [{
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['styleBoost'],
		},
	},
	options: [
		{
			name: 'Generate',
			value: 'generate',
			description: 'Enhance a music style description',
			action: 'Generate style boost',
		},
	],
	default: 'generate',
}];
