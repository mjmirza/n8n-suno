import type { INodeProperties } from 'n8n-workflow';

import { taskIdField, audioIdField, callBackUrlField } from '../../utils/descriptions';

// ---------------------------------------------------------------------------
// Generate Lyrics fields
// ---------------------------------------------------------------------------

const generatePrompt: INodeProperties = {
	displayName: 'Prompt',
	name: 'prompt',
	type: 'string',
	default: '',
	required: true,
	description: 'Text prompt describing the lyrics to generate (max 200 characters)',
	displayOptions: {
		show: {
			resource: ['lyrics'],
			operation: ['generate'],
		},
	},
};

// ---------------------------------------------------------------------------
// Export all fields
// ---------------------------------------------------------------------------

export const lyricsFields: INodeProperties[] = [
	// Generate Lyrics
	generatePrompt,
	callBackUrlField(['lyrics'], ['generate']),

	// Get Timestamped Lyrics
	taskIdField(['lyrics'], ['getTimestamped'], 'The task ID of the generation to retrieve lyrics for'),
	audioIdField(['lyrics'], ['getTimestamped'], 'The audio ID of the track to retrieve lyrics for'),
];
