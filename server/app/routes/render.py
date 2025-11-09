from datetime import datetime

from fastapi import APIRouter

from app.schemas import RenderRequest, RenderResponse
from app.services.renderer import get_renderer
from app.services.storage import storage_service

router = APIRouter(prefix="/render", tags=["render"])

renderer = get_renderer()


@router.post("", response_model=RenderResponse)
async def render_video(payload: RenderRequest) -> RenderResponse:
    path = await renderer.render(payload.pet_name, payload.captions, payload.voiceover_url)
    with path.open("rb") as stream:
        _, url, _ = storage_service.upload_file(stream, suffix=path.suffix)
    return RenderResponse(video_url=url, rendered_at=datetime.utcnow(), storyboard_preview=None)
