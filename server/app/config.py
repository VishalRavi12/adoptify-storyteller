from functools import lru_cache
from typing import List, Optional

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = Field(default="Adoptify Storyteller API")
    env: str = Field(default="local")
    api_prefix: str = Field(default="/api")

    # AI providers
    openrouter_api_key: Optional[str] = Field(default=None, env="OPENROUTER_API_KEY")
    openrouter_models: List[str] = Field(
        default_factory=lambda: [
            "openai/gpt-4o-mini",
            "anthropic/claude-3-haiku-20240307",
            "google/gemma-2-9b-it",
        ]
    )
    gemini_api_key: Optional[str] = Field(default=None, env="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-1.5-flash")

    eleven_api_key: Optional[str] = Field(default=None, env="ELEVEN_API_KEY")
    eleven_voice_id: str = Field(default="Rachel")

    # Storage (R2/S3 compatible)
    storage_bucket: Optional[str] = Field(default=None, env="MEDIA_BUCKET")
    storage_region: str = Field(default="auto")
    storage_access_key: Optional[str] = Field(default=None, env="MEDIA_ACCESS_KEY")
    storage_secret_key: Optional[str] = Field(default=None, env="MEDIA_SECRET_KEY")
    storage_endpoint: Optional[str] = Field(default=None, env="MEDIA_ENDPOINT")
    public_media_base_url: Optional[str] = Field(default=None, env="MEDIA_BASE_URL")

    # Workers / blockchain
    solana_worker_url: Optional[str] = Field(default=None, env="SOLANA_WORKER_URL")
    solana_rpc_url: Optional[str] = Field(default=None, env="SOLANA_RPC_URL")

    # Auth0
    auth0_domain: Optional[str] = Field(default=None, env="AUTH0_DOMAIN")
    auth0_client_id: Optional[str] = Field(default=None, env="AUTH0_CLIENT_ID")
    auth0_client_secret: Optional[str] = Field(default=None, env="AUTH0_CLIENT_SECRET")

    # Rendering / media
    ffmpeg_binary: str = Field(default="ffmpeg")
    tmp_dir: str = Field(default="/tmp")

    # Feature flags
    mock_mode: bool = Field(
        default=False,
        description="When True, providers return synthetic responses for local dev",
        env="MOCK_MODE",
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
