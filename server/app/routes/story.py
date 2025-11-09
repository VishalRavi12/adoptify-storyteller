from fastapi import APIRouter

from app.schemas import StoryRequest, StoryResponse
from app.services.gemini import get_gemini_client
from app.services.openrouter import get_openrouter_client

router = APIRouter(prefix="/story", tags=["story"])

openrouter_client = get_openrouter_client()
gemini_client = get_gemini_client()


@router.post("", response_model=StoryResponse)
async def generate_story(payload: StoryRequest) -> StoryResponse:
    provider_results = await openrouter_client.generate_script(payload.pet_name, payload.bio, payload.traits)
    provider_results.sort(key=lambda r: (r["cost_usd"], r["latency_ms"]))
    top_script = provider_results[0]["content"]

    storyboard = await gemini_client.storyboard(
        f"Create a storyboard for {payload.pet_name} adoption video with CTA.",
        image_url=str(payload.image_url) if payload.image_url else None,
    )

    captions = _extract_caption_variants(top_script)
    hooks = _extract_hooks(top_script)
    hashtags = _extract_hashtags(top_script)

    return StoryResponse(
        pet_name=payload.pet_name,
        script=top_script,
        caption_variants=captions,
        hook_variants=hooks,
        hashtags=hashtags,
        provider_results=provider_results,
        storyboard=storyboard.get("storyboard"),
        palette=storyboard.get("palette"),
    )


def _extract_caption_variants(script: str):
    lines = [line.strip("-• ") for line in script.splitlines() if line.strip()]
    return (lines[:3] or [f"Meet {script[:40]}..."]) if lines else ["New beginnings start here"]


def _extract_hooks(script: str):
    hooks = []
    for line in script.splitlines():
        if "hook" in line.lower():
            hooks.append(line.split(":")[-1].strip())
    return hooks or ["This weekend only: come meet your new best friend"]


def _extract_hashtags(script: str):
    tags = [token for token in script.split() if token.startswith("#")]
    if len(tags) < 4:
        tags.extend(["#adoptify", "#adoptdontshop", "#petrescue", "#shelterlove"])
    return list(dict.fromkeys(tags))[:6]
