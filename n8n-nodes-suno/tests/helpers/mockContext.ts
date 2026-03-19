import type {
	ICredentialDataDecryptedObject,
	IDataObject,
	IExecuteFunctions,
	INode,
	INodeExecutionData,
} from 'n8n-workflow';

export interface MockContext {
	getCredentials: jest.Mock;
	getNodeParameter: jest.Mock;
	getNode: jest.Mock;
	getInputData: jest.Mock;
	continueOnFail: jest.Mock;
	helpers: {
		httpRequestWithAuthentication: jest.Mock;
	};
}

const DEFAULT_CREDENTIALS: ICredentialDataDecryptedObject = {
	apiKey: 'test-api-key-12345',
};

const DEFAULT_NODE: Partial<INode> = {
	id: 'test-node-id',
	name: 'Suno',
	type: 'n8n-nodes-suno.suno',
	typeVersion: 1,
	position: [0, 0],
	parameters: {},
};

const DEFAULT_INPUT_DATA: INodeExecutionData[] = [
	{ json: { key: 'value' } as IDataObject },
];

/**
 * Creates a mock IExecuteFunctions-like context for unit tests.
 *
 * @param params - Optional map of node parameter names to values.
 *                 `getNodeParameter(name)` will look up values here.
 * @param response - Optional response that `httpRequestWithAuthentication` resolves to.
 */
export function createMockContext(
	params?: Record<string, unknown>,
	response?: unknown,
): MockContext {
	const paramMap = params ?? {};

	const mock: MockContext = {
		getCredentials: jest.fn().mockResolvedValue(DEFAULT_CREDENTIALS),

		getNodeParameter: jest.fn().mockImplementation(
			(name: string, _index: number, fallback?: unknown) => {
				if (name in paramMap) {
					return paramMap[name];
				}
				return fallback;
			},
		),

		getNode: jest.fn().mockReturnValue(DEFAULT_NODE),

		getInputData: jest.fn().mockReturnValue(DEFAULT_INPUT_DATA),

		continueOnFail: jest.fn().mockReturnValue(false),

		helpers: {
			httpRequestWithAuthentication: jest.fn().mockResolvedValue(
				response ?? { code: 200, data: {} },
			),
		},
	};

	return mock;
}
