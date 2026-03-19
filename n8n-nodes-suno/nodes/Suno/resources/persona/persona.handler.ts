import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';

import { sunoRequest, assertSafeId, assertNonEmpty } from '../../transport';
import { assertVocalSegment } from '../../utils/validators';

export async function handlePersona(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation !== 'generate') {
		throw new Error(`Unknown persona operation: ${operation}`);
	}

	const taskId = this.getNodeParameter('taskId', itemIndex) as string;
	const audioId = this.getNodeParameter('audioId', itemIndex) as string;
	const name = this.getNodeParameter('name', itemIndex) as string;
	const description = this.getNodeParameter('description', itemIndex) as string;
	const vocalStart = this.getNodeParameter('vocalStart', itemIndex, 0) as number;
	const vocalEnd = this.getNodeParameter('vocalEnd', itemIndex, 30) as number;
	const style = this.getNodeParameter('style', itemIndex, '') as string;

	// Validate required fields
	assertSafeId(taskId, 'Task ID');
	assertSafeId(audioId, 'Audio ID');
	assertNonEmpty(name, 'Name');
	assertNonEmpty(description, 'Description');

	const body: IDataObject = {
		taskId,
		audioId,
		name: name.trim(),
		description: description.trim(),
	};

	// Validate vocal segment if provided
	if (vocalStart !== undefined && vocalEnd !== undefined) {
		assertVocalSegment(vocalStart, vocalEnd);
		body.vocalStart = vocalStart;
		body.vocalEnd = vocalEnd;
	}

	if (style) {
		body.style = style;
	}

	const response = await sunoRequest.call(this, 'POST', '/api/v1/generate/generate-persona', body);
	return response as IDataObject;
}
