import type { INodeProperties } from 'n8n-workflow';

import {
	taskIdField,
	audioIdField,
	callBackUrlField,
} from '../../utils/descriptions';

// ---------------------------------------------------------------------------
// Generate MIDI — optional audioId
// ---------------------------------------------------------------------------

const midiAudioId: INodeProperties = {
	displayName: 'Audio ID',
	name: 'audioId',
	type: 'string',
	default: '',
	description: 'Audio ID from originData in vocal separation result. Optional.',
	displayOptions: {
		show: {
			resource: ['audioConversion'],
			operation: ['generateMidi'],
		},
	},
};

// ---------------------------------------------------------------------------
// Generate Video — optional fields
// ---------------------------------------------------------------------------

const videoAuthor: INodeProperties = {
	displayName: 'Author',
	name: 'author',
	type: 'string',
	default: '',
	description: 'Author name to embed in the video (max 50 characters)',
	displayOptions: {
		show: {
			resource: ['audioConversion'],
			operation: ['generateVideo'],
		},
	},
};

const videoDomainName: INodeProperties = {
	displayName: 'Domain Name',
	name: 'domainName',
	type: 'string',
	default: '',
	description: 'Domain name to embed in the video (max 50 characters)',
	displayOptions: {
		show: {
			resource: ['audioConversion'],
			operation: ['generateVideo'],
		},
	},
};

// ---------------------------------------------------------------------------
// Export all fields
// ---------------------------------------------------------------------------

export const audioConversionFields: INodeProperties[] = [
	// Convert WAV
	taskIdField(['audioConversion'], ['convertWav']),
	audioIdField(['audioConversion'], ['convertWav']),
	callBackUrlField(['audioConversion'], ['convertWav']),

	// Generate MIDI
	taskIdField(['audioConversion'], ['generateMidi'], 'The task ID from a vocal separation request'),
	callBackUrlField(['audioConversion'], ['generateMidi']),
	midiAudioId,

	// Generate Video
	taskIdField(['audioConversion'], ['generateVideo']),
	audioIdField(['audioConversion'], ['generateVideo']),
	callBackUrlField(['audioConversion'], ['generateVideo']),
	videoAuthor,
	videoDomainName,
];
