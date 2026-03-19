import {
	assertValidCallbackUrl,
	assertValidUploadUrl,
	assertPromptLength,
	assertStyleLength,
	assertTitleLength,
	assertWeightValue,
	assertDurationRange,
	assertVocalSegment,
	assertBase64Data,
	assertUploadUrlList,
} from '../nodes/Suno/utils/validators';

// ---------------------------------------------------------------------------
// assertValidCallbackUrl / assertValidUploadUrl
// ---------------------------------------------------------------------------

describe('assertValidCallbackUrl', () => {
	it('accepts valid HTTPS URL', () => {
		expect(() => assertValidCallbackUrl('https://example.com/callback')).not.toThrow();
	});

	it('rejects private IP', () => {
		expect(() => assertValidCallbackUrl('https://192.168.1.1/callback')).toThrow();
	});

	it('rejects HTTP', () => {
		expect(() => assertValidCallbackUrl('http://example.com/callback')).toThrow('must use HTTPS');
	});
});

describe('assertValidUploadUrl', () => {
	it('accepts valid HTTPS URL', () => {
		expect(() => assertValidUploadUrl('https://cdn.example.com/audio.mp3')).not.toThrow();
	});

	it('rejects private IP', () => {
		expect(() => assertValidUploadUrl('https://10.0.0.1/audio.mp3')).toThrow();
	});
});

// ---------------------------------------------------------------------------
// assertPromptLength
// ---------------------------------------------------------------------------

describe('assertPromptLength', () => {
	it('skips validation for empty string', () => {
		expect(() => assertPromptLength('', 'V4', false)).not.toThrow();
	});

	it('non-custom mode: accepts prompt up to 500 chars', () => {
		expect(() => assertPromptLength('a'.repeat(500), 'V4', false)).not.toThrow();
	});

	it('non-custom mode: rejects prompt over 500 chars', () => {
		expect(() => assertPromptLength('a'.repeat(501), 'V4', false)).toThrow('exceeds maximum length of 500');
	});

	it('custom V4: accepts prompt up to 3000 chars', () => {
		expect(() => assertPromptLength('a'.repeat(3000), 'V4', true)).not.toThrow();
	});

	it('custom V4: rejects prompt over 3000 chars', () => {
		expect(() => assertPromptLength('a'.repeat(3001), 'V4', true)).toThrow('exceeds maximum length of 3000');
	});

	it('custom V4_5: accepts prompt up to 5000 chars', () => {
		expect(() => assertPromptLength('a'.repeat(5000), 'V4_5', true)).not.toThrow();
	});

	it('custom V4_5: rejects prompt over 5000 chars', () => {
		expect(() => assertPromptLength('a'.repeat(5001), 'V4_5', true)).toThrow('exceeds maximum length of 5000');
	});

	it('custom V5: accepts prompt up to 5000 chars', () => {
		expect(() => assertPromptLength('a'.repeat(5000), 'V5', true)).not.toThrow();
	});

	it('custom V5: rejects prompt over 5000 chars', () => {
		expect(() => assertPromptLength('a'.repeat(5001), 'V5', true)).toThrow('exceeds maximum length of 5000');
	});
});

// ---------------------------------------------------------------------------
// assertStyleLength
// ---------------------------------------------------------------------------

describe('assertStyleLength', () => {
	it('skips validation for empty string', () => {
		expect(() => assertStyleLength('', 'V4')).not.toThrow();
	});

	it('V4: accepts style up to 200 chars', () => {
		expect(() => assertStyleLength('a'.repeat(200), 'V4')).not.toThrow();
	});

	it('V4: rejects style over 200 chars', () => {
		expect(() => assertStyleLength('a'.repeat(201), 'V4')).toThrow('exceeds maximum length of 200');
	});

	it('V4_5: accepts style up to 1000 chars', () => {
		expect(() => assertStyleLength('a'.repeat(1000), 'V4_5')).not.toThrow();
	});

	it('V4_5: rejects style over 1000 chars', () => {
		expect(() => assertStyleLength('a'.repeat(1001), 'V4_5')).toThrow('exceeds maximum length of 1000');
	});

	it('V5: accepts style up to 1000 chars', () => {
		expect(() => assertStyleLength('a'.repeat(1000), 'V5')).not.toThrow();
	});
});

// ---------------------------------------------------------------------------
// assertTitleLength
// ---------------------------------------------------------------------------

describe('assertTitleLength', () => {
	it('skips validation for empty string', () => {
		expect(() => assertTitleLength('', 'V4')).not.toThrow();
	});

	it('V4: accepts title up to 80 chars', () => {
		expect(() => assertTitleLength('a'.repeat(80), 'V4')).not.toThrow();
	});

	it('V4: rejects title over 80 chars', () => {
		expect(() => assertTitleLength('a'.repeat(81), 'V4')).toThrow('exceeds maximum length of 80');
	});

	it('V4_5ALL: accepts title up to 80 chars', () => {
		expect(() => assertTitleLength('a'.repeat(80), 'V4_5ALL')).not.toThrow();
	});

	it('V4_5ALL: rejects title over 80 chars', () => {
		expect(() => assertTitleLength('a'.repeat(81), 'V4_5ALL')).toThrow('exceeds maximum length of 80');
	});

	it('V4_5: accepts title up to 100 chars', () => {
		expect(() => assertTitleLength('a'.repeat(100), 'V4_5')).not.toThrow();
	});

	it('V4_5: rejects title over 100 chars', () => {
		expect(() => assertTitleLength('a'.repeat(101), 'V4_5')).toThrow('exceeds maximum length of 100');
	});

	it('V4_5PLUS: accepts title up to 100 chars', () => {
		expect(() => assertTitleLength('a'.repeat(100), 'V4_5PLUS')).not.toThrow();
	});

	it('V5: accepts title up to 100 chars', () => {
		expect(() => assertTitleLength('a'.repeat(100), 'V5')).not.toThrow();
	});

	it('V5: rejects title over 100 chars', () => {
		expect(() => assertTitleLength('a'.repeat(101), 'V5')).toThrow('exceeds maximum length of 100');
	});
});

// ---------------------------------------------------------------------------
// assertWeightValue
// ---------------------------------------------------------------------------

describe('assertWeightValue', () => {
	it('accepts 0.00', () => {
		expect(() => assertWeightValue(0, 'Weight')).not.toThrow();
	});

	it('accepts 1.00', () => {
		expect(() => assertWeightValue(1, 'Weight')).not.toThrow();
	});

	it('accepts 0.5', () => {
		expect(() => assertWeightValue(0.5, 'Weight')).not.toThrow();
	});

	it('rejects -0.1', () => {
		expect(() => assertWeightValue(-0.1, 'Weight')).toThrow('must be between');
	});

	it('rejects 1.1', () => {
		expect(() => assertWeightValue(1.1, 'Weight')).toThrow('must be between');
	});

	it('rejects NaN', () => {
		expect(() => assertWeightValue(NaN, 'Weight')).toThrow('finite number');
	});

	it('rejects Infinity', () => {
		expect(() => assertWeightValue(Infinity, 'Weight')).toThrow('finite number');
	});
});

// ---------------------------------------------------------------------------
// assertDurationRange
// ---------------------------------------------------------------------------

describe('assertDurationRange', () => {
	it('accepts 10-second duration (10, 20)', () => {
		expect(() => assertDurationRange(10, 20)).not.toThrow();
	});

	it('accepts minimum 6-second duration', () => {
		expect(() => assertDurationRange(0, 6)).not.toThrow();
	});

	it('accepts maximum 60-second duration', () => {
		expect(() => assertDurationRange(0, 60)).not.toThrow();
	});

	it('rejects duration under 6 seconds (10, 15)', () => {
		expect(() => assertDurationRange(10, 15)).toThrow('at least 6 seconds');
	});

	it('rejects duration over 60 seconds (10, 71)', () => {
		expect(() => assertDurationRange(10, 71)).toThrow('must not exceed 60 seconds');
	});

	it('rejects start >= end (20, 10)', () => {
		expect(() => assertDurationRange(20, 10)).toThrow('Start time must be less than end time');
	});

	it('rejects start equal to end', () => {
		expect(() => assertDurationRange(10, 10)).toThrow('Start time must be less than end time');
	});

	it('rejects NaN start', () => {
		expect(() => assertDurationRange(NaN, 20)).toThrow('finite number');
	});

	it('rejects NaN end', () => {
		expect(() => assertDurationRange(10, NaN)).toThrow('finite number');
	});
});

// ---------------------------------------------------------------------------
// assertVocalSegment
// ---------------------------------------------------------------------------

describe('assertVocalSegment', () => {
	it('accepts 15-second segment (0, 15)', () => {
		expect(() => assertVocalSegment(0, 15)).not.toThrow();
	});

	it('accepts minimum 10-second segment', () => {
		expect(() => assertVocalSegment(0, 10)).not.toThrow();
	});

	it('accepts maximum 30-second segment', () => {
		expect(() => assertVocalSegment(0, 30)).not.toThrow();
	});

	it('rejects segment under 10 seconds (0, 8)', () => {
		expect(() => assertVocalSegment(0, 8)).toThrow('at least 10 seconds');
	});

	it('rejects segment over 30 seconds (0, 35)', () => {
		expect(() => assertVocalSegment(0, 35)).toThrow('must not exceed 30 seconds');
	});

	it('rejects start >= end (20, 10)', () => {
		expect(() => assertVocalSegment(20, 10)).toThrow('Vocal start must be less than vocal end');
	});

	it('rejects NaN start', () => {
		expect(() => assertVocalSegment(NaN, 15)).toThrow('finite number');
	});

	it('rejects NaN end', () => {
		expect(() => assertVocalSegment(0, NaN)).toThrow('finite number');
	});
});

// ---------------------------------------------------------------------------
// assertBase64Data
// ---------------------------------------------------------------------------

describe('assertBase64Data', () => {
	it('accepts valid base64 string', () => {
		expect(() => assertBase64Data('SGVsbG8=')).not.toThrow();
	});

	it('accepts base64 without padding', () => {
		expect(() => assertBase64Data('SGVsbG8')).not.toThrow();
	});

	it('accepts data URL with base64', () => {
		expect(() => assertBase64Data('data:image/png;base64,iVBORw0KGgo=')).not.toThrow();
	});

	it('accepts data URL with audio mime type', () => {
		expect(() => assertBase64Data('data:audio/mp3;base64,AAAA')).not.toThrow();
	});

	it('rejects invalid base64 data', () => {
		expect(() => assertBase64Data('not base64!!!')).toThrow('Invalid base64');
	});

	it('rejects empty string', () => {
		expect(() => assertBase64Data('')).toThrow('Base64 data is required');
	});

	it('rejects null', () => {
		expect(() => assertBase64Data(null as unknown as string)).toThrow('Base64 data is required');
	});

	it('rejects data URL with invalid base64 payload', () => {
		expect(() => assertBase64Data('data:image/png;base64,not valid!!!')).toThrow('Invalid base64 encoding in data URL');
	});
});

// ---------------------------------------------------------------------------
// assertUploadUrlList
// ---------------------------------------------------------------------------

describe('assertUploadUrlList', () => {
	const validUrl1 = 'https://cdn.example.com/audio1.mp3';
	const validUrl2 = 'https://cdn.example.com/audio2.mp3';

	it('accepts exactly 2 valid HTTPS URLs', () => {
		expect(() => assertUploadUrlList([validUrl1, validUrl2])).not.toThrow();
	});

	it('rejects 0 URLs', () => {
		expect(() => assertUploadUrlList([])).toThrow('exactly 2 audio URLs');
	});

	it('rejects 1 URL', () => {
		expect(() => assertUploadUrlList([validUrl1])).toThrow('exactly 2 audio URLs');
	});

	it('rejects 3 URLs', () => {
		expect(() => assertUploadUrlList([validUrl1, validUrl2, validUrl1])).toThrow('exactly 2 audio URLs');
	});

	it('rejects invalid URL in list', () => {
		expect(() => assertUploadUrlList([validUrl1, 'http://insecure.com/audio.mp3'])).toThrow('must use HTTPS');
	});

	it('rejects private IP in list', () => {
		expect(() => assertUploadUrlList([validUrl1, 'https://192.168.1.1/audio.mp3'])).toThrow();
	});

	it('rejects non-array input', () => {
		expect(() => assertUploadUrlList('not an array' as unknown as string[])).toThrow('exactly 2 audio URLs');
	});
});
