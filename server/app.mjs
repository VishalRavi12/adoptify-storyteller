import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { z } from "zod";
import { Readable } from "node:stream";

dotenv.config();

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",").map((origin) => origin.trim())
  : null;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_VIDEO_MODEL = process.env.OPENAI_VIDEO_MODEL || "sora-2";
const OPENAI_VIDEO_SECONDS = process.env.OPENAI_VIDEO_SECONDS || "8";
const OPENAI_VIDEO_SIZE = process.env.OPENAI_VIDEO_SIZE || "720x1280";
const OPENAI_VIDEO_POLL_INTERVAL_MS =
  Number(process.env.OPENAI_VIDEO_POLL_INTERVAL_MS) || 5000;
const OPENAI_VIDEO_TIMEOUT_MS =
  Number(process.env.OPENAI_VIDEO_TIMEOUT_MS) || 240000;
const OPENAI_TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_BASE_URL =
  process.env.GEMINI_API_BASE_URL ||
  "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_VIDEO_MODEL =
  process.env.GEMINI_VIDEO_MODEL || "veo-3.1-generate-preview";
const GEMINI_VIDEO_DURATION_SECONDS =
  Number(process.env.GEMINI_VIDEO_DURATION_SECONDS) || 6;
const GEMINI_VIDEO_ASPECT_RATIO =
  process.env.GEMINI_VIDEO_ASPECT_RATIO || "9:16";
const GEMINI_VIDEO_RESOLUTION =
  process.env.GEMINI_VIDEO_RESOLUTION || "720p";
const GEMINI_VIDEO_POLL_INTERVAL_MS =
  Number(process.env.GEMINI_VIDEO_POLL_INTERVAL_MS) || 5000;
const GEMINI_VIDEO_TIMEOUT_MS =
  Number(process.env.GEMINI_VIDEO_TIMEOUT_MS) || 240000;
const GEMINI_TEXT_MODEL =
  process.env.GEMINI_TEXT_MODEL || "gemini-1.5-flash";

const PROVIDERS = {
  OPENAI: "openai",
  GEMINI: "gemini",
};

const PROVIDER_LABELS = {
  [PROVIDERS.OPENAI]: "OpenAI Video",
  [PROVIDERS.GEMINI]: "Gemini Veo",
};

const DEFAULT_VIDEO_SUCCESS_MESSAGE = "Video generated successfully.";

const ProviderEnum = z.enum([PROVIDERS.OPENAI, PROVIDERS.GEMINI]);

const requestSchema = z.object({
  petName: z.string().min(1, "Please enter the Animal name."),
  petBio: z
    .string()
    .min(
      5,
      "Share at least a couple of details about the Animal personality and story."
    ),
  petImage: z.string().optional(),
  mimeType: z.string().optional(),
  provider: ProviderEnum.optional(),
});

const ensureOpenAIReady = () => {
  if (!OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is missing. Add it to your .env file and restart the server."
    );
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildPrompt = ({ petName, petBio }) =>
  [
    `Create a cinematic, 20-second adoption video for a animal named ${petName}.`,
    "Use a heartfelt POV narration that inspires viewers to adopt.",
    "Include natural lighting, gentle camera movement, and uplifting instrumental music.",
    `Animal bio: ${petBio}`,
  ].join(" ");

const openAIHeaders = () => ({
  Authorization: `Bearer ${OPENAI_API_KEY}`,
});

const SOCIAL_RESPONSE_SCHEMA = {
  name: "social_pack",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      instagram: {type: "string"},
      tiktok: {type: "string"},
      facebook: {type: "string"},
      hashtags: {
        type: "array",
        minItems: 3,
        maxItems: 8,
        items: {type: "string"},
      },
    },
    required: ["instagram", "tiktok", "facebook", "hashtags"],
  },
};

const extractResponseText = (data) => {
  const outputs = data?.output ?? [];
  for (const output of outputs) {
    const content = output?.content ?? [];
    const text = content
      .map((part) => {
        if (typeof part?.json === "object") {
          return JSON.stringify(part.json);
        }
        if (typeof part === "string") return part;
        if (typeof part?.text === "string") return part.text;
        if (typeof part?.content === "string") return part.content;
        if (typeof part?.value === "string") return part.value;
        if (typeof part?.output_text === "string") return part.output_text;
        if (Array.isArray(part?.text)) return part.text.join(" ");
        return "";
      })
      .join("")
      .trim();
    if (text) {
      return text;
    }
  }
  if (Array.isArray(data?.output_text)) {
    return data.output_text.join("").trim();
  }
  if (typeof data?.text === "string") {
    return data.text.trim();
  }
  return "";
};

const buildFallbackSocialPack = ({ petName, petBio }) => {
  const safeBio = petBio.length > 160 ? `${petBio.slice(0, 157)}...` : petBio;
  const dogName = petName || "this pup";
  return {
    captions: {
      instagram: `Meet ${dogName}! ${safeBio} Tap to give this sweetheart a forever home.`,
      tiktok: `${dogName} checking in! ${safeBio} Share to help me find my humans. #AdoptDontShop`,
      facebook: `${dogName} is ready for their forever couch! ${safeBio} Message us if you want to meet this lovable buddy.`,
    },
    hashtags: [
      "#AdoptDontShop",
      "#RescueDog",
      "#ForeverHome",
      "#ShelterDog",
      "#AdoptMe",
    ],
  };
};

const generateOpenAISocialPack = async ({ petName, petBio }) => {
  if (!OPENAI_TEXT_MODEL) {
    return buildFallbackSocialPack({petName, petBio});
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      ...openAIHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_TEXT_MODEL,
      response_format: {
        type: "json_schema",
        json_schema: SOCIAL_RESPONSE_SCHEMA,
      },
      input: `You are an expert social media copywriter for pet adoption campaigns.
Provide heartfelt, platform-optimized captions and trending adoption hashtags.
Keep each caption under 150 words, first-person POV as the animal.
Animal Name: ${petName}
Bio: ${petBio}`,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || "Failed to generate captions.");
  }

  const textBlock = extractResponseText(data);
  if (!textBlock) {
    console.warn("[openai-text] empty response content");
    return buildFallbackSocialPack({petName, petBio});
  }

  let parsed;
  try {
    parsed = JSON.parse(textBlock);
  } catch (error) {
    console.warn("[openai-text] Unable to parse JSON response", error);
    return buildFallbackSocialPack({petName, petBio});
  }

  const captions = {
    instagram: parsed?.instagram,
    tiktok: parsed?.tiktok,
    facebook: parsed?.facebook,
  };
  const hashtags = Array.isArray(parsed?.hashtags)
    ? parsed.hashtags.map((tag) => `${tag}`.trim()).filter(Boolean)
    : undefined;

  if (!captions.instagram && !captions.tiktok && !captions.facebook) {
    console.warn("[openai-text] captions missing in response");
    return buildFallbackSocialPack({petName, petBio});
  }

  if (!hashtags || hashtags.length === 0) {
    console.warn("[openai-text] hashtags missing in response");
    return {
      captions,
      hashtags: buildFallbackSocialPack({petName, petBio}).hashtags,
    };
  }

  return { captions, hashtags };
};

const ensureGeminiReady = () => {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is missing. Add it to your .env file and restart the server."
    );
  }
};

const geminiHeaders = (headers = {}) => ({
  "x-goog-api-key": GEMINI_API_KEY,
  ...headers,
});

const createGeminiVideoJob = async ({ prompt }) => {
  ensureGeminiReady();
  const response = await fetch(
    `${GEMINI_API_BASE_URL}/models/${GEMINI_VIDEO_MODEL}:predictLongRunning`,
    {
      method: "POST",
      headers: {
        ...geminiHeaders({ "Content-Type": "application/json" }),
      },
      body: JSON.stringify({
        instances: [
          {
            prompt,
          },
        ],
        parameters: {
          aspectRatio: GEMINI_VIDEO_ASPECT_RATIO,
          durationSeconds: GEMINI_VIDEO_DURATION_SECONDS,
          resolution: GEMINI_VIDEO_RESOLUTION,
        },
      }),
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.name) {
    throw new Error(
      data?.error?.message || "Failed to create Gemini video job."
    );
  }

  return data;
};

const fetchGeminiOperation = async (operationName) => {
  ensureGeminiReady();
  const response = await fetch(
    `${GEMINI_API_BASE_URL}/${operationName}`,
    {
      method: "GET",
      headers: geminiHeaders(),
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || "Failed to fetch Gemini job.");
  }
  return data;
};

const waitForGeminiVideo = async (operationName) => {
  const deadline = Date.now() + GEMINI_VIDEO_TIMEOUT_MS;
  let operation = await fetchGeminiOperation(operationName);

  while (!operation.done) {
    if (Date.now() > deadline) {
      throw new Error("Video generation timed out on Gemini.");
    }
    await sleep(GEMINI_VIDEO_POLL_INTERVAL_MS);
    operation = await fetchGeminiOperation(operationName);
  }

  if (operation.error) {
    throw new Error(operation.error?.message || "Gemini reported a failure.");
  }

  const samples =
    operation?.response?.generateVideoResponse?.generatedSamples;
  if (!Array.isArray(samples) || samples.length === 0) {
    throw new Error("Gemini did not return a generated video.");
  }

  const sample = samples[0];
  const videoUri = sample?.video?.uri || sample?.videoUri;
  if (!videoUri) {
    throw new Error("Gemini response missing video URI.");
  }

  return { operation, sample, videoUri };
};

const base64UrlEncode = (value) =>
  Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const base64UrlDecode = (value) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, "base64").toString("utf8");
};

const encodeGeminiVideoToken = (uri) => base64UrlEncode(uri);
const decodeGeminiVideoToken = (token) => {
  try {
    return base64UrlDecode(token);
  } catch (error) {
    console.warn("[gemini-video] failed to decode token", error);
    return null;
  }
};

const extractGeminiText = (data) => {
  const candidates = data?.candidates;
  if (!Array.isArray(candidates)) {
    return "";
  }
  for (const candidate of candidates) {
    const parts = candidate?.content?.parts;
    if (!Array.isArray(parts)) continue;
    for (const part of parts) {
      if (typeof part?.text === "string" && part.text.trim()) {
        return part.text.trim();
      }
    }
  }
  return "";
};

const generateGeminiSocialPack = async ({ petName, petBio }) => {
  if (!GEMINI_TEXT_MODEL) {
    return buildFallbackSocialPack({ petName, petBio });
  }

  ensureGeminiReady();

  const response = await fetch(
    `${GEMINI_API_BASE_URL}/models/${GEMINI_TEXT_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        ...geminiHeaders({ "Content-Type": "application/json" }),
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are an expert social strategist for animal adoption stories.
Return JSON with keys: instagram, tiktok, facebook (short heartfelt captions) and hashtags (array of 3-8 tags).
Write from ${petName}'s POV and keep hashtags short.
Bio: ${petBio}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 600,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || "Failed to generate Gemini captions.");
  }

  const textBlock = extractGeminiText(data);
  if (!textBlock) {
    console.warn("[gemini-text] empty response content");
    return buildFallbackSocialPack({ petName, petBio });
  }

  let parsed;
  try {
    parsed = JSON.parse(textBlock);
  } catch (error) {
    console.warn("[gemini-text] Unable to parse JSON response", error);
    return buildFallbackSocialPack({ petName, petBio });
  }

  const captions = {
    instagram: parsed?.instagram,
    tiktok: parsed?.tiktok,
    facebook: parsed?.facebook,
  };
  const hashtags = Array.isArray(parsed?.hashtags)
    ? parsed.hashtags.map((tag) => `${tag}`.trim()).filter(Boolean)
    : undefined;

  if (!captions.instagram && !captions.tiktok && !captions.facebook) {
    console.warn("[gemini-text] captions missing in response");
    return buildFallbackSocialPack({ petName, petBio });
  }

  if (!hashtags || hashtags.length === 0) {
    console.warn("[gemini-text] hashtags missing in response");
    return {
      captions,
      hashtags: buildFallbackSocialPack({ petName, petBio }).hashtags,
    };
  }

  return { captions, hashtags };
};

const waitForVideo = async (videoId) => {
  const deadline = Date.now() + OPENAI_VIDEO_TIMEOUT_MS;
  let job = await fetchVideoJob(videoId);

  while (
    job.status === "queued" ||
    job.status === "processing" ||
    job.status === "starting" ||
    job.status === "in_progress"
  ) {
    if (Date.now() > deadline) {
      throw new Error("Video generation timed out on OpenAI.");
    }
    await sleep(OPENAI_VIDEO_POLL_INTERVAL_MS);
    job = await fetchVideoJob(videoId);
  }

  if (job.status === "failed") {
    throw new Error(job.error?.message || "OpenAI reported a failure.");
  }

  if (job.status !== "completed") {
    throw new Error(`Unexpected status returned from OpenAI: ${job.status}`);
  }

  return job;
};

const fetchVideoJob = async (videoId) => {
  const response = await fetch(`https://api.openai.com/v1/videos/${videoId}`, {
    method: "GET",
    headers: {
      ...openAIHeaders(),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || "Failed to fetch video job.");
  }
  return data;
};

const createVideoJob = async ({ prompt }) => {
  const form = new FormData();
  form.append("model", OPENAI_VIDEO_MODEL);
  form.append("prompt", prompt);
  form.append("seconds", `${OPENAI_VIDEO_SECONDS}`);
  form.append("size", OPENAI_VIDEO_SIZE);

  const response = await fetch("https://api.openai.com/v1/videos", {
    method: "POST",
    headers: openAIHeaders(),
    body: form,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || "Failed to create OpenAI video job.");
  }
  return data;
};

const streamOpenAIVideo = async (videoId, res) => {
  const response = await fetch(
    `https://api.openai.com/v1/videos/${videoId}/content`,
    {
      method: "GET",
      headers: openAIHeaders(),
    }
  );

  if (!response.ok || !response.body) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(
      payload?.error?.message ||
        `Failed to download video content (${response.status}).`
    );
  }

  const contentType = response.headers.get("content-type") || "video/mp4";
  const contentLength = response.headers.get("content-length");
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "no-store");
  if (contentLength) {
    res.setHeader("Content-Length", contentLength);
  }

  const readable = Readable.fromWeb(response.body);
  readable.on("error", (err) => {
    console.error("[openai-video-stream] piping error", err);
    res.destroy(err);
  });
  readable.pipe(res);
};

const withProviderMetadata = (provider, payload) => ({
  provider,
  providerLabel: PROVIDER_LABELS[provider],
  ...payload,
});

const handleOpenAIVideo = async ({ petName, petBio }) => {
  ensureOpenAIReady();
  const prompt = buildPrompt({ petName, petBio });

  const job = await createVideoJob({ prompt });
  const completed = await waitForVideo(job.id);
  let socialPack = null;
  try {
    socialPack = await generateOpenAISocialPack({ petName, petBio });
  } catch (err) {
    console.error("[openai-text]", err);
  }

  return withProviderMetadata(PROVIDERS.OPENAI, {
    status: completed.status,
    message: DEFAULT_VIDEO_SUCCESS_MESSAGE,
    jobId: completed.id,
    model: completed.model,
    prompt,
    seconds: completed.seconds,
    size: completed.size,
    videoUrl: `/api/video/${completed.id}/content`,
    captions: socialPack?.captions,
    hashtags: socialPack?.hashtags,
  });
};

const handleGeminiVideo = async ({ petName, petBio }) => {
  ensureGeminiReady();
  const prompt = buildPrompt({ petName, petBio });

  const job = await createGeminiVideoJob({ prompt });
  const jobName = job?.name;
  if (!jobName) {
    throw new Error("Gemini did not return an operation name.");
  }
  const completion = await waitForGeminiVideo(jobName);

  let socialPack = null;
  try {
    socialPack = await generateGeminiSocialPack({ petName, petBio });
  } catch (err) {
    console.error("[gemini-text]", err);
  }

  const token = encodeGeminiVideoToken(completion.videoUri);

  return withProviderMetadata(PROVIDERS.GEMINI, {
    status: "completed",
    message: DEFAULT_VIDEO_SUCCESS_MESSAGE,
    jobId: completion.operation?.name || jobName,
    model: GEMINI_VIDEO_MODEL,
    prompt,
    seconds: `${
      completion.sample?.metadata?.durationSeconds ??
      GEMINI_VIDEO_DURATION_SECONDS
    }`,
    size: `${GEMINI_VIDEO_RESOLUTION} ${GEMINI_VIDEO_ASPECT_RATIO}`,
    videoUrl: `/api/providers/gemini/video?token=${token}`,
    captions: socialPack?.captions,
    hashtags: socialPack?.hashtags,
  });
};

export const createApp = () => {
  const app = express();
  app.use(
    cors({
      origin: CLIENT_ORIGIN && CLIENT_ORIGIN.length > 0 ? CLIENT_ORIGIN : "*",
    })
  );
  app.use(express.json({ limit: "20mb" }));

  app.get("/healthz", (_, res) => {
    res.json({
      status: "ok",
      model: OPENAI_VIDEO_MODEL,
      geminiModel: GEMINI_VIDEO_MODEL,
      providers: Object.values(PROVIDERS),
    });
  });

  app.post("/api/generate-video", async (req, res) => {
    try {
      const parsed = requestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid payload.",
          details: parsed.error.flatten(),
        });
      }

      const provider =
        parsed.data.provider === PROVIDERS.GEMINI
          ? PROVIDERS.GEMINI
          : PROVIDERS.OPENAI;

      const handler =
        provider === PROVIDERS.GEMINI ? handleGeminiVideo : handleOpenAIVideo;

      const payload = await handler(parsed.data);
      return res.json(payload);
    } catch (error) {
      console.error("[api-generate-video]", error);
      return res.status(500).json({
        error: "Failed to generate the video.",
        details: error?.message || "Unknown server error.",
      });
    }
  });

  app.get("/api/video/:videoId/content", async (req, res) => {
    try {
      ensureOpenAIReady();
      await streamOpenAIVideo(req.params.videoId, res);
    } catch (error) {
      console.error("[openai-video-download]", error);
      if (!res.headersSent) {
        res
          .status(500)
          .json({ error: "Unable to stream the requested video asset." });
      }
    }
  });

  app.get("/api/providers/gemini/video", async (req, res) => {
    try {
      ensureGeminiReady();
      const token = typeof req.query.token === "string" ? req.query.token : null;
      if (!token) {
        return res.status(400).json({ error: "Missing video token." });
      }

      const videoUri = decodeGeminiVideoToken(token);
      if (!videoUri) {
        return res.status(400).json({ error: "Invalid video token." });
      }

      let parsedUrl;
      try {
        parsedUrl = new URL(videoUri);
      } catch {
        return res.status(400).json({ error: "Malformed Gemini video URL." });
      }

      if (parsedUrl.hostname !== "generativelanguage.googleapis.com") {
        return res.status(400).json({ error: "Unapproved Gemini video host." });
      }

      const response = await fetch(videoUri, {
        method: "GET",
        headers: geminiHeaders(),
        redirect: "follow",
      });

      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(
          payload?.error?.message ||
            `Failed to download Gemini video (${response.status}).`
        );
      }

      const contentType = response.headers.get("content-type") || "video/mp4";
      const contentLength = response.headers.get("content-length");
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "no-store");
      if (contentLength) {
        res.setHeader("Content-Length", contentLength);
      }

      const readable = Readable.fromWeb(response.body);
      readable.on("error", (err) => {
        console.error("[gemini-video-stream] piping error", err);
        res.destroy(err);
      });
      readable.pipe(res);
    } catch (error) {
      console.error("[gemini-video-download]", error);
      if (!res.headersSent) {
        res
          .status(500)
          .json({ error: "Unable to stream the requested Gemini video asset." });
      }
    }
  });

  return app;
};
