# n8n-nodes-suno

> The most comprehensive n8n community node for Suno AI Music Generation.
> Built, maintained, and owned by [next8n](https://next8n.com).

---

## Architecture

```
n8n-nodes-suno/
├── credentials/SunoApi.credentials.ts          # Bearer token auth + credential test
├── nodes/Suno/
│   ├── Suno.node.ts                            # Main node: 11 resources, 24 operations
│   ├── Suno.node.json                          # n8n marketplace metadata
│   ├── suno.png                                # Node icon (512x512 Suno favicon)
│   ├── transport.ts                            # HTTP client, retry, SSRF, error mapping
│   ├── utils/
│   │   ├── descriptions.ts                     # Shared field builders, categories
│   │   └── validators.ts                       # Model-dependent length, weight, URL, segment
│   └── resources/                              # 11 resources, 3 files each (33 files)
│       ├── musicGeneration/                    # 6 ops: generate, extend, uploadCover, uploadExtend, mashup, replaceSection
│       ├── vocals/                             # 2 ops: addVocals, addInstrumental
│       ├── lyrics/                             # 2 ops: generate, getTimestamped
│       ├── vocalSeparation/                    # 1 op:  generate (separate_vocal / split_stem)
│       ├── audioConversion/                    # 3 ops: convertWav, generateMidi, generateVideo
│       ├── styleBoost/                         # 1 op:  generate (synchronous)
│       ├── coverImage/                         # 1 op:  generate
│       ├── taskDetails/                        # 7 ops: getMusicDetails...getCoverDetails
│       ├── credit/                             # 1 op:  get
│       ├── fileUpload/                         # 3 ops: uploadBase64, uploadStream, uploadUrl
│       └── persona/                            # 1 op:  generate (synchronous)
└── tests/                                      # 489 tests across 8 suites
    ├── helpers/mockContext.ts
    ├── transport.test.ts                       # 80 tests: SSRF, retry, ID validation
    ├── validators.test.ts                      # 58 tests: model limits, weights, durations
    ├── phase1-handlers.test.ts                 # 25 tests: musicGeneration, vocals, lyrics
    ├── phase2-handlers.test.ts                 # 16 tests: vocalSep, audioConv, style, cover
    ├── phase3-handlers.test.ts                 # 18 tests: taskDetails, credit, fileUpload, persona
    ├── security.test.ts                        # 269 tests: ID injection, SSRF, error leakage
    ├── error-handling.test.ts                  # 27 tests: all 14 Suno error codes
    └── compliance.test.ts                      # 21 tests: HTTPS, protocols, OWASP
```

Each resource follows the **3-file pattern**: `*.operations.ts` (dropdown), `*.fields.ts` (UI params), `*.handler.ts` (API logic + validation).

---

## API Coverage (28/28 Endpoints)

| # | Resource | Operation | Method | Endpoint | Type |
|---|----------|-----------|--------|----------|------|
| 1 | musicGeneration | generate | POST | /api/v1/generate | async |
| 2 | musicGeneration | extend | POST | /api/v1/generate/extend | async |
| 3 | musicGeneration | uploadCover | POST | /api/v1/generate/upload-cover | async |
| 4 | musicGeneration | uploadExtend | POST | /api/v1/generate/upload-extend | async |
| 5 | musicGeneration | mashup | POST | /api/v1/generate/mashup | async |
| 6 | musicGeneration | replaceSection | POST | /api/v1/generate/replace-section | async |
| 7 | vocals | addVocals | POST | /api/v1/generate/add-vocals | async |
| 8 | vocals | addInstrumental | POST | /api/v1/generate/add-instrumental | async |
| 9 | lyrics | generate | POST | /api/v1/lyrics | async |
| 10 | lyrics | getTimestamped | POST | /api/v1/generate/get-timestamped-lyrics | sync |
| 11 | vocalSeparation | generate | POST | /api/v1/vocal-removal/generate | async |
| 12 | audioConversion | convertWav | POST | /api/v1/wav/generate | async |
| 13 | audioConversion | generateMidi | POST | /api/v1/midi/generate | async |
| 14 | audioConversion | generateVideo | POST | /api/v1/mp4/generate | async |
| 15 | styleBoost | generate | POST | /api/v1/style/generate | sync |
| 16 | coverImage | generate | POST | /api/v1/suno/cover/generate | async |
| 17 | persona | generate | POST | /api/v1/generate/generate-persona | sync |
| 18 | taskDetails | getMusicDetails | GET | /api/v1/generate/record-info | sync |
| 19 | taskDetails | getLyricsDetails | GET | /api/v1/lyrics/record-info | sync |
| 20 | taskDetails | getWavDetails | GET | /api/v1/wav/record-info | sync |
| 21 | taskDetails | getVocalSeparationDetails | GET | /api/v1/vocal-removal/record-info | sync |
| 22 | taskDetails | getVideoDetails | GET | /api/v1/mp4/record-info | sync |
| 23 | taskDetails | getMidiDetails | GET | /api/v1/midi/record-info | sync |
| 24 | taskDetails | getCoverDetails | GET | /api/v1/suno/cover/record-info | sync |
| 25 | credit | get | GET | /api/v1/generate/credit | sync |
| 26 | fileUpload | uploadBase64 | POST | /api/file-base64-upload | sync |
| 27 | fileUpload | uploadStream | POST | /api/file-stream-upload | sync |
| 28 | fileUpload | uploadUrl | POST | /api/file-url-upload | sync |

---

## Security Matrix

| Vector | Protection | Test Coverage |
|--------|-----------|---------------|
| SSRF | Private IP blocking (10.x, 172.16-31.x, 192.168.x, 127.x, 169.254.x, 0.0.0.0, ::1, fc00::, fe80::), HTTPS-only, localhost blocked | 269 security tests |
| Path Traversal | assertSafeId on all IDs, sanitizeEndpoint with percent-decode, `..` blocked | All handlers tested |
| Input Overflow | Model-dependent max lengths: prompt (500/3000/5000), style (200/1000), title (80/100) | Per-model tests |
| Weight Injection | 0.00-1.00 bounds, NaN/Infinity rejected | Validator tests |
| Credential Leakage | password: true, never in errors, MAX_ERROR_LENGTH=1000 | Compliance tests |
| Rate Limiting | Retry 429/430/502/503/504 with exponential backoff + jitter | Transport tests |

---

## Development

```bash
npm install          # Install dependencies
npm run dev          # Watch mode (tsc --watch)
npm run build        # Build: tsc + gulp icons
npm test             # Run 489 tests
npm run test:coverage # Coverage report (99/97/100/100 thresholds)
npm run format       # Prettier
npm run lint         # ESLint
```

---

## Publishing

```bash
npm run prepublishOnly  # Swap README, build
npm publish             # Publish to npm
npm run postpublish     # Restore dev README
```

---

## License

**Fair Use Code License (FUCL)** - See [LICENSE](./LICENSE)

Copyright (c) 2026 Mirza Iqbal / [next8n](https://next8n.com). All rights reserved.
