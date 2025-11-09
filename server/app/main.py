from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import auth, domains, health, ingest, media, render, solana, story, voiceover


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router, prefix=settings.api_prefix)
    app.include_router(ingest.router, prefix=settings.api_prefix)
    app.include_router(story.router, prefix=settings.api_prefix)
    app.include_router(voiceover.router, prefix=settings.api_prefix)
    app.include_router(render.router, prefix=settings.api_prefix)
    app.include_router(domains.router, prefix=settings.api_prefix)
    app.include_router(auth.router, prefix=settings.api_prefix)
    app.include_router(solana.router, prefix=settings.api_prefix)
    app.include_router(media.router, prefix=settings.api_prefix)

    return app


app = create_app()
