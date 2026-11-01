import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';

import { sunoRequest, assertNonEmpty } from '../../transport';
import {
	assertValidUploadUrl,
	assertValidCallbackUrl,
	assertWeightValue,
} from '../../utils/validators';

export async function handleVocals(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'addVocals') {
		return addVocals.call(this, itemIndex);
	}
	if (operation === 'addInstrumental') {
		return addInstrumental.call(this, itemIndex);
	}
	throw new Error(`Unknown vocals operation: ${operation}`);
}

// ---------------------------------------------------------------------------
// Add Vocals
// ---------------------------------------------------------------------------

async function addVocals(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const uploadUrl = this.getNodeParameter('uploadUrl', itemIndex) as string;
	const prompt = this.getNodeParameter('prompt', itemIndex) as string;
	const title = this.getNodeParameter('title', itemIndex) as string;
	const style = this.getNodeParameter('style', itemIndex) as string;
	const negativeTags = this.getNodeParameter('negativeTags', itemIndex) as string;
	const callBackUrl = this.getNodeParameter('callBackUrl', itemIndex) as string;

	// Validate required fields
	assertValidUploadUrl(uploadUrl);
	assertNonEmpty(title, 'Title', 100);
	assertNonEmpty(style, 'Style');
	assertNonEmpty(negativeTags, 'Negative Tags');
	assertValidCallbackUrl(callBackUrl);

	const body: IDataObject = {
		uploadUrl,
		title: title.trim(),
		style,
		negativeTags,
		callBackUrl,
	};

	// Optional fields
	if (prompt && prompt.trim()) {
		body.prompt = prompt;
	}

	const vocalGender = this.getNodeParameter('vocalGender', itemIndex, '') as string;
	if (vocalGender) {
		body.vocalGender = vocalGender;
	}

	const styleWeight = this.getNodeParameter('styleWeight', itemIndex, undefined) as number | undefined;
	if (styleWeight !== undefined && styleWeight !== null) {
		assertWeightValue(styleWeight, 'Style Weight');
		body.styleWeight = styleWeight;
	}

	const weirdnessConstraint = this.getNodeParameter('weirdnessConstraint', itemIndex, undefined) as number | undefined;
	if (weirdnessConstraint !== undefined && weirdnessConstraint !== null) {
		assertWeightValue(weirdnessConstraint, 'Weirdness Constraint');
		body.weirdnessConstraint = weirdnessConstraint;
	}

	const audioWeight = this.getNodeParameter('audioWeight', itemIndex, undefined) as number | undefined;
	if (audioWeight !== undefined && audioWeight !== null) {
		assertWeightValue(audioWeight, 'Audio Weight');
		body.audioWeight = audioWeight;
	}

	const model = this.getNodeParameter('model', itemIndex, 'V4_5PLUS') as string;
	if (model) {
		body.model = model;
	}

	const response = await sunoRequest.call(this, 'POST', '/api/v1/generate/add-vocals', body);
	return response as IDataObject;
}

// ---------------------------------------------------------------------------
// Add Instrumental
// ---------------------------------------------------------------------------

async function addInstrumental(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const uploadUrl = this.getNodeParameter('uploadUrl', itemIndex) as string;
	const title = this.getNodeParameter('title', itemIndex) as string;
	const tags = this.getNodeParameter('tags', itemIndex) as string;
	const negativeTags = this.getNodeParameter('negativeTags', itemIndex) as string;
	const callBackUrl = this.getNodeParameter('callBackUrl', itemIndex) as string;

	// Validate required fields
	assertValidUploadUrl(uploadUrl);
	assertNonEmpty(title, 'Title', 100);
	assertNonEmpty(tags, 'Tags');
	assertNonEmpty(negativeTags, 'Negative Tags');
	assertValidCallbackUrl(callBackUrl);

	const body: IDataObject = {
		uploadUrl,
		title: title.trim(),
		tags,
		negativeTags,
		callBackUrl,
	};

	// Optional fields
	const vocalGender = this.getNodeParameter('vocalGender', itemIndex, '') as string;
	if (vocalGender) {
		body.vocalGender = vocalGender;
	}

	const styleWeight = this.getNodeParameter('styleWeight', itemIndex, undefined) as number | undefined;
	if (styleWeight !== undefined && styleWeight !== null) {
		assertWeightValue(styleWeight, 'Style Weight');
		body.styleWeight = styleWeight;
	}

	const audioWeight = this.getNodeParameter('audioWeight', itemIndex, undefined) as number | undefined;
	if (audioWeight !== undefined && audioWeight !== null) {
		assertWeightValue(audioWeight, 'Audio Weight');
		body.audioWeight = audioWeight;
	}

	const weirdnessConstraint = this.getNodeParameter('weirdnessConstraint', itemIndex, undefined) as number | undefined;
	if (weirdnessConstraint !== undefined && weirdnessConstraint !== null) {
		assertWeightValue(weirdnessConstraint, 'Weirdness Constraint');
		body.weirdnessConstraint = weirdnessConstraint;
	}

	const model = this.getNodeParameter('model', itemIndex, 'V4_5PLUS') as string;
	if (model) {
		body.model = model;
	}

	const response = await sunoRequest.call(this, 'POST', '/api/v1/generate/add-instrumental', body);
	return response as IDataObject;
}
