import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';

import { sunoRequest, assertSafeId } from '../../transport';
import { assertValidCallbackUrl } from '../../utils/validators';

export async function handleCoverImage(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'generate') {
		return generate.call(this, itemIndex);
	}
	throw new Error(`Unknown coverImage operation: ${operation}`);
}

// ---------------------------------------------------------------------------
// Generate cover image
// ---------------------------------------------------------------------------

async function generate(
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

	const response = await sunoRequest.call(this, 'POST', '/api/v1/suno/cover/generate', body);
	return response as IDataObject;
}
