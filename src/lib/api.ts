type Nullable<T> = T | null | undefined;

const inferDefaultBaseUrl = () => {
  if (typeof window === "undefined" || !window.location) {
    return "";
  }

  const { protocol, hostname, port } = window.location;
  const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";

  if (isLocalHost) {
    const devPorts = new Set(["", "3000", "4173", "5173", "5174", "5175", "5176", "8080"]);
    if (!port || devPorts.has(port)) {
      return `${protocol}//${hostname}:4000`;
    }
  }

  return window.location.origin;
};

const normalizedBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as Nullable<string>)?.replace(/\/$/, "") ||
  inferDefaultBaseUrl();

export const resolveApiUrl = (path: string) => {
  if (!path) {
    return normalizedBaseUrl;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  if (!normalizedBaseUrl) {
    return path;
  }

  return `${normalizedBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
};

export interface GenerateVideoRequest {
  petName: string;
  petBio: string;
  petImage: string;
  mimeType?: string;
}

export interface SocialCaptions {
  instagram?: string;
  tiktok?: string;
  facebook?: string;
}

export interface GenerateVideoResponse {
  status: string;
  message: string;
  jobId: string;
  prompt: string;
  model?: string;
  seconds?: string;
  size?: string;
  videoUrl: string;
  captions?: SocialCaptions;
  hashtags?: string[];
}

export const inferDataUrlMimeType = (
  dataUrl: Nullable<string>,
  fallback = "image/png",
) => {
  if (!dataUrl) {
    return fallback;
  }
  const match = dataUrl.match(/^data:(.*?);base64,/);
  return match?.[1] || fallback;
};

export const requestVideoGeneration = async (
  payload: GenerateVideoRequest,
): Promise<GenerateVideoResponse> => {
  const response = await fetch(resolveApiUrl("/api/generate-video"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail =
      typeof data?.details === "string" && data.details.length > 0
        ? ` ${data.details}`
        : "";
    const errorMessage =
      typeof data?.error === "string"
        ? `${data.error}${detail}`
        : "Server could not render the requested video.";
    throw new Error(errorMessage.trim());
  }

  if (!data?.videoUrl) {
    throw new Error("Server finished but did not return a video URL.");
  }

  return {
    ...data,
    videoUrl: resolveApiUrl(data.videoUrl),
  } as GenerateVideoResponse;
};
