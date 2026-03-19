import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';

import { sunoRequest } from '../../transport';

export async function handleCredit(
	this: IExecuteFunctions,
	operation: string,
	_itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation !== 'get') {
		throw new Error(`Unknown credit operation: ${operation}`);
	}

	const response = await sunoRequest.call(this, 'GET', '/api/v1/generate/credit');
	return response as IDataObject;
}
