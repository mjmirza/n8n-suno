import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';

import { sunoRequest, assertSafeId } from '../../transport';

const ENDPOINT_MAP: Record<string, string> = {
	getMusicDetails: '/api/v1/generate/record-info',
	getLyricsDetails: '/api/v1/lyrics/record-info',
	getWavDetails: '/api/v1/wav/record-info',
	getVocalSeparationDetails: '/api/v1/vocal-removal/record-info',
	getVideoDetails: '/api/v1/mp4/record-info',
	getMidiDetails: '/api/v1/midi/record-info',
	getCoverDetails: '/api/v1/suno/cover/record-info',
};

export async function handleTaskDetails(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const endpoint = ENDPOINT_MAP[operation];
	if (!endpoint) {
		throw new Error(`Unknown taskDetails operation: ${operation}`);
	}

	const taskId = this.getNodeParameter('taskId', itemIndex) as string;
	assertSafeId(taskId, 'Task ID');

	const response = await sunoRequest.call(this, 'GET', endpoint, undefined, { taskId });
	return response as IDataObject;
}
