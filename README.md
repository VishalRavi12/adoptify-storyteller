# Adoptify Storyteller

Turn a single pet photo and short bio into a share‑ready adoption campaign. The React/Vite frontend collects the pet details, while a lightweight Express backend calls OpenAI’s Sora API **or** Google’s Gemini Veo preview models (plus a text model) to produce:

- A vertical MP4 clip narrated from the dog’s perspective
- Viral captions tailored for Instagram, TikTok, and Facebook
- SEO‑friendly “Smart Hashtags”

## Prerequisites

1. **Node.js 18+** (the repo currently runs with Node 25.1.0)
2. **An OpenAI API key** with access to `sora-2` and a text model (defaults to `gpt-4o-mini`)
3. *(Optional but recommended)* **A Google AI Studio (Gemini) API key** with access to the Veo preview + a text model (`gemini-1.5-flash`). This unlocks the Gemini provider toggle in the Composer.

## Configure environment

Use the sample file and insert your own key(s):

```bash
cp .env.example .env
# edit the file:
#   OPENAI_API_KEY=sk-...
#   OPENAI_VIDEO_MODEL=sora-2     # optional overrides
#   OPENAI_TEXT_MODEL=gpt-4o-mini
#   GEMINI_API_KEY=...
#   GEMINI_VIDEO_MODEL=veo-3.1-generate-preview
#   GEMINI_TEXT_MODEL=gemini-1.5-flash
```

`CLIENT_ORIGIN` should match the port Vite runs on (`http://localhost:8080` by default) so the backend’s CORS check succeeds.

If you plan to let users pick Gemini inside the Composer, also set the (mirroring) Gemini environment vars from `.env.example`. You can override Veo duration, aspect ratio, and polling cadence the same way you can for OpenAI.

## Install & run

```bash
npm install

# terminal 1: backend (Express + OpenAI proxy)
npm run server   # http://localhost:4000

# terminal 2: frontend
npm run dev      # http://localhost:8080
```

## Deploy to Netlify

1. Install & authenticate the CLI (optional but handy locally):

   ```bash
   npm install -g netlify-cli
   netlify login
   ```

2. Create a new site (once per project):

   ```bash
   netlify init
   ```

3. In the Netlify UI (or via `netlify env:set`) add the environment variables you already use locally:

   - `OPENAI_API_KEY`, `OPENAI_*`
   - `GEMINI_API_KEY`, `GEMINI_*`
   - `VITE_API_BASE_URL` → leave blank (or set to `/api`) so the built app hits the same-origin Functions proxy.

4. Deploy (this runs `npm run build`, uploads `dist/`, and bundles the Express app as `/.netlify/functions/server`):

   ```bash
   netlify deploy --build      # preview
   netlify deploy --prod       # production
   ```

During local Netlify development you can run `netlify dev` (which reads `netlify.toml`) so that Vite, the Express serverless function, and the redirect to `/api/*` run together.

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
| `POST` | `/api/generate-video` | Validates the payload, looks at the optional `provider` (`openai` default, `gemini` optional), submits the matching job, polls until completion, and returns `{ provider, videoUrl, captions, hashtags, ... }`. |
| `GET` | `/api/video/:id/content` | Streams the rendered MP4 back to the browser (proxies OpenAI’s download endpoint). |
| `GET` | `/api/providers/gemini/video?token=...` | Internal proxy the frontend uses to stream Gemini/Veo assets without exposing your API key. |

### Switching providers

The Composer now ships with an “AI Provider” radio group. Pick OpenAI Sora for the highest-fidelity beta clips, or Gemini Veo for faster, stylized previews. That selection is sent as `provider` in the `requestVideoGeneration` payload, so you can also toggle it via API clients.

The frontend consumes `requestVideoGeneration` from `src/lib/api.ts`, then renders the video alongside the generated captions/hashtags inside `src/pages/Composer.tsx`.

## Troubleshooting

- **“Incorrect API key provided”** – update `OPENAI_API_KEY` in `.env`, restart `npm run server`.
- **“Organization must be verified”** – finish OpenAI’s organization verification before using Sora.
- **“Billing hard limit has been reached”** – add credits or request higher limits inside the OpenAI dashboard.
- **Captions/hashtags missing** – the backend now falls back to heuristics if the text model fails, but check the server logs for `[openai-text]` warnings.

Happy building! 🐾
