# Changelog

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
