import type { INodeProperties } from 'n8n-workflow';

export const creditOperations: INodeProperties[] = [{
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['credit'],
		},
	},
	options: [
		{
			name: 'Get Credits',
			value: 'get',
			description: 'Get remaining API credits',
			action: 'Get credits',
		},
	],
	default: 'get',
}];
