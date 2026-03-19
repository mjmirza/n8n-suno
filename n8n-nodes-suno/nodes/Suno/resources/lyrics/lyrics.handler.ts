import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';

import { sunoRequest, assertNonEmpty, assertSafeId } from '../../transport';
import { assertValidCallbackUrl } from '../../utils/validators';

export async function handleLyrics(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'generate') {
		return generate.call(this, itemIndex);
	}
	if (operation === 'getTimestamped') {
		return getTimestamped.call(this, itemIndex);
	}
	throw new Error(`Unknown lyrics operation: ${operation}`);
}

// ---------------------------------------------------------------------------
// Generate Lyrics
// ---------------------------------------------------------------------------

async function generate(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const prompt = this.getNodeParameter('prompt', itemIndex) as string;
	const callBackUrl = this.getNodeParameter('callBackUrl', itemIndex) as string;

	// Validate
	assertNonEmpty(prompt, 'Prompt', 200);
	assertValidCallbackUrl(callBackUrl);

	const body: IDataObject = {
		prompt: prompt.trim(),
		callBackUrl,
	};

	const response = await sunoRequest.call(this, 'POST', '/api/v1/lyrics', body);
	return response as IDataObject;
}

// ---------------------------------------------------------------------------
// Get Timestamped Lyrics
// ---------------------------------------------------------------------------

async function getTimestamped(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const taskId = this.getNodeParameter('taskId', itemIndex) as string;
	const audioId = this.getNodeParameter('audioId', itemIndex) as string;

	// Validate
	assertSafeId(taskId, 'Task ID');
	assertSafeId(audioId, 'Audio ID');

	const body: IDataObject = {
		taskId,
		audioId,
	};

	const response = await sunoRequest.call(this, 'POST', '/api/v1/generate/get-timestamped-lyrics', body);
	return response as IDataObject;
}
