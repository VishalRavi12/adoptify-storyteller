from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class MediaIngestResponse(BaseModel):
    asset_id: str
    media_url: str
    checksum: str


class StoryRequest(BaseModel):
    pet_name: str
    bio: str
    traits: List[str] = []
    prompt_style: Optional[str] = None
    image_url: Optional[str] = None


class ModelChoice(BaseModel):
    model: str
    latency_ms: int
    cost_usd: float
    content: str


class StoryResponse(BaseModel):
    pet_name: str
    script: str
    caption_variants: List[str]
    hook_variants: List[str]
    hashtags: List[str]
    provider_results: List[ModelChoice]
    storyboard: Optional[str] = None
    palette: Optional[List[str]] = None


class VoiceoverRequest(BaseModel):
    script: str
    voice_id: Optional[str] = None
    format: str = "mp3"


class VoiceoverResponse(BaseModel):
    url: Optional[str] = None
    local_path: Optional[str] = None
    duration_seconds: Optional[float] = None


class RenderRequest(BaseModel):
    pet_name: str
    script: str
    captions: List[str]
    media_url: Optional[str] = None
    voiceover_url: Optional[str] = None


class RenderResponse(BaseModel):
    video_url: Optional[str] = None
    storyboard_preview: Optional[str] = None
    rendered_at: datetime


class DomainSuggestionRequest(BaseModel):
    pet_name: str
    location: Optional[str] = None
    keywords: List[str] = []
    tlds: List[str] = [".pet", ".today", ".dev", ".org"]


class DomainSuggestion(BaseModel):
    domain: str
    score: float
    reason: str


class DomainSuggestionResponse(BaseModel):
    suggestions: List[DomainSuggestion]


class AuthWebhookPayload(BaseModel):
    user_id: str
    email: str
    role: str
    event: str


class AuthWebhookResponse(BaseModel):
    ok: bool
    processed_at: datetime


class MintRequest(BaseModel):
    adopter_wallet: str
    pet_id: str
    campaign_id: Optional[str] = None


class MintResponse(BaseModel):
    ok: bool
    signature: Optional[str]


class HealthResponse(BaseModel):
    status: str
    time: datetime
