import type { INodeProperties } from 'n8n-workflow';

export const audioConversionOperations: INodeProperties[] = [{
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['audioConversion'],
		},
	},
	options: [
		{
			name: 'Convert WAV',
			value: 'convertWav',
			description: 'Convert audio to WAV format',
			action: 'Convert to WAV',
		},
		{
			name: 'Generate MIDI',
			value: 'generateMidi',
			description: 'Start a MIDI transcription, returned as JSON note data per instrument',
			action: 'Generate MIDI',
		},
		{
			name: 'Generate Video',
			value: 'generateVideo',
			description: 'Generate a music video (MP4) from audio',
			action: 'Generate video',
		},
	],
	default: 'convertWav',
}];
