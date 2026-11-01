import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { sunoRequest } from '../../transport';
import { assertNonEmpty, assertSafeId } from '../../transport';
import {
	assertValidCallbackUrl,
	assertValidUploadUrl,
	assertPromptLength,
	assertStyleLength,
	assertTitleLength,
	styleLimit,
	assertWeightValue,
	assertDurationRange,
	assertUploadUrlList,
} from '../../utils/validators';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function addOptionalString(body: IDataObject, key: string, value: unknown): void {
	if (value !== undefined && value !== '') {
		body[key] = value;
	}
}

function addOptionalNumber(body: IDataObject, key: string, value: unknown): void {
	if (value !== undefined && value !== null && value !== '') {
		body[key] = value;
	}
}

function validateAndAddWeights(
	ctx: IExecuteFunctions,
	body: IDataObject,
	itemIndex: number,
): void {
	const styleWeight = ctx.getNodeParameter('styleWeight', itemIndex, null) as
		| number
		| undefined;
	const weirdnessConstraint = ctx.getNodeParameter(
		'weirdnessConstraint',
		itemIndex,
		null
	) as number | undefined;
	const audioWeight = ctx.getNodeParameter('audioWeight', itemIndex, null) as
		| number
		| undefined;

	if (styleWeight !== undefined && styleWeight !== null) {
		assertWeightValue(styleWeight, 'Style Weight');
		body.styleWeight = styleWeight;
	}
	if (weirdnessConstraint !== undefined && weirdnessConstraint !== null) {
		assertWeightValue(weirdnessConstraint, 'Weirdness Constraint');
		body.weirdnessConstraint = weirdnessConstraint;
	}
	if (audioWeight !== undefined && audioWeight !== null) {
		assertWeightValue(audioWeight, 'Audio Weight');
		body.audioWeight = audioWeight;
	}
}

function addPersonaFields(
	ctx: IExecuteFunctions,
	body: IDataObject,
	itemIndex: number,
): void {
	const personaId = ctx.getNodeParameter('personaId', itemIndex, '') as string;
	const personaModel = ctx.getNodeParameter('personaModel', itemIndex, '') as string;

	addOptionalString(body, 'personaId', personaId);
	addOptionalString(body, 'personaModel', personaModel);
}

function addVocalGender(
	ctx: IExecuteFunctions,
	body: IDataObject,
	itemIndex: number,
): void {
	const vocalGender = ctx.getNodeParameter('vocalGender', itemIndex, '') as string;
	addOptionalString(body, 'vocalGender', vocalGender);
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export async function handleMusicGeneration(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'generate') {
		return handleGenerate.call(this, itemIndex);
	}
	if (operation === 'extend') {
		return handleExtend.call(this, itemIndex);
	}
	if (operation === 'uploadCover') {
		return handleUploadCover.call(this, itemIndex);
	}
	if (operation === 'uploadExtend') {
		return handleUploadExtend.call(this, itemIndex);
	}
	if (operation === 'mashup') {
		return handleMashup.call(this, itemIndex);
	}
	if (operation === 'replaceSection') {
		return handleReplaceSection.call(this, itemIndex);
	}

	throw new Error(`Unknown operation: ${operation}`);
}

// ---------------------------------------------------------------------------
// Generate
// ---------------------------------------------------------------------------

// docs.sunoapi.org: Generate, Upload and Cover and Mashup allow 80 title characters, Extend and Upload and Extend allow 100, on every model.
const GENERATE_TITLE_LIMIT = 80;
const COVER_TITLE_LIMIT = 80;
const MASHUP_TITLE_LIMIT = 80;
const EXTEND_TITLE_LIMIT = 100;

async function handleGenerate(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const customMode = this.getNodeParameter('customMode', itemIndex) as boolean;
	const instrumental = this.getNodeParameter('instrumental', itemIndex) as boolean;
	const callBackUrl = this.getNodeParameter('callBackUrl', itemIndex) as string;
	const model = this.getNodeParameter('model', itemIndex) as string;
	const prompt = this.getNodeParameter('prompt', itemIndex, '') as string;

	assertValidCallbackUrl(callBackUrl);
	assertPromptLength(prompt, model, customMode);

	const body: IDataObject = {
		customMode,
		instrumental,
		callBackUrl,
		model,
	};

	addOptionalString(body, 'prompt', prompt);

	const style = this.getNodeParameter('style', itemIndex, '') as string;

	if (customMode) {
		const negativeTags = this.getNodeParameter('negativeTags', itemIndex, '') as string;
		const title = this.getNodeParameter('title', itemIndex, '') as string;
		assertStyleLength(style, model);
		assertTitleLength(title, model, GENERATE_TITLE_LIMIT);

		// The API rejects a custom request without style, lyrics or negative tags.
		if (!style.trim() && !negativeTags.trim()) {
			throw new Error('Custom mode needs a Style or Negative Tags, the Suno API rejects the request without one');
		}
		addOptionalString(body, 'style', style);
		addOptionalString(body, 'title', title);
		addOptionalString(body, 'negativeTags', negativeTags);
		addPersonaFields(this, body, itemIndex);
		addVocalGender(this, body, itemIndex);
		validateAndAddWeights(this, body, itemIndex);
	} else {
		// Simple mode needs a style, lyrics or reference media. Without a Style, the prompt is sent as the style, cut to the model's style limit.
		assertStyleLength(style, model);
		const simpleStyle = style.trim() || prompt.trim().slice(0, styleLimit(model));
		if (!simpleStyle) {
			throw new Error('Simple mode needs a Prompt or a Style, the Suno API rejects the request without one');
		}
		body.style = simpleStyle;
		// Negative tags, vocal gender and the weights are custom-mode only, so they are not sent here.
		addPersonaFields(this, body, itemIndex);
	}

	const response = await sunoRequest.call(this, 'POST', '/api/v1/generate', body);
	return response as IDataObject;
}

// ---------------------------------------------------------------------------
// Extend
// ---------------------------------------------------------------------------

async function handleExtend(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const defaultParamFlag = this.getNodeParameter('defaultParamFlag', itemIndex) as boolean;
	const audioId = this.getNodeParameter('audioId', itemIndex) as string;
	const callBackUrl = this.getNodeParameter('callBackUrl', itemIndex) as string;
	const model = this.getNodeParameter('model', itemIndex) as string;

	assertSafeId(audioId, 'Audio ID');
	assertValidCallbackUrl(callBackUrl);

	const body: IDataObject = {
		defaultParamFlag,
		audioId,
		callBackUrl,
		model,
	};

	if (defaultParamFlag) {
		const prompt = this.getNodeParameter('prompt', itemIndex, '') as string;
		const style = this.getNodeParameter('style', itemIndex, '') as string;
		const title = this.getNodeParameter('title', itemIndex, '') as string;
		const continueAt = this.getNodeParameter('continueAt', itemIndex, 0) as number;
		const instrumental = this.getNodeParameter('instrumental', itemIndex, false) as boolean;

		assertPromptLength(prompt, model, true);
		assertStyleLength(style, model);
		assertTitleLength(title, model, EXTEND_TITLE_LIMIT);

		addOptionalString(body, 'prompt', prompt);
		addOptionalString(body, 'style', style);
		addOptionalString(body, 'title', title);
		// The API requires continueAt to be greater than 0, so the 0 default means not set.
		if (continueAt > 0) body.continueAt = continueAt;
		body.instrumental = instrumental;
	}

	const negativeTags = this.getNodeParameter('negativeTags', itemIndex, '') as string;
	addOptionalString(body, 'negativeTags', negativeTags);

	addPersonaFields(this, body, itemIndex);
	addVocalGender(this, body, itemIndex);
	validateAndAddWeights(this, body, itemIndex);

	// The API forbids vocal inputs on an instrumental extension.
	if (body.instrumental === true) {
		delete body.prompt;
		delete body.vocalGender;
	}

	const response = await sunoRequest.call(this, 'POST', '/api/v1/generate/extend', body);
	return response as IDataObject;
}

// ---------------------------------------------------------------------------
// Upload Cover
// ---------------------------------------------------------------------------

async function handleUploadCover(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const uploadUrl = this.getNodeParameter('uploadUrl', itemIndex) as string;
	const customMode = this.getNodeParameter('customMode', itemIndex) as boolean;
	const instrumental = this.getNodeParameter('instrumental', itemIndex) as boolean;
	const callBackUrl = this.getNodeParameter('callBackUrl', itemIndex) as string;
	const model = this.getNodeParameter('model', itemIndex) as string;
	const prompt = this.getNodeParameter('prompt', itemIndex, '') as string;

	assertValidUploadUrl(uploadUrl);
	assertValidCallbackUrl(callBackUrl);
	assertPromptLength(prompt, model, customMode);

	const body: IDataObject = {
		uploadUrl,
		customMode,
		instrumental,
		callBackUrl,
		model,
	};

	addOptionalString(body, 'prompt', prompt);

	if (customMode) {
		const style = this.getNodeParameter('style', itemIndex, '') as string;
		const title = this.getNodeParameter('title', itemIndex, '') as string;

		assertStyleLength(style, model);
		assertTitleLength(title, model, COVER_TITLE_LIMIT);

		addOptionalString(body, 'style', style);
		addOptionalString(body, 'title', title);
	}

	const negativeTags = this.getNodeParameter('negativeTags', itemIndex, '') as string;
	addOptionalString(body, 'negativeTags', negativeTags);

	addPersonaFields(this, body, itemIndex);
	addVocalGender(this, body, itemIndex);
	validateAndAddWeights(this, body, itemIndex);

	const response = await sunoRequest.call(
		this,
		'POST',
		'/api/v1/generate/upload-cover',
		body,
	);
	return response as IDataObject;
}

// ---------------------------------------------------------------------------
// Upload Extend
// ---------------------------------------------------------------------------

async function handleUploadExtend(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const uploadUrl = this.getNodeParameter('uploadUrl', itemIndex) as string;
	const defaultParamFlag = this.getNodeParameter('defaultParamFlag', itemIndex) as boolean;
	const callBackUrl = this.getNodeParameter('callBackUrl', itemIndex) as string;
	const model = this.getNodeParameter('model', itemIndex) as string;

	assertValidUploadUrl(uploadUrl);
	assertValidCallbackUrl(callBackUrl);

	const body: IDataObject = {
		uploadUrl,
		defaultParamFlag,
		callBackUrl,
		model,
	};

	if (defaultParamFlag) {
		const prompt = this.getNodeParameter('prompt', itemIndex, '') as string;
		const style = this.getNodeParameter('style', itemIndex, '') as string;
		const title = this.getNodeParameter('title', itemIndex, '') as string;
		const continueAt = this.getNodeParameter('continueAt', itemIndex, 0) as number;
		const instrumental = this.getNodeParameter('instrumental', itemIndex, false) as boolean;

		assertPromptLength(prompt, model, true);
		assertStyleLength(style, model);
		assertTitleLength(title, model, EXTEND_TITLE_LIMIT);

		addOptionalString(body, 'prompt', prompt);
		addOptionalString(body, 'style', style);
		addOptionalString(body, 'title', title);
		// The API requires continueAt to be greater than 0, so the 0 default means not set.
		if (continueAt > 0) body.continueAt = continueAt;
		body.instrumental = instrumental;
	}

	const negativeTags = this.getNodeParameter('negativeTags', itemIndex, '') as string;
	addOptionalString(body, 'negativeTags', negativeTags);

	addPersonaFields(this, body, itemIndex);
	addVocalGender(this, body, itemIndex);
	validateAndAddWeights(this, body, itemIndex);

	const response = await sunoRequest.call(
		this,
		'POST',
		'/api/v1/generate/upload-extend',
		body,
	);
	return response as IDataObject;
}

// ---------------------------------------------------------------------------
// Mashup
// ---------------------------------------------------------------------------

async function handleMashup(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const uploadUrl1 = this.getNodeParameter('uploadUrl1', itemIndex) as string;
	const uploadUrl2 = this.getNodeParameter('uploadUrl2', itemIndex) as string;
	const customMode = this.getNodeParameter('customMode', itemIndex) as boolean;
	const model = this.getNodeParameter('model', itemIndex) as string;
	const callBackUrl = this.getNodeParameter('callBackUrl', itemIndex) as string;

	const uploadUrlList = [uploadUrl1, uploadUrl2];
	assertUploadUrlList(uploadUrlList);
	assertValidCallbackUrl(callBackUrl);

	const body: IDataObject = {
		uploadUrlList,
		customMode,
		model,
		callBackUrl,
	};

	if (customMode) {
		const prompt = this.getNodeParameter('prompt', itemIndex, '') as string;
		const style = this.getNodeParameter('style', itemIndex, '') as string;
		const title = this.getNodeParameter('title', itemIndex, '') as string;

		assertPromptLength(prompt, model, true);
		assertStyleLength(style, model);
		assertTitleLength(title, model, MASHUP_TITLE_LIMIT);

		addOptionalString(body, 'prompt', prompt);
		addOptionalString(body, 'style', style);
		addOptionalString(body, 'title', title);
	}

	const instrumental = this.getNodeParameter('instrumental', itemIndex, false) as boolean;
	if (instrumental) {
		body.instrumental = instrumental;
	}

	const negativeTags = this.getNodeParameter('negativeTags', itemIndex, '') as string;
	addOptionalString(body, 'negativeTags', negativeTags);

	addPersonaFields(this, body, itemIndex);
	addVocalGender(this, body, itemIndex);
	validateAndAddWeights(this, body, itemIndex);

	const response = await sunoRequest.call(
		this,
		'POST',
		'/api/v1/generate/mashup',
		body,
	);
	return response as IDataObject;
}

// ---------------------------------------------------------------------------
// Replace Section
// ---------------------------------------------------------------------------

async function handleReplaceSection(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const taskId = this.getNodeParameter('taskId', itemIndex) as string;
	const audioId = this.getNodeParameter('audioId', itemIndex) as string;
	const prompt = this.getNodeParameter('prompt', itemIndex) as string;
	const tags = this.getNodeParameter('tags', itemIndex) as string;
	const title = this.getNodeParameter('title', itemIndex) as string;
	const infillStartS = this.getNodeParameter('infillStartS', itemIndex) as number;
	const infillEndS = this.getNodeParameter('infillEndS', itemIndex) as number;
	const fullLyrics = this.getNodeParameter('fullLyrics', itemIndex, '') as string;

	assertSafeId(taskId, 'Task ID');
	assertSafeId(audioId, 'Audio ID');
	assertDurationRange(infillStartS, infillEndS);
	assertNonEmpty(fullLyrics, 'Full Lyrics');

	const body: IDataObject = {
		taskId,
		audioId,
		prompt,
		tags,
		title,
		infillStartS,
		infillEndS,
		fullLyrics,
	};

	const negativeTags = this.getNodeParameter('negativeTags', itemIndex, '') as string;
	addOptionalString(body, 'negativeTags', negativeTags);

	const callBackUrl = this.getNodeParameter('callBackUrl', itemIndex, '') as string;
	if (callBackUrl) {
		assertValidCallbackUrl(callBackUrl);
		body.callBackUrl = callBackUrl;
	}

	const response = await sunoRequest.call(
		this,
		'POST',
		'/api/v1/generate/replace-section',
		body,
	);
	return response as IDataObject;
}
