import type { INodeProperties } from 'n8n-workflow';

// ---------------------------------------------------------------------------
// Content field
// ---------------------------------------------------------------------------

const styleContent: INodeProperties = {
	displayName: 'Content',
	name: 'content',
	type: 'string',
	default: '',
	required: true,
	description: 'Style description to enhance',
	displayOptions: {
		show: {
			resource: ['styleBoost'],
			operation: ['generate'],
		},
	},
};

// ---------------------------------------------------------------------------
// Export all fields
// ---------------------------------------------------------------------------

export const styleBoostFields: INodeProperties[] = [
	styleContent,
];
