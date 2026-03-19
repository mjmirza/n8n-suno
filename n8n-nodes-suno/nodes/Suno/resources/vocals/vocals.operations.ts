import type { INodeProperties } from 'n8n-workflow';

export const vocalsOperations: INodeProperties[] = [{
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['vocals'],
		},
	},
	options: [
		{
			name: 'Add Vocals',
			value: 'addVocals',
			description: 'Add vocals to an uploaded audio file',
			action: 'Add vocals',
		},
		{
			name: 'Add Instrumental',
			value: 'addInstrumental',
			description: 'Add instrumental to an uploaded audio file',
			action: 'Add instrumental',
		},
	],
	default: 'addVocals',
}];
