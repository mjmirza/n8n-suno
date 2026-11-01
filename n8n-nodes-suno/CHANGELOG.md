# Changelog

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
