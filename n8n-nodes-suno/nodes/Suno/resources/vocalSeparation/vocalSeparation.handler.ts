import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';

import { sunoRequest, assertSafeId } from '../../transport';
import { assertValidCallbackUrl } from '../../utils/validators';

export async function handleVocalSeparation(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'generate') {
		return generate.call(this, itemIndex);
	}
	throw new Error(`Unknown vocalSeparation operation: ${operation}`);
}

// ---------------------------------------------------------------------------
// Generate vocal separation
// ---------------------------------------------------------------------------

async function generate(
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
	const type = this.getNodeParameter('type', itemIndex, 'separate_vocal') as string;
	if (type) {
		body.type = type;
	}

	const response = await sunoRequest.call(this, 'POST', '/api/v1/vocal-removal/generate', body);
	return response as IDataObject;
}
