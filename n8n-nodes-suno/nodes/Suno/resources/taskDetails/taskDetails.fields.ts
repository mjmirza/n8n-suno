import type { INodeProperties } from 'n8n-workflow';

import { taskIdField } from '../../utils/descriptions';

export const taskDetailsFields: INodeProperties[] = [
	taskIdField(
		['taskDetails'],
		[
			'getMusicDetails',
			'getLyricsDetails',
			'getWavDetails',
			'getVocalSeparationDetails',
			'getVideoDetails',
			'getMidiDetails',
			'getCoverDetails',
		],
		'The task ID to retrieve details for',
	),
];
