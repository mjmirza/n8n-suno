import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';

import { sunoRequest, assertSafeId, assertNonEmpty } from '../../transport';
import { assertValidCallbackUrl } from '../../utils/validators';

export async function handleAudioConversion(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'convertWav') {
		return convertWav.call(this, itemIndex);
	}
	if (operation === 'generateMidi') {
		return generateMidi.call(this, itemIndex);
	}
	if (operation === 'generateVideo') {
		return generateVideo.call(this, itemIndex);
	}
	throw new Error(`Unknown audioConversion operation: ${operation}`);
}

// ---------------------------------------------------------------------------
// Convert WAV
// ---------------------------------------------------------------------------

async function convertWav(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const taskId = this.getNodeParameter('taskId', itemIndex) as string;
	const audioId = this.getNodeParameter('audioId', itemIndex) as string;
	const callBackUrl = this.getNodeParameter('callBackUrl', itemIndex) as string;

	// Validate required fields
	assertSafeId(taskId, 'Task ID');
	assertSafeId(audioId, 'Audio ID');
	assertValidCallbackUrl(callBackUrl);

	const body: IDataObject = {
		taskId,
		audioId,
		callBackUrl,
	};

	const response = await sunoRequest.call(this, 'POST', '/api/v1/wav/generate', body);
	return response as IDataObject;
}

// ---------------------------------------------------------------------------
// Generate MIDI
// ---------------------------------------------------------------------------

async function generateMidi(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const taskId = this.getNodeParameter('taskId', itemIndex) as string;
	const callBackUrl = this.getNodeParameter('callBackUrl', itemIndex) as string;

	// Validate required fields
	assertSafeId(taskId, 'Task ID');
	assertValidCallbackUrl(callBackUrl);

	const body: IDataObject = {
		taskId,
		callBackUrl,
	};

	// Optional audioId
	const audioId = this.getNodeParameter('audioId', itemIndex, '') as string;
	if (audioId) {
		assertSafeId(audioId, 'Audio ID');
		body.audioId = audioId;
	}

	const response = await sunoRequest.call(this, 'POST', '/api/v1/midi/generate', body);
	return response as IDataObject;
}

// ---------------------------------------------------------------------------
// Generate Video
// ---------------------------------------------------------------------------

async function generateVideo(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const taskId = this.getNodeParameter('taskId', itemIndex) as string;
	const audioId = this.getNodeParameter('audioId', itemIndex) as string;
	const callBackUrl = this.getNodeParameter('callBackUrl', itemIndex) as string;

	// Validate required fields
	assertSafeId(taskId, 'Task ID');
	assertSafeId(audioId, 'Audio ID');
	assertValidCallbackUrl(callBackUrl);

	const body: IDataObject = {
		taskId,
		audioId,
		callBackUrl,
	};

	// Optional fields
	const author = this.getNodeParameter('author', itemIndex, '') as string;
	if (author) {
		assertNonEmpty(author, 'Author', 50);
		body.author = author.trim();
	}

	const domainName = this.getNodeParameter('domainName', itemIndex, '') as string;
	if (domainName) {
		assertNonEmpty(domainName, 'Domain Name', 50);
		body.domainName = domainName.trim();
	}

	const response = await sunoRequest.call(this, 'POST', '/api/v1/mp4/generate', body);
	return response as IDataObject;
}
