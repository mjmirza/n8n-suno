import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';

import { sunoRequest, assertNonEmpty } from '../../transport';

export async function handleStyleBoost(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'generate') {
		return generate.call(this, itemIndex);
	}
	throw new Error(`Unknown styleBoost operation: ${operation}`);
}

// ---------------------------------------------------------------------------
// Generate style boost
// ---------------------------------------------------------------------------

async function generate(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const content = this.getNodeParameter('content', itemIndex) as string;

	// Validate required fields
	assertNonEmpty(content, 'Content');

	const body: IDataObject = {
		content,
	};

	const response = await sunoRequest.call(this, 'POST', '/api/v1/style/generate', body);
	return response as IDataObject;
}
