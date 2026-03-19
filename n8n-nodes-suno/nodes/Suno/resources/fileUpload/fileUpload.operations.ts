import type { INodeProperties } from 'n8n-workflow';

export const fileUploadOperations: INodeProperties[] = [{
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['fileUpload'],
		},
	},
	options: [
		{
			name: 'Upload Base64',
			value: 'uploadBase64',
			description: 'Upload a file using base64-encoded data',
			action: 'Upload base64',
		},
		{
			name: 'Upload Stream',
			value: 'uploadStream',
			description: 'Upload a file from a binary property (multipart/form-data)',
			action: 'Upload stream',
		},
		{
			name: 'Upload URL',
			value: 'uploadUrl',
			description: 'Upload a file from an HTTPS URL',
			action: 'Upload URL',
		},
	],
	default: 'uploadBase64',
}];
