# Changelog

## [1.7.4] - 2026-11-01

### Fixed
- A secret that a response echoes as a property name is now masked in the error data too. Previously only values were masked.
- A secret echoed as the response `code` is masked in the error's HTTP code as well.
- Generate Persona, Generate Mashup and Replace Section retry a body code 429, which those endpoints document as a rate limit, and label it a rate limit. Previously it was shown as "Insufficient credits" and never retried. On every other endpoint 429 still means insufficient credits.
- Generate Persona rejects a negative vocal start or end, and the editor does not allow them. The API requires both to be 0 or more.
- Extend Music and Upload and Extend reject a negative Continue At instead of silently leaving it out, and the editor does not allow one.
- The configured API key is masked wherever a successful response echoes it, for example in a task's error message. Other output is unchanged.
- A successful HTTP status with a body that is not a JSON envelope, such as a gateway's HTML error page, is now an error. Previously the item reported `{ "success": true }`.

### Changed
- The README describes generation as starting a task, with the audio collected through a callback or Get Music Details.

## [1.7.3] - 2026-11-01

### Fixed
- A failed request that is not an HTTP error, such as an expired certificate or a proxy failure, shows its original reason in the error description. Previously only "Suno API request failed" remained.
- Replace Section rejects negative start and end times, and the editor does not allow them. The API requires both to be 0 or more.

### Changed
- The README states the real floor, n8n 1.85 or newer on Node.js 18.17 or newer. Older n8n 1.x cannot load the node, because its `n8n-workflow` lacks `NodeConnectionTypes`, which n8n's community node rules require. CI and publish now run the built node against `n8n-workflow` 1.83.0, the oldest supported. See docs/DESIGN-DECISIONS.md.

## [1.7.2] - 2026-11-01

### Changed
- The publish workflow ships the exact `dist` that the Node.js 18 to 24 runtime tests checked. Previously the publish job rebuilt it before publishing.

## [1.7.1] - 2026-11-01

### Fixed
- URL validation no longer calls `URL.canParse`, which Node.js added in 18.17. Older Node.js 18 runtimes failed every operation that checks a URL.

### Changed
- package.json declares Node.js 18 or newer, and the README says so. Upload Stream relies on the FormData and Blob built into Node.js 18, so early n8n 1.x installs on Node.js 16 are not supported.
- CI and the publish workflow run the built node on Node.js 18, 20, 22 and 24 before a release.

## [1.7.0] - 2026-11-01

### Added
- Add Vocals and Add Instrumental offer the current V6, V6 Mini and V6 Wild models. The default stays as before.

### Fixed
- Error masking also covers the error stack and the configured API key itself, whatever its format. Previously a token could survive in the stack of an error thrown by the HTTP helper, and a key matching none of the token patterns survived in the message.

### Changed
- The README states that signed provenance covers versions from 1.0.2 on. Earlier versions were published by hand.

## [1.6.0] - 2026-11-01

### Fixed
- Token masking reaches every depth of an error response. A value nested deeper than eight levels, or repeated, is replaced instead of passed through, so a token buried in an upstream error never reaches the n8n error view.
- URLs whose hostname starts with private-looking numbers, such as 10.example.com or 192.168.example.com, are accepted. Only IPv4 literals are checked against the private ranges.
- Audio Weight is not sent for instrumental tracks and is hidden in the editor when Instrumental is on. The API does not support it without vocals.
- A Generate field test now fails if the Style field disappears. Previously optional chaining let it pass.

## [1.5.0] - 2026-11-01

### Fixed
- A body-level rate limit (code 405 or 430 in an HTTP 200 response) honors Retry-After. A wait over 60 seconds stops the node with the requested wait in the message. Previously it retried after about a second.
- Upload and Cover accepts prompts up to the custom-mode limit (5000 characters, 3000 on V4). The endpoint always runs in custom mode. Previously the 3000-character simple limit applied when Custom Mode was off.
- The credential test fails on every documented Suno error code, including maintenance (455) and server errors (500, 501). Previously only 401 failed it.
- Field descriptions state the current limits. The simple prompt allows 3000 characters, and titles allow 80 or 100 characters depending on the operation.
- The README first-song steps include the required Callback URL.

### Removed
- The Category field. No code read it, so it never changed what the node did. Resource and operation values are unchanged. See docs/DESIGN-DECISIONS.md.

### Changed
- Coverage thresholds are back at 99% statements, 97% branches, 100% functions and 100% lines, and the suite now reaches 100% on all four. Two unreachable branches were removed.
- A round-2 regression test now requires the request it checks. Previously it passed with zero assertions when Extend threw early.

## [1.4.0] - 2026-11-01

### Added
- The V6, V6 Mini and V6 Wild models, the current Suno models, plus V5.5. The default stays V5, so saved workflows keep their model.

### Fixed
- Simple-mode Generate cuts a prompt used as the style to the model's style limit, 200 characters on V4. Previously a long prompt was sent as an oversized style.
- Simple-mode Generate no longer sends Negative Tags, Vocal Gender or the weights, which the API accepts only in custom mode. The fields are now shown only in custom mode.
- Simple-mode prompts may be up to 3000 characters, as the Generate docs allow. Previously anything over 500 was rejected.
- Title limits follow each endpoint. Generate, Upload and Cover and Mashup allow 80 characters, Extend and Upload and Extend allow 100.
- A GET that fails with a connection error such as ECONNRESET is retried. Previously n8n's error wrapper made it fail at once.
- Retry-After works on real n8n. The node reads the full response, so the header is not lost when n8n wraps an HTTP error. A wait over 60 seconds stops the node with the requested wait in the message.

### Changed
- CI and the publish workflow run tests with coverage, so the coverage thresholds now gate every release. They are set to the measured floor, see docs/DESIGN-DECISIONS.md.
- Security tests fail when a validator stops throwing. Previously they called the undefined `fail()`, which threw a ReferenceError that satisfied the test.
- The README lists the Suno operations the node does not cover yet.

## [1.3.0] - 2026-11-01

### Fixed
- Generate in simple mode meets the current API contract. Suno now rejects a simple-mode request without a style, lyrics or reference media. The Style field is shown in simple mode too, and when it is empty the prompt is sent as the style, so existing prompt-only workflows keep working.
- Generate in custom mode stops with a clear error when neither Style nor Negative Tags is set, instead of failing upstream.
- Token-like strings are masked in every field of an API error, including the message, description, the response data and errors raised by the HTTP layer. Previously only the `msg` field was masked.
- Extend no longer sends a prompt or vocal gender with an instrumental extension. The API forbids them.
- Replace Section no longer caps the range at 60 seconds. The API limits it to half the original track, which the node cannot know, so the upper bound is left to the API.

### Changed
- The `continueAt` test now runs the custom-parameter branch and fails if no request is made.

## [1.2.1] - 2026-11-01

### Fixed
- Generate, Extend, Upload and Cover, Upload and Extend, Mashup, Add Vocals and Add Instrumental run with only their required fields set. Previously the optional Style Weight, Weirdness Constraint and Audio Weight were read with an undefined fallback, so n8n stopped with "Could not get parameter" before any request.
- Extend and Upload and Extend no longer send `continueAt: 0`. The API requires a value greater than 0, so the 0 default now means not set.
- Replace Section requires at least 10 seconds, as the API does. Previously 6 to 9 second ranges passed locally and failed upstream.
- Saving the credential fails for an invalid key. Suno answers HTTP 200 with code 401 in the body, previously that passed the test.
- Body code 405 (rate limit) is retried like 430.
- Retry-After is read from the HTTP response n8n wraps in the error. Previously it was read from a property that does not exist, so the server's wait was ignored.
- Token-like strings in upstream error messages are masked in both the message and the description.

### Changed
- The publish workflow only publishes a tag whose commit is on main.
- README states the URL check precisely. It rejects URLs written as local or private addresses, it does not resolve DNS.

## [1.2.0] - 2026-11-01

### Fixed
- Paid generations are never submitted twice. Previously every POST was retried on a gateway timeout or network error, so a request Suno had already accepted could start and bill a second task. Now writes retry only when Suno rejects them for request frequency (code 430). Reads still retry on 502, 503 and 504.
- Insufficient credits (code 429) is no longer retried. Previously it was retried three times with backoff before failing, which could never succeed.
- Get Credits returns `{ "credits": 100 }`. Previously the documented integer response was emitted as a bare number, which is not valid n8n item JSON. Any other non-object `data` is now wrapped as `{ "data": value }`.
- Upload Stream sends a real multipart body with the file in a binary part named `file`. Previously the file was sent as a nested object that the HTTP client serialized as `file[value]` fields, which the upload API rejects.
- Replace Section sends `fullLyrics`. Previously the node had no field for it, so every request was missing a parameter the API requires. A required Full Lyrics field is added for the complete song lyrics after the change.
- Add Vocals no longer requires a prompt. The API documents it as optional, previously the node blocked prompt-free requests. An empty prompt is now left out of the request.
- API errors carry the failing item index. Previously the index was dropped because the error was passed back through its own constructor, so the 1.1.0 changelog claim did not hold.
- Private address blocking covers bracketed IPv6. Previously `[fc00::]`, `[fe80::]`, `[::]` and IPv4-mapped loopback such as `[::ffff:127.0.0.1]` passed, now they are rejected along with carrier-grade NAT (100.64.0.0/10), multicast and `*.localhost`.
- `Suno.node.json` ships in the package. Previously the build copied only icons, so the node's category and documentation metadata never reached n8n.

### Changed
- The publish workflow runs build, typecheck, lint, tests, the README match and the metadata check before publishing. Previously it ran only tests, so a tag could publish what CI would reject.
- Retry behavior is tested with real mocked requests. Previously the retry tests only checked error message strings.

## [1.1.0] - 2026-11-01

### Changed
- Passes n8n's community package verification scanner with zero findings. Previously the published package failed 26 checks, now it is ready for n8n verification and n8n Cloud.
- License is now MIT for the package and the repository. Previously the package used FUCL and the repository root used ORL 1.0, which n8n verification does not accept.
- Every output item now carries pairedItem. Previously item linking was lost on success, so downstream nodes could not trace a result back to its input.
- Errors are now NodeApiError or NodeOperationError with the item index. Previously some errors were rethrown raw and lost their context in the n8n UI.
- Retry delays use the n8n sleep helper. Previously they used setTimeout directly, which n8n Cloud does not allow.
- Node and credential icons are SVG with light and dark variants. Previously the node used a PNG and the credential had no icon.
- Codex categories are Marketing & Content and Miscellaneous. Previously the node used the AI category, which community nodes cannot use.
- Operation lists are sorted alphabetically and four time fields use title case. Operation values, parameter names and API routes are unchanged, so existing workflows keep working.
- Vocal Gender now offers an explicit No Preference option. Previously the empty default was not a listed option, the behaviour is unchanged and no gender is sent.
- Dev toolchain upgraded to n8n-workflow 2.16, TypeScript 6, Jest 30 and the n8n verification ESLint rules. gulp was replaced by a small icon copy script.
- README rewritten to the project standard with install steps, the full operations table and the release flow.

### Added
- Tests for the execute loop covering pairedItem and error wrapping.
- CI runs lint and checks that the root and package READMEs match.

## [1.0.2] - 2026-10-31

### Changed
- Published from the public GitHub repository with a signed npm provenance statement. Previously releases were published by hand with no provenance, now each release is built and signed in GitHub Actions and links to its exact source commit.
- Package ownership moved to the npm user nex8n. Previously the package was maintained under a different npm account, the package name and install path are unchanged.
- package.json now carries the repository and bugs fields. Previously they were empty, which npm requires for provenance.

## [1.0.1]
- Homepage set to next8n.com.

## [1.0.0]
- Initial release with full Suno AI Music Generation API coverage.
