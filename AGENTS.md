# AGENTS.md

Guide for AI coding agents working in this repository.

## Layout

- The n8n package lives in `n8n-nodes-suno/`. Run every npm command from there.
- `README.md` at the root and `n8n-nodes-suno/README.md` must stay identical. CI fails if they differ.

## Before you open a pull request

- Use Node.js 22 or 24. `n8n-workflow` 2.x needs a native module that does not build on newer Node.js.
- `npm run build`, `npm run typecheck`, `npm run lint` and `npm test` must all pass with zero warnings.
- `npm run lint` uses the same rules as n8n's verification scanner. Fix findings, never disable rules.
- Never change an operation `value`, a parameter `name` or a request route. Existing workflows depend on them.
- Every item returned from `execute` carries `pairedItem`. Errors are thrown as `NodeApiError` or `NodeOperationError`.
- Keep runtime dependencies at zero.

## License

MIT. See `LICENSE`.
