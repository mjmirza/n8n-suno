<p align="center">
  <img src="https://unpkg.com/n8n-nodes-suno@latest/dist/nodes/Suno/suno.png" alt="Suno" width="80" />
</p>

<h1 align="center">n8n-nodes-suno</h1>

<p align="center">
  <strong>The most comprehensive n8n community node for Suno AI Music Generation</strong><br/>
  Built, maintained, and owned by <a href="https://next8n.com">next8n</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/n8n-nodes-suno"><img src="https://img.shields.io/npm/v/n8n-nodes-suno?style=for-the-badge&color=CB3837&label=npm" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/n8n-nodes-suno"><img src="https://img.shields.io/npm/dt/n8n-nodes-suno?style=for-the-badge&color=blue&label=downloads" alt="npm downloads" /></a>
  <a href="#license"><img src="https://img.shields.io/badge/license-FUCL-orange?style=for-the-badge" alt="License" /></a>
  <img src="https://img.shields.io/badge/Suno-AI_Music-000000?style=for-the-badge" alt="Suno AI" />
  <img src="https://img.shields.io/badge/n8n-Community_Node-FF6D5A?style=for-the-badge" alt="n8n Community Node" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/AI_Agent-Compatible-10A37F?style=for-the-badge" alt="AI Agent Compatible" />
  <img src="https://img.shields.io/badge/Resources-11-success?style=for-the-badge" alt="11 Resources" />
  <img src="https://img.shields.io/badge/Operations-24-success?style=for-the-badge" alt="24 Operations" />
  <img src="https://img.shields.io/badge/Endpoints-28-success?style=for-the-badge" alt="28 Endpoints" />
  <img src="https://img.shields.io/badge/Tests-489_Passing-brightgreen?style=for-the-badge" alt="489 Tests" />
  <img src="https://img.shields.io/badge/API_Audit-Verified-brightgreen?style=for-the-badge" alt="API Audit Verified" />
  <img src="https://img.shields.io/badge/SSRF-Protected-brightgreen?style=for-the-badge" alt="SSRF Protected" />
  <img src="https://img.shields.io/badge/Security-Hardened-brightgreen?style=for-the-badge" alt="Security Hardened" />
  <img src="https://img.shields.io/badge/Maintained-Active-brightgreen?style=for-the-badge" alt="Actively Maintained" />
</p>

<p align="center">
  <img src="https://unpkg.com/n8n-nodes-suno@latest/suno-banner.jpeg" alt="Suno AI Music Generation" width="100%" />
</p>

---

## We automate AI music workflows. For a living.

We have successfully delivered AI-powered automation for numerous clients across **music production**, **content creation**, **media agencies**, and **SaaS platforms**. From prompt-to-publish pipelines to full music generation factories - we build production-ready workflows that run 24/7.

**This node exists because we needed it for real client projects. We built it from the official Suno API documentation, we maintain it, and we own the intellectual property.**

If you're using Suno AI and looking to automate your music generation workflows - AI music creation, lyrics generation, audio processing, vocal separation, video generation - we've done it before and would be happy to do it for you.

<p align="center">
  <a href="https://services.next8n.com"><img src="https://img.shields.io/badge/Book_a_Free_Consultation-services.next8n.com-FF6D5A?style=for-the-badge&logoColor=white" alt="Book a consultation" /></a>
</p>

<p align="center">
  <a href="https://next8n.com"><strong>next8n.com</strong></a> &nbsp;|&nbsp; <a href="https://services.next8n.com"><strong>Schedule a call</strong></a>
</p>

---

## What you get

| Node | Type | What it does |
|------|------|-------------|
| **Suno** | Action Node | Full coverage across 11 resources with 24 operations covering all 28 Suno API endpoints - music generation, lyrics, audio processing, vocal separation, MIDI, video, file upload, and more |

**AI Agent ready** - Works with `usableAsTool: true`, so you can plug it directly into n8n AI Agent workflows for intelligent music automation.

---

## Complete API Coverage (28 Endpoints)

### Music Generation (6 operations)
| Operation | Endpoint | Description |
|-----------|----------|-------------|
| Generate Music | `POST /api/v1/generate` | Generate AI music from prompt with V4/V4.5/V5 models |
| Extend Music | `POST /api/v1/generate/extend` | Continue existing tracks from a timestamp |
| Upload & Cover | `POST /api/v1/generate/upload-cover` | Create new music based on uploaded audio |
| Upload & Extend | `POST /api/v1/generate/upload-extend` | Extend music from uploaded audio |
| Mashup | `POST /api/v1/generate/mashup` | Blend two audio tracks into a mashup |
| Replace Section | `POST /api/v1/generate/replace-section` | Replace a segment of an existing track |

### Vocals (2 operations)
| Operation | Endpoint | Description |
|-----------|----------|-------------|
| Add Vocals | `POST /api/v1/generate/add-vocals` | Add vocal layers to instrumental tracks |
| Add Instrumental | `POST /api/v1/generate/add-instrumental` | Add instrumental accompaniment to vocals |

### Lyrics (2 operations)
| Operation | Endpoint | Description |
|-----------|----------|-------------|
| Generate Lyrics | `POST /api/v1/lyrics` | AI-powered lyrics generation from prompt |
| Get Timestamped Lyrics | `POST /api/v1/generate/get-timestamped-lyrics` | Word-level timing data with waveform |

### Audio Processing (6 operations)
| Operation | Endpoint | Description |
|-----------|----------|-------------|
| Separate Vocals | `POST /api/v1/vocal-removal/generate` | Split into 2 stems or 12 stems |
| Convert to WAV | `POST /api/v1/wav/generate` | Lossless WAV conversion |
| Generate MIDI | `POST /api/v1/midi/generate` | Per-instrument MIDI note data |
| Create Music Video | `POST /api/v1/mp4/generate` | MP4 with synced visualizations |
| Boost Style | `POST /api/v1/style/generate` | Enhance music style descriptions |
| Generate Cover Image | `POST /api/v1/suno/cover/generate` | AI cover artwork (2 variations) |

### Persona (1 operation)
| Operation | Endpoint | Description |
|-----------|----------|-------------|
| Generate Persona | `POST /api/v1/generate/generate-persona` | Create reusable music personas |

### Task Details (7 operations)
| Operation | Endpoint | Description |
|-----------|----------|-------------|
| Get Music Details | `GET /api/v1/generate/record-info` | Poll music generation status |
| Get Lyrics Details | `GET /api/v1/lyrics/record-info` | Poll lyrics generation status |
| Get WAV Details | `GET /api/v1/wav/record-info` | Poll WAV conversion status |
| Get Vocal Separation Details | `GET /api/v1/vocal-removal/record-info` | Poll separation status + stem URLs |
| Get Video Details | `GET /api/v1/mp4/record-info` | Poll video generation status |
| Get MIDI Details | `GET /api/v1/midi/record-info` | Poll MIDI generation + note data |
| Get Cover Details | `GET /api/v1/suno/cover/record-info` | Poll cover image status |

### Account (1 operation)
| Operation | Endpoint | Description |
|-----------|----------|-------------|
| Get Credits | `GET /api/v1/generate/credit` | Check remaining API credits |

### File Upload (3 operations)
| Operation | Endpoint | Description |
|-----------|----------|-------------|
| Upload Base64 | `POST /api/file-base64-upload` | Upload via base64 encoding |
| Upload Stream | `POST /api/file-stream-upload` | Upload via binary stream |
| Upload URL | `POST /api/file-url-upload` | Upload from remote URL |

---

## AI Model Support

| Model | Max Duration | Description |
|-------|-------------|-------------|
| **V5** | 8 min | Superior musical expression, fastest generation |
| **V4.5 Plus** | 8 min | Richer sound, new creation methods |
| **V4.5 All** | 8 min | Better song structure |
| **V4.5** | 8 min | Superior genre blending, faster output |
| **V4** | 4 min | Best audio quality, refined structure |

---

## Enterprise Security

| Protection | Implementation |
|-----------|---------------|
| **SSRF Prevention** | All URL fields (callback, upload, file) validated against private IPs, localhost, IPv6 private ranges. HTTPS-only enforcement. |
| **ID Injection** | All task/audio IDs validated with `assertSafeId` - alphanumeric + hyphens only, path traversal blocked |
| **Input Validation** | Model-dependent length limits on prompt (500-5000), style (200-1000), title (80-100). Weight fields bounded 0.00-1.00. |
| **Error Safety** | Error messages truncated to 1000 chars, raw user input never echoed, API keys never logged |
| **Rate Limiting** | 429/430 codes trigger automatic retry with exponential backoff + jitter |
| **Request Timeout** | 30-second timeout on all API calls |
| **Path Sanitization** | Percent-decoded traversal detection, safe character allowlist |

---

## 489 Tests Passing

| Test Suite | Tests | Coverage |
|-----------|-------|---------|
| Transport Layer | 80 | SSRF, retry, error parsing, ID validation |
| Validators | 58 | Model-dependent limits, weights, durations |
| Phase 1 Handlers | 25 | Music generation, vocals, lyrics |
| Phase 2 Handlers | 16 | Vocal separation, conversion, style boost, cover |
| Phase 3 Handlers | 18 | Task details, credits, file upload, persona |
| Security | 269 | ID injection, SSRF vectors, error leakage |
| Error Handling | 27 | All 14 Suno error codes mapped correctly |
| Compliance | 21 | HTTPS enforcement, protocol rejection, OWASP |

---

## Installation

### From n8n (Recommended)
1. Go to **Settings > Community Nodes**
2. Enter `n8n-nodes-suno`
3. Click **Install**

### Manual
```bash
cd ~/.n8n/nodes
npm install n8n-nodes-suno
```

---

## Quick Setup

1. Install the node in n8n
2. Get your API key from the [Suno API Key Management Page](https://sunoapi.org/api-key)
3. Add **Suno API** credentials in n8n with your API key
4. Start building music generation workflows

---

## Why this node?

- **Complete API coverage** - all 28 endpoints, every single field, zero gaps
- **Enterprise security** - SSRF protection, ID injection prevention, input validation, error safety
- **489 tests** with security, compliance, and handler coverage
- **AI Agent compatible** - `usableAsTool: true` for n8n AI Agent workflows
- **Full TypeScript** with strict typing
- **Model-aware validation** - prompt/style/title limits enforced per AI model version
- **Dual base URL** support - API and file upload endpoints handled transparently
- **Production-tested** - used in real client automation workflows
- **Actively maintained** by the team that built it

---

## Need more than a node?

This community node covers the complete Suno API. But if you need:

- **Custom workflow design** - prompt-to-publish, batch music generation, content pipelines
- **Suno + other AI tools** integration (Eleven Labs, OpenAI, Midjourney)
- **AI-powered** content factories, music-on-demand platforms, automated publishing
- **Advanced integrations** - CMS publishing, social media distribution, analytics
- **Ongoing maintenance** and monitoring of your automation

We've delivered all of this for our clients and would be happy to discuss your specific requirements.

<p align="center">
  <a href="https://services.next8n.com"><img src="https://img.shields.io/badge/Book_a_Free_Consultation-services.next8n.com-FF6D5A?style=for-the-badge&logoColor=white" alt="Book a consultation" /></a>
</p>

---

## License

**Fair Use Code License (FUCL)**

Copyright (c) 2026 Mirza Iqbal / [next8n](https://next8n.com). All rights reserved.

This node is published as an n8n community node for the benefit of the Suno AI + n8n ecosystem. However, the intellectual property, source code, and all associated rights are owned exclusively by the copyright holder.

**Permitted:**
- Install and use this node for your own internal workflows and business automation

**Prohibited without explicit written consent:**
- Copying, forking, or reproducing the source code in any form
- Commercial redistribution, resale, sublicensing, or white-labeling
- Creating derivative works or competing products based on this code
- Public redistribution of modified or unmodified versions
- Using the Software as part of a commercial service offering
- Removing or altering copyright notices or attribution

**Attribution:** This node was developed and is actively maintained by [next8n](https://next8n.com). Attribution must be preserved in all copies.

This software is provided "as is", without warranty of any kind, express or implied.

**We built this code for the community. We reserve the rights to our code only -- not to any names, logos, or trademarks.**

**Trademark & legal notice:** "Suno" and the Suno logo are trademarks of Suno, Inc. We do not claim ownership of the Suno brand, name, or logo. This community node is not affiliated with, endorsed by, or sponsored by Suno, Inc. All trademarks, service marks, trade names, and logos referenced herein belong to their respective owners. This node was developed independently as a community contribution, using publicly available API documentation, for the sole purpose of enabling interoperability between n8n and the Suno API -- as permitted under EU Directive 2009/24/EC (Software Directive, Article 6) and applicable law. No Suno proprietary code is included; all interactions use publicly documented REST API endpoints. This is an original, independently authored work; the source code of this integration node is the intellectual property of the copyright holder, and is the only thing covered by the FUCL license above. The use of third-party APIs for interoperability purposes does not constitute infringement under EU or international law (see also Google LLC v. Oracle America, Inc., 593 U.S. 1 (2021) on API fair use).

Interested in collaborating or contributing? We're open to partnerships. Let's talk.

For commercial licensing, partnership, or custom development: [services.next8n.com](https://services.next8n.com)
