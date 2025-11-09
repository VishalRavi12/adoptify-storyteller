const API_BASE = (import.meta.env.VITE_API_BASE ?? "http://localhost:8000/api").replace(/\/$/, "");

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, options);
  if (!response.ok) {
    let message = response.statusText;
    try {
      const data = await response.json();
      message = data?.detail ?? data?.message ?? message;
    } catch {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }
    throw new Error(message || "Request failed");
  }
  return response.json() as Promise<T>;
}

export interface MediaIngestResponse {
  asset_id: string;
  media_url: string;
  checksum: string;
}

export interface StoryResponse {
  pet_name: string;
  script: string;
  caption_variants: string[];
  hook_variants: string[];
  hashtags: string[];
  storyboard?: string;
  palette?: string[];
  provider_results: {
    model: string;
    latency_ms: number;
    cost_usd: number;
    content: string;
  }[];
}

export interface VoiceoverResponse {
  url?: string | null;
  local_path?: string | null;
  duration_seconds?: number | null;
}

export interface RenderResponse {
  video_url?: string | null;
  storyboard_preview?: string | null;
  rendered_at: string;
}

export interface DomainSuggestion {
  domain: string;
  score: number;
  reason: string;
}

export interface DomainSuggestionResponse {
  suggestions: DomainSuggestion[];
}

export async function ingestMedia(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return request<MediaIngestResponse>("/ingest", {
    method: "POST",
    body: formData,
  });
}

export async function createStory(payload: {
  pet_name: string;
  bio: string;
  traits?: string[];
  image_url?: string;
}) {
  return request<StoryResponse>("/story", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function createVoiceover(payload: { script: string; voice_id?: string; format?: string }) {
  return request<VoiceoverResponse>("/voiceover", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function renderVideo(payload: {
  pet_name: string;
  script: string;
  captions: string[];
  media_url?: string;
  voiceover_url?: string;
}) {
  return request<RenderResponse>("/render", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function suggestDomains(payload: { pet_name: string; location?: string; keywords?: string[]; tlds?: string[] }) {
  return request<DomainSuggestionResponse>("/domains/suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function resolveMediaUrl(raw?: string | null) {
  if (!raw) return "";
  if (raw.startsWith("http")) {
    return raw;
  }
  return `${API_BASE}/media/local?path=${encodeURIComponent(raw)}`;
}

export { API_BASE };
