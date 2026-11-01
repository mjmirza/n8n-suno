import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class SunoApi implements ICredentialType {
	name = 'sunoApi';

	displayName = 'Suno API';

	documentationUrl = 'https://docs.sunoapi.org';

	icon: Icon = { light: 'file:../nodes/Suno/suno.svg', dark: 'file:../nodes/Suno/suno.dark.svg' };

	properties: INodeProperties[] = [
		{
			displayName:
				'Get your API key from the <a href="https://sunoapi.org/api-key" target="_blank">Suno API Key Management Page</a>',
			name: 'setupNotice',
			type: 'notice',
			default: '',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Your Suno API key. Keep this secret — reset immediately if compromised.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.sunoapi.org',
			url: '/api/v1/generate/credit',
			method: 'GET',
		},
		// Suno answers HTTP 200 with an error code in the body, so every documented error code fails the test.
		rules: [
			{ type: 'responseSuccessBody', properties: { key: 'code', value: 400, message: 'Suno rejected the request' } },
			{ type: 'responseSuccessBody', properties: { key: 'code', value: 401, message: 'Invalid API key' } },
			{ type: 'responseSuccessBody', properties: { key: 'code', value: 402, message: 'Insufficient credits' } },
			{ type: 'responseSuccessBody', properties: { key: 'code', value: 404, message: 'Credit endpoint not found' } },
			{ type: 'responseSuccessBody', properties: { key: 'code', value: 405, message: 'Rate limit exceeded, try again shortly' } },
			{ type: 'responseSuccessBody', properties: { key: 'code', value: 409, message: 'Conflict' } },
			{ type: 'responseSuccessBody', properties: { key: 'code', value: 413, message: 'Content too long' } },
			{ type: 'responseSuccessBody', properties: { key: 'code', value: 422, message: 'Validation failed' } },
			{ type: 'responseSuccessBody', properties: { key: 'code', value: 429, message: 'Insufficient credits' } },
			{ type: 'responseSuccessBody', properties: { key: 'code', value: 430, message: 'Request frequency too high, try again shortly' } },
			{ type: 'responseSuccessBody', properties: { key: 'code', value: 451, message: 'Access restricted' } },
			{ type: 'responseSuccessBody', properties: { key: 'code', value: 455, message: 'Suno API is under maintenance, try again later' } },
			{ type: 'responseSuccessBody', properties: { key: 'code', value: 500, message: 'Suno server error, try again later' } },
			{ type: 'responseSuccessBody', properties: { key: 'code', value: 501, message: 'Suno server error, try again later' } },
		],
	};
}
