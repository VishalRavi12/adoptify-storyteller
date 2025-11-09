# Adoptify Storyteller

Adoptify turns a single pet photo + short bio into a campaign-ready set of creative assets: hooks, captions, storyboard, voiceover, rendered video, suggested domains, and a proof-of-adoption mint. The frontend (Vite + React + Tailwind) is already wired up. This repo now includes a FastAPI backend that coordinates all of the AI and infra tracks you outlined for the hackathon.

## Recommended stack (as pitched to judges)

- **Frontend**: React + Vite + Tailwind, React Video Editor, Zustand, shadcn/ui
- **Auth**: Auth0 (roles: Staff, Volunteer; MFA optional)
- **AI**: OpenRouter (LLM text), Gemini API (multimodal storyboard), ElevenLabs (narration), Whisper/Workers AI (optional STT)
- **Media**: OpenCV + FFmpeg (renders), Cloudflare R2 (storage), Cloudflare Images (thumbs)
- **Backend**: FastAPI, async workers (Celery/RQ optional), Postgres (Supabase/Neon)
- **Infra**: Cloudflare Workers (edge), DO Gradient or Vultr GPUs for heavier inference, Railway/Fly.io for the API
- **Web3**: Solana badge mint via Cloudflare Worker + RPC provider
- **Observability**: Sentry, Cloudflare Analytics, `/healthz`

## Backend folder structure

```
server/
├─ app/
│  ├─ config.py         # pydantic settings + provider flags
│  ├─ main.py           # FastAPI factory + routers
│  ├─ schemas.py        # Request/response contracts
│  ├─ services/         # Provider clients (OpenRouter, Gemini, ElevenLabs, R2, renderer, Solana)
│  └─ routes/           # REST endpoints (/ingest, /story, /voiceover, /render, /domains, /auth, /solana)
├─ main.py              # uvicorn entry point
└─ requirements.txt
```

Each service module degrades gracefully: when `MOCK_MODE=true` (or the provider key is missing) the API returns synthetic data so the frontend keeps working offline.

## Environment variables

Create `server/.env` (or export vars) with the keys you have available:

```
OPENROUTER_API_KEY=...
GEMINI_API_KEY=...
ELEVEN_API_KEY=...
MEDIA_BUCKET=adoptify-media
MEDIA_ACCESS_KEY=...
MEDIA_SECRET_KEY=...
MEDIA_ENDPOINT=https://<account>.r2.cloudflarestorage.com
MEDIA_BASE_URL=https://cdn.adoptify.pet
SOLANA_WORKER_URL=https://worker.example.workers.dev/mint
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
AUTH0_DOMAIN=...
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...
MOCK_MODE=false
```

Unset any provider to fall back to mock mode for just that integration.

## Running the backend locally

```bash
cd server
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API mounts under `/api`. Pair it with the frontend dev server via `VITE_API_BASE=http://localhost:8000/api`.

## Key endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Health probe for Cloudflare Worker/Sentry |
| `POST` | `/api/ingest` | Accepts `multipart/form-data` image upload → stores to R2/local tmp |
| `POST` | `/api/story` | Calls multiple OpenRouter models, benchmarks latency/cost, returns best script, hooks, hashtags + Gemini storyboard |
| `POST` | `/api/voiceover` | Sends script to ElevenLabs (or mock) and stores resulting MP3 |
| `POST` | `/api/render` | Uses OpenCV + FFmpeg to create a vertical slideshow video, optionally muxing the ElevenLabs MP3 |
| `POST` | `/api/domains/suggest` | Generates brandable domains (GoDaddy track) with scores/reasons |
| `POST` | `/api/auth/webhook` | Placeholder for Auth0 role provisioning webhooks |
| `POST` | `/api/solana/mint` | Calls a Cloudflare Worker that handles the on-chain mint, returns signature |

## Provider integration notes

- **OpenRouter**: `services/openrouter.py` loops through your preferred models (4o-mini, Claude Haiku, Gemma) and records latency + cost deltas for the judges demo switcher moment.
- **Gemini Flash**: `services/gemini.py` asks for a storyboard + palette, so you can drop the result straight into the React “shot list” UI.
- **ElevenLabs**: `services/elevenlabs.py` supports any voice ID; we default to “Rachel” but you can swap for a cloned shelter spokesperson.
- **Renderer**: `services/renderer.py` keeps things lightweight for the hackathon (OpenCV slideshow + FFmpeg audio mux). Replace with a GPU worker later for more cinematic edits.
- **Cloudflare / R2**: `services/storage.py` is S3-compatible. Point it at R2 or DO Spaces; fallback writes to `/tmp` for local dev.
- **Solana**: `services/solana.py` expects a Worker endpoint that wraps whatever RPC flow you prefer (Helius, Triton, etc.).

## Suggested demo script

1. Auth0 login → Staff role guard.
2. Upload photo + bio → `POST /ingest` (see progress toast).
3. Generate story → show OpenRouter model table + Gemini storyboard.
4. “Add voice” → ElevenLabs returns MP3, highlight cost/time.
5. “Render” → `/render` builds a vertical MP4; autoplay on canvas.
6. Show domain suggestions + GoDaddy CTA.
7. Mark adoption success → `/solana/mint` returns a signature and QR.

## Testing

The backend currently relies on integration testing via providers, but every route can be smoke-tested locally with HTTP clients such as `curl` or Bruno/Postman. Because of the mock mode, you can run `MOCK_MODE=true uvicorn main:app --reload` and hit each endpoint without secrets.
