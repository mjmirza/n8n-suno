# Design decisions

## Coverage thresholds

**Decision.** `jest.config.js` requires 99% statements, 97% branches, 100% functions and 100% lines, and CI plus the publish workflow run `npm run test:coverage`, so a release fails if coverage drops below them. Since 1.5.0 the suite reaches 100% on all four.

**History.** Before 1.4.0 these thresholds existed but no workflow ran Jest with coverage, so they gated nothing. 1.4.0 enforced them at a lowered floor. 1.5.0 restores the original numbers, backed by tests for every branch. Two unreachable branches were removed instead of tested: a dotted IPv4 tail in an IPv4-mapped IPv6 host, which WHATWG URL parsing always rewrites as hex groups, and a duplicate check in the Resource list, which a test now pins as duplicate-free.

## Category selector removed

**Decision.** 1.5.0 removes the Category field. No code ever read it, so it changed nothing at run time.

**Why not make it filter resources.** Saved workflows store only non-default values. A workflow whose resource sits outside the default category stores no category, so a filtering Category would show the default group and hide the saved resource. Removing the field keeps every saved workflow's resource and operation, and n8n drops the unused stored value on load.

## Title length per endpoint

**Decision.** Each music operation checks the title against its own endpoint limit: 80 for Generate, Upload and Cover and Mashup, 100 for Extend and Upload and Extend. Other callers keep the per-model table.

**Evidence.** docs.sunoapi.org, read 2026-11-01. Generate Music says "title length limit: 80 characters" for every model. Extend Music and Upload And Extend Audio state 100. Upload And Cover Audio and Generate Mashup state 80.

## Simple-mode style

**Decision.** In simple mode an empty Style is filled from the prompt, cut to the model's style limit (200 on V4, 1000 otherwise). The full prompt is still sent as `prompt`.

**Evidence.** Generate Music: non-custom mode needs "at least one of imageUrls, videoUrls, audioUrls, style, or lyrics", and the style limit is 200 on V4 and 1000 on the others.

## Oldest supported n8n

**Decision.** The node supports n8n 1.85 or newer, including 2.x, on Node.js 18.17 or newer. The README states this, and CI plus the publish workflow run the built node against `n8n-workflow` 1.83.0, the version n8n 1.85 ships, on Node.js 18 and 20.

**Why 1.85.** The node declares its connections with `NodeConnectionTypes.Main`. n8n's community node lint rule `node-connection-type-literal`, which n8n's package scanner enforces, requires that constant instead of the string `'main'`. `n8n-workflow` first exports it in 1.83.0 (checked against the published packages: 1.82.0 lacks it, 1.83.0 has it), and `npm view n8n@1.85.0 dependencies.n8n-workflow` is 1.83.0. n8n 1.85 needs Node.js 18.17 (`npm view n8n@1.85.0 engines`).

**Why package.json does not encode it.** The rule `valid-peer-dependencies` requires `"n8n-workflow": "*"`, so the floor cannot go in `peerDependencies`. It lives in the README and is enforced by the runtime tests.
