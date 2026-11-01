import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

// Descriptions
import { buildResourceProperty } from './utils/descriptions';

// Operations
import { musicGenerationOperations } from './resources/musicGeneration/musicGeneration.operations';
import { vocalsOperations } from './resources/vocals/vocals.operations';
import { lyricsOperations } from './resources/lyrics/lyrics.operations';
import { vocalSeparationOperations } from './resources/vocalSeparation/vocalSeparation.operations';
import { audioConversionOperations } from './resources/audioConversion/audioConversion.operations';
import { styleBoostOperations } from './resources/styleBoost/styleBoost.operations';
import { coverImageOperations } from './resources/coverImage/coverImage.operations';
import { taskDetailsOperations } from './resources/taskDetails/taskDetails.operations';
import { creditOperations } from './resources/credit/credit.operations';
import { fileUploadOperations } from './resources/fileUpload/fileUpload.operations';
import { personaOperations } from './resources/persona/persona.operations';

// Fields
import { musicGenerationFields } from './resources/musicGeneration/musicGeneration.fields';
import { vocalsFields } from './resources/vocals/vocals.fields';
import { lyricsFields } from './resources/lyrics/lyrics.fields';
import { vocalSeparationFields } from './resources/vocalSeparation/vocalSeparation.fields';
import { audioConversionFields } from './resources/audioConversion/audioConversion.fields';
import { styleBoostFields } from './resources/styleBoost/styleBoost.fields';
import { coverImageFields } from './resources/coverImage/coverImage.fields';
import { taskDetailsFields } from './resources/taskDetails/taskDetails.fields';
import { creditFields } from './resources/credit/credit.fields';
import { fileUploadFields } from './resources/fileUpload/fileUpload.fields';
import { personaFields } from './resources/persona/persona.fields';

// Handlers
import { handleMusicGeneration } from './resources/musicGeneration/musicGeneration.handler';
import { handleVocals } from './resources/vocals/vocals.handler';
import { handleLyrics } from './resources/lyrics/lyrics.handler';
import { handleVocalSeparation } from './resources/vocalSeparation/vocalSeparation.handler';
import { handleAudioConversion } from './resources/audioConversion/audioConversion.handler';
import { handleStyleBoost } from './resources/styleBoost/styleBoost.handler';
import { handleCoverImage } from './resources/coverImage/coverImage.handler';
import { handleTaskDetails } from './resources/taskDetails/taskDetails.handler';
import { handleCredit } from './resources/credit/credit.handler';
import { handleFileUpload } from './resources/fileUpload/fileUpload.handler';
import { handlePersona } from './resources/persona/persona.handler';

// ---------------------------------------------------------------------------
// Handler routing map
// ---------------------------------------------------------------------------

type ResourceHandler = (
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
) => Promise<IDataObject | IDataObject[]>;

const resourceHandlers: Record<string, ResourceHandler> = {
	musicGeneration: handleMusicGeneration,
	vocals: handleVocals,
	lyrics: handleLyrics,
	vocalSeparation: handleVocalSeparation,
	audioConversion: handleAudioConversion,
	styleBoost: handleStyleBoost,
	coverImage: handleCoverImage,
	taskDetails: handleTaskDetails,
	credit: handleCredit,
	fileUpload: handleFileUpload,
	persona: handlePersona,
};

// ---------------------------------------------------------------------------
// Node definition
// ---------------------------------------------------------------------------

export class Suno implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Suno',
		name: 'suno',
		icon: { light: 'file:suno.svg', dark: 'file:suno.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Generate AI music, lyrics, and audio with the Suno API',
		defaults: { name: 'Suno' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'sunoApi',
				required: true,
			},
		],
		properties: [
			// Resource selector
			buildResourceProperty(),

			// --- All operations ---
			...musicGenerationOperations,
			...vocalsOperations,
			...lyricsOperations,
			...vocalSeparationOperations,
			...audioConversionOperations,
			...styleBoostOperations,
			...coverImageOperations,
			...taskDetailsOperations,
			...creditOperations,
			...fileUploadOperations,
			...personaOperations,

			// --- All fields ---
			...musicGenerationFields,
			...vocalsFields,
			...lyricsFields,
			...vocalSeparationFields,
			...audioConversionFields,
			...styleBoostFields,
			...coverImageFields,
			...taskDetailsFields,
			...creditFields,
			...fileUploadFields,
			...personaFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;

		const handler = resourceHandlers[resource];
		if (!handler) {
			throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`);
		}

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const result = await handler.call(this, operation, i);

				const pairedItem = { item: i };
				// A run that produced no API result is a failure, never a silent success.
				if (result == null || typeof result !== 'object') {
					throw new NodeOperationError(this.getNode(), 'Suno returned no result for this item', { itemIndex: i });
				} else if (Array.isArray(result)) {
					returnData.push(...result.map((item) => ({ json: item, pairedItem })));
				} else {
					const data = (result as IDataObject).data !== undefined
						? (result as IDataObject).data
						: result;
					const asJson = (value: unknown): IDataObject =>
						value !== null && typeof value === 'object' && !Array.isArray(value)
							? (value as IDataObject)
							: { data: value as IDataObject[keyof IDataObject] };
					if (Array.isArray(data)) {
						returnData.push(...data.map((item) => ({ json: asJson(item), pairedItem })));
					} else {
						returnData.push({ json: asJson(data), pairedItem });
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
				} else if (error instanceof NodeApiError) {
					// The NodeApiError constructor ignores options for an existing instance, so set the index directly.
					error.context = { ...error.context, itemIndex: i };
					throw new NodeApiError(this.getNode(), error as unknown as JsonObject);
				} else {
					throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
				}
			}
		}

		return [returnData];
	}
}
