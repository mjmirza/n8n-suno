<p align="center">
  <img src="https://raw.githubusercontent.com/mjmirza/n8n-suno/main/n8n-nodes-suno/nodes/Suno/suno.png" alt="Suno node icon" width="80" />
</p>

# n8n-nodes-suno

Generate music, lyrics, stems, MIDI and music videos with Suno AI, straight from your n8n workflows.

[![npm version](https://img.shields.io/npm/v/n8n-nodes-suno?label=npm)](https://www.npmjs.com/package/n8n-nodes-suno)
[![npm downloads](https://img.shields.io/npm/dm/n8n-nodes-suno)](https://www.npmjs.com/package/n8n-nodes-suno)
[![CI](https://img.shields.io/github/actions/workflow/status/mjmirza/n8n-suno/ci.yml?branch=main&label=CI)](https://github.com/mjmirza/n8n-suno/actions/workflows/ci.yml)
[![License MIT](https://img.shields.io/badge/license-MIT-green)](https://github.com/mjmirza/n8n-suno/blob/main/LICENSE)
[![npm provenance](https://img.shields.io/badge/npm-signed%20provenance-blue)](https://www.npmjs.com/package/n8n-nodes-suno#provenance)

<p align="center">
  <img src="https://raw.githubusercontent.com/mjmirza/n8n-suno/main/n8n-nodes-suno/suno-banner.jpeg" alt="Suno AI music generation in n8n" width="100%" />
</p>

## What is this?

An n8n community node for the [Suno API](https://sunoapi.org). It turns a text prompt into a finished song inside an automation, so you can create, extend, split and convert music without leaving n8n. It is built for creators, agencies and product teams who want music generation as one step in a larger workflow.

## What you get

- **A song from a prompt in one workflow step.** No copying files between the Suno site and your other tools.
- **Every Suno operation in one node.** 28 operations across music, vocals, lyrics, stems, WAV, MIDI, video, cover art, personas, uploads and credits.
- **Results that land where you need them.** Every output stays linked to the input item that produced it, so downstream nodes always know which song belongs to which row.
- **Fewer failed runs.** Rate limits and temporary Suno outages are retried automatically with backoff, and real errors show a clear message in n8n.
- **Safe by default.** Only HTTPS URLs are accepted, private network addresses are blocked, and your API key is never echoed in errors.
- **Works with the AI Agent node.** The node is usable as a tool, so an agent can generate music on request.
- **Verifiable releases.** Every version is built in GitHub Actions and published with a signed npm provenance statement that links it to its exact source commit.

## From install to your first song

1. In n8n open **Settings > Community Nodes**, select **Install**, enter `n8n-nodes-suno` and confirm.
2. Get an API key on the [Suno API key page](https://sunoapi.org/api-key).
3. In n8n create a new **Suno API** credential and paste the key. n8n tests it against your credit balance, so a wrong key shows up immediately.
4. Add a **Suno** node to a workflow, pick **Account > Credit > Get Credits** and run it. You see your remaining credits.
5. Switch to **Music Generation > Generate Music**, write a prompt and run it. The node returns the task ID, and **Task Details > Get Music Details** returns the finished audio URLs.

## Operations

| Resource | Operation | What it does |
|---|---|---|
| Music Generation | Extend Music | Extend an existing music track |
| Music Generation | Generate Mashup | Generate a mashup from two audio tracks |
| Music Generation | Generate Music | Generate a new music track from a prompt |
| Music Generation | Replace Section | Replace a section of an existing track |
| Music Generation | Upload and Cover Audio | Upload audio and generate a cover version |
| Music Generation | Upload and Extend Audio | Upload audio and extend it with AI |
| Vocals | Add Vocals | Add vocals to an uploaded audio file |
| Vocals | Add Instrumental | Add instrumental to an uploaded audio file |
| Lyrics | Generate Lyrics | Generate lyrics from a text prompt |
| Lyrics | Get Timestamped Lyrics | Retrieve timestamped lyrics for an existing track |
| Vocal Separation | Generate | Separate vocals and instruments into stems |
| Audio Conversion | Convert WAV | Convert audio to WAV format |
| Audio Conversion | Generate MIDI | Generate a MIDI file from audio |
| Audio Conversion | Generate Video | Generate a music video (MP4) from audio |
| Style Boost | Generate | Enhance a music style description |
| Cover Image | Generate | Generate cover artwork for a track |
| Task Details | Get Cover Details | Get details of a cover generation task |
| Task Details | Get Lyrics Details | Get details of a lyrics generation task |
| Task Details | Get MIDI Details | Get details of a MIDI generation task |
| Task Details | Get Music Details | Get details of a music generation task |
| Task Details | Get Video Details | Get details of a video generation task |
| Task Details | Get Vocal Separation Details | Get details of a vocal separation task |
| Task Details | Get WAV Details | Get details of a WAV conversion task |
| Credit | Get Credits | Get remaining API credits |
| File Upload | Upload Base64 | Upload a file using base64-encoded data |
| File Upload | Upload Stream | Upload a file from a binary property (multipart/form-data) |
| File Upload | Upload URL | Upload a file from an HTTPS URL |
| Persona | Generate Persona | Create a reusable persona from a completed music generation |

The Category selector at the top of the node groups these resources as Music Generation, Lyrics, Audio Processing, Status & Details, Account and File Upload.

## Credentials

The node uses one credential, **Suno API**.

- Create the key on the [Suno API key page](https://sunoapi.org/api-key).
- The key is sent as a Bearer token and stored encrypted by n8n.
- The credential test calls the credit endpoint, so saving the credential proves the key works.

## Compatibility

- n8n 1.x and 2.x, community nodes API version 1.
- Self-hosted n8n today. n8n Cloud once the package is verified by n8n.
- No runtime dependencies. The package only uses the n8n workflow API.
- Built and tested against `n8n-workflow` 2.16 on Node.js 22 and 24.

## Technical overview

| Area | Choice |
|---|---|
| Language | TypeScript, strict mode |
| Runtime API | `n8n-workflow` (peer dependency, provided by n8n) |
| HTTP | `httpRequestWithAuthentication` with retry, backoff and jitter |
| Tests | Jest with ts-jest |
| Lint | The same ESLint rules as n8n's verification scanner |
| Release | Tag `vX.Y.Z` on `main`, GitHub Actions publishes to npm with provenance |

Each resource follows the same three file pattern. `*.operations.ts` defines the operation list, `*.fields.ts` defines the parameters and `*.handler.ts` validates input and calls the API.

### Project structure

```
n8n-nodes-suno/
├── credentials/SunoApi.credentials.ts   Bearer auth and credential test
├── nodes/Suno/
│   ├── Suno.node.ts                     Node definition and execute loop
│   ├── Suno.node.json                   n8n codex metadata
│   ├── suno.svg, suno.dark.svg          Light and dark node icons
│   ├── transport.ts                     HTTP client, retry, URL and ID validation
│   ├── utils/                           Shared field builders and validators
│   └── resources/                       One folder per Suno resource
├── scripts/copy-icons.mjs               Copies icons into dist
└── tests/                               Jest suites
```

### Build, test and lint

```bash
cd n8n-nodes-suno
npm ci
npm run build       # tsc and icon copy
npm run typecheck
npm run lint        # n8n verification rules
npm test
```

Node.js 22 or 24 is required for development, because `n8n-workflow` 2.x pulls in a native module that does not build on newer Node.js yet.

### Release flow

1. Merge the change to `main` through a reviewed pull request with green CI.
2. Bump `version` in `package.json` and add a `CHANGELOG.md` entry.
3. Push a tag `vX.Y.Z` that matches the version.
4. The Publish workflow runs the tests and publishes to npm with `--provenance`.

## Support

- Email support@next8n.com
- Bugs and feature requests go to [GitHub issues](https://github.com/mjmirza/n8n-suno/issues).
- Need a full music automation built for you? Visit [next8n.com](https://next8n.com).

## License

[MIT](https://github.com/mjmirza/n8n-suno/blob/main/LICENSE). Copyright (c) 2026 Mirza Iqbal.

Suno is a trademark of its owner. This project is independent and is not affiliated with or endorsed by Suno.
