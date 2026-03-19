import type { INodeProperties } from 'n8n-workflow';

export const taskDetailsOperations: INodeProperties[] = [{
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['taskDetails'],
		},
	},
	options: [
		{
			name: 'Get Music Details',
			value: 'getMusicDetails',
			description: 'Get details of a music generation task',
			action: 'Get music details',
		},
		{
			name: 'Get Lyrics Details',
			value: 'getLyricsDetails',
			description: 'Get details of a lyrics generation task',
			action: 'Get lyrics details',
		},
		{
			name: 'Get WAV Details',
			value: 'getWavDetails',
			description: 'Get details of a WAV conversion task',
			action: 'Get WAV details',
		},
		{
			name: 'Get Vocal Separation Details',
			value: 'getVocalSeparationDetails',
			description: 'Get details of a vocal separation task',
			action: 'Get vocal separation details',
		},
		{
			name: 'Get Video Details',
			value: 'getVideoDetails',
			description: 'Get details of a video generation task',
			action: 'Get video details',
		},
		{
			name: 'Get MIDI Details',
			value: 'getMidiDetails',
			description: 'Get details of a MIDI generation task',
			action: 'Get MIDI details',
		},
		{
			name: 'Get Cover Details',
			value: 'getCoverDetails',
			description: 'Get details of a cover generation task',
			action: 'Get cover details',
		},
	],
	default: 'getMusicDetails',
}];
