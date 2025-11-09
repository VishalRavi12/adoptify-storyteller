# Adoptify Storyteller

Turn a single pet photo and short bio into a share‑ready adoption campaign. The React/Vite frontend collects the pet details, while a lightweight Express backend calls OpenAI’s video API (Sora) plus a text model to produce:

- A vertical MP4 clip narrated from the dog’s perspective
- Viral captions tailored for Instagram, TikTok, and Facebook
- SEO‑friendly “Smart Hashtags”

## Prerequisites

1. **Node.js 18+** (the repo currently runs with Node 25.1.0)
2. **An OpenAI API key** with access to `sora-2` and a text model (defaults to `gpt-4o-mini`)

## Configure environment

Use the sample file and insert your own key(s):

```bash
cp .env.example .env
# edit the file:
#   OPENAI_API_KEY=sk-...
#   OPENAI_VIDEO_MODEL=sora-2     # optional overrides
#   OPENAI_TEXT_MODEL=gpt-4o-mini
```

`CLIENT_ORIGIN` should match the port Vite runs on (`http://localhost:8080` by default) so the backend’s CORS check succeeds.

## Install & run

```bash
npm install

# terminal 1: backend (Express + OpenAI proxy)
npm run server   # http://localhost:4000

# terminal 2: frontend
npm run dev      # http://localhost:8080
```

## Optional: generate from the CLI

A helper script mirrors the backend workflow. Provide the pet inputs and it will submit/poll/download the resulting MP4:

```bash
pip install requests
python scripts/run_openai_video.py \
  --pet-name "Luna" \
  --pet-bio "Playful retriever who adores kids."
```

## API overview

The Express server exposes two routes:

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/generate-video` | Validates the payload, submits an OpenAI video job, polls until completion, and returns `{ videoUrl, captions, hashtags, ... }`. |
| `GET` | `/api/video/:id/content` | Streams the rendered MP4 back to the browser (proxies OpenAI’s download endpoint). |

The frontend consumes `requestVideoGeneration` from `src/lib/api.ts`, then renders the video alongside the generated captions/hashtags inside `src/pages/Composer.tsx`.

## Troubleshooting

- **“Incorrect API key provided”** – update `OPENAI_API_KEY` in `.env`, restart `npm run server`.
- **“Organization must be verified”** – finish OpenAI’s organization verification before using Sora.
- **“Billing hard limit has been reached”** – add credits or request higher limits inside the OpenAI dashboard.
- **Captions/hashtags missing** – the backend now falls back to heuristics if the text model fails, but check the server logs for `[openai-text]` warnings.

Happy building! 🐾
