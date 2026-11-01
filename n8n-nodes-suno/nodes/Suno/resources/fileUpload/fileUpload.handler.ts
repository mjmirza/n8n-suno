import type { IDataObject, IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';

import { sunoUploadRequest, assertNonEmpty, assertValidUrl } from '../../transport';
import { assertBase64Data } from '../../utils/validators';

export async function handleFileUpload(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'uploadBase64') {
		return uploadBase64.call(this, itemIndex);
	}
	if (operation === 'uploadStream') {
		return uploadStream.call(this, itemIndex);
	}
	if (operation === 'uploadUrl') {
		return uploadUrl.call(this, itemIndex);
	}
	throw new Error(`Unknown fileUpload operation: ${operation}`);
}

// ---------------------------------------------------------------------------
// Upload Base64
// ---------------------------------------------------------------------------

async function uploadBase64(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const base64Data = this.getNodeParameter('base64Data', itemIndex) as string;
	const uploadPath = this.getNodeParameter('uploadPath', itemIndex) as string;
	const fileName = this.getNodeParameter('fileName', itemIndex, '') as string;

	// Validate
	assertBase64Data(base64Data);
	assertNonEmpty(uploadPath, 'Upload Path');

	const body: IDataObject = {
		base64Data,
		uploadPath,
	};

	if (fileName) {
		body.fileName = fileName;
	}

	const response = await sunoUploadRequest.call(this, 'POST', '/api/file-base64-upload', body);
	return response as IDataObject;
}

// ---------------------------------------------------------------------------
// Upload Stream
// ---------------------------------------------------------------------------

async function uploadStream(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
	const uploadPath = this.getNodeParameter('uploadPath', itemIndex) as string;
	const fileName = this.getNodeParameter('fileName', itemIndex, '') as string;

	// Validate
	assertNonEmpty(uploadPath, 'Upload Path');

	const binaryData = this.helpers.assertBinaryData(itemIndex, binaryPropertyName);
	const dataBuffer = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);

	// A real multipart body. The file goes in a binary part named `file`, as the API expects.
	// The HTTP client sets the multipart Content-Type with its boundary.
	const formData = new FormData();
	formData.append(
		'file',
		new Blob([new Uint8Array(dataBuffer)], { type: binaryData.mimeType || 'application/octet-stream' }),
		fileName || binaryData.fileName || 'upload',
	);
	formData.append('uploadPath', uploadPath);
	if (fileName) {
		formData.append('fileName', fileName);
	}

	const response = await sunoUploadRequest.call(
		this,
		'POST',
		'/api/file-stream-upload',
		undefined,
		undefined,
		{ body: formData as unknown as IHttpRequestOptions['body'] },
	);
	return response as IDataObject;
}

// ---------------------------------------------------------------------------
// Upload URL
// ---------------------------------------------------------------------------

async function uploadUrl(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const fileUrl = this.getNodeParameter('fileUrl', itemIndex) as string;
	const uploadPath = this.getNodeParameter('uploadPath', itemIndex) as string;
	const fileName = this.getNodeParameter('fileName', itemIndex, '') as string;

	// Validate
	assertValidUrl(fileUrl, 'File URL');
	assertNonEmpty(uploadPath, 'Upload Path');

	const body: IDataObject = {
		fileUrl,
		uploadPath,
	};

	if (fileName) {
		body.fileName = fileName;
	}

	const response = await sunoUploadRequest.call(this, 'POST', '/api/file-url-upload', body);
	return response as IDataObject;
}
