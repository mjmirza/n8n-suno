import type { INodeProperties } from 'n8n-workflow';

// ---------------------------------------------------------------------------
// Upload Base64 fields
// ---------------------------------------------------------------------------

const base64Data: INodeProperties = {
	displayName: 'Base64 Data',
	name: 'base64Data',
	type: 'string',
	default: '',
	required: true,
	description: 'Base64 encoded file data or data URL format',
	typeOptions: {
		rows: 4,
	},
	displayOptions: {
		show: {
			resource: ['fileUpload'],
			operation: ['uploadBase64'],
		},
	},
};

const base64UploadPath: INodeProperties = {
	displayName: 'Upload Path',
	name: 'uploadPath',
	type: 'string',
	default: '',
	required: true,
	description: 'File upload path without leading/trailing slashes',
	displayOptions: {
		show: {
			resource: ['fileUpload'],
			operation: ['uploadBase64'],
		},
	},
};

const base64FileName: INodeProperties = {
	displayName: 'File Name',
	name: 'fileName',
	type: 'string',
	default: '',
	description: 'File name with extension. Random name if omitted.',
	displayOptions: {
		show: {
			resource: ['fileUpload'],
			operation: ['uploadBase64'],
		},
	},
};

// ---------------------------------------------------------------------------
// Upload Stream fields
// ---------------------------------------------------------------------------

const binaryPropertyName: INodeProperties = {
	displayName: 'Binary Property',
	name: 'binaryPropertyName',
	type: 'string',
	default: 'data',
	required: true,
	description: 'Name of the binary property containing the file',
	displayOptions: {
		show: {
			resource: ['fileUpload'],
			operation: ['uploadStream'],
		},
	},
};

const streamUploadPath: INodeProperties = {
	displayName: 'Upload Path',
	name: 'uploadPath',
	type: 'string',
	default: '',
	required: true,
	description: 'File upload path without leading/trailing slashes',
	displayOptions: {
		show: {
			resource: ['fileUpload'],
			operation: ['uploadStream'],
		},
	},
};

const streamFileName: INodeProperties = {
	displayName: 'File Name',
	name: 'fileName',
	type: 'string',
	default: '',
	description: 'File name with extension. Random name if omitted.',
	displayOptions: {
		show: {
			resource: ['fileUpload'],
			operation: ['uploadStream'],
		},
	},
};

// ---------------------------------------------------------------------------
// Upload URL fields
// ---------------------------------------------------------------------------

const fileUrl: INodeProperties = {
	displayName: 'File URL',
	name: 'fileUrl',
	type: 'string',
	default: '',
	required: true,
	description: 'HTTPS URL to download the file from. Max 100MB, 30s timeout.',
	displayOptions: {
		show: {
			resource: ['fileUpload'],
			operation: ['uploadUrl'],
		},
	},
};

const urlUploadPath: INodeProperties = {
	displayName: 'Upload Path',
	name: 'uploadPath',
	type: 'string',
	default: '',
	required: true,
	description: 'File upload path without leading/trailing slashes',
	displayOptions: {
		show: {
			resource: ['fileUpload'],
			operation: ['uploadUrl'],
		},
	},
};

const urlFileName: INodeProperties = {
	displayName: 'File Name',
	name: 'fileName',
	type: 'string',
	default: '',
	description: 'File name with extension. Random name if omitted.',
	displayOptions: {
		show: {
			resource: ['fileUpload'],
			operation: ['uploadUrl'],
		},
	},
};

// ---------------------------------------------------------------------------
// Export all fields
// ---------------------------------------------------------------------------

export const fileUploadFields: INodeProperties[] = [
	// Upload Base64
	base64Data,
	base64UploadPath,
	base64FileName,

	// Upload Stream
	binaryPropertyName,
	streamUploadPath,
	streamFileName,

	// Upload URL
	fileUrl,
	urlUploadPath,
	urlFileName,
];
