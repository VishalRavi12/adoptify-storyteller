from fastapi import APIRouter

from app.schemas import VoiceoverRequest, VoiceoverResponse
from app.services.elevenlabs import get_elevenlabs_client
from app.services.storage import storage_service

router = APIRouter(prefix="/voiceover", tags=["voiceover"])

elevenlabs = get_elevenlabs_client()


@router.post("", response_model=VoiceoverResponse)
async def create_voiceover(payload: VoiceoverRequest) -> VoiceoverResponse:
    path = await elevenlabs.synthesize(payload.script, payload.voice_id, payload.format)
    with path.open("rb") as stream:
        asset_id, url, _ = storage_service.upload_file(stream, suffix=path.suffix)
    return VoiceoverResponse(url=url, local_path=str(path), duration_seconds=None)
