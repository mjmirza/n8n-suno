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
		// Suno answers HTTP 200 with an error code in the body, so check the body too.
		rules: [
			{
				type: 'responseSuccessBody',
				properties: { key: 'code', value: 401, message: 'Invalid API key' },
			},
		],
	};
}
