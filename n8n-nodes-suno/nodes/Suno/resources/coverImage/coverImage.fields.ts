import type { INodeProperties } from 'n8n-workflow';

import {
	taskIdField,
	callBackUrlField,
} from '../../utils/descriptions';

// ---------------------------------------------------------------------------
// Export all fields
// ---------------------------------------------------------------------------

export const coverImageFields: INodeProperties[] = [
	taskIdField(['coverImage'], ['generate']),
	callBackUrlField(['coverImage'], ['generate']),
];
