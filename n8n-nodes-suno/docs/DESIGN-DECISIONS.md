# Design decisions

## Coverage thresholds

**Decision.** `jest.config.js` sets the global coverage thresholds to the measured floor (97% statements and lines, 88% branches, 98% functions), and CI plus the publish workflow run `npm run test:coverage`, so a release fails if coverage drops below them.

**Why.** Before 1.4.0 the thresholds were 99, 97, 100 and 100, but no workflow ran Jest with coverage, so they never gated anything. Enforcing those numbers would have failed every build, because measured coverage is 97.4% statements and 88.9% branches. A gate set at the real floor stops regressions today. Raise the numbers as tests are added, never lower them.

## Title length per endpoint

**Decision.** Each music operation checks the title against its own endpoint limit: 80 for Generate, Upload and Cover and Mashup, 100 for Extend and Upload and Extend. Other callers keep the per-model table.

**Evidence.** docs.sunoapi.org, read 2026-11-01. Generate Music says "title length limit: 80 characters" for every model. Extend Music and Upload And Extend Audio state 100. Upload And Cover Audio and Generate Mashup state 80.

## Simple-mode style

**Decision.** In simple mode an empty Style is filled from the prompt, cut to the model's style limit (200 on V4, 1000 otherwise). The full prompt is still sent as `prompt`.

**Evidence.** Generate Music: non-custom mode needs "at least one of imageUrls, videoUrls, audioUrls, style, or lyrics", and the style limit is 200 on V4 and 1000 on the others.
