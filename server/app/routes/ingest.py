from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.storage import storage_service
from app.schemas import MediaIngestResponse

router = APIRouter(prefix="/ingest", tags=["media"])


@router.post("", response_model=MediaIngestResponse)
async def ingest_media(file: UploadFile = File(...)) -> MediaIngestResponse:
    if file.content_type and not file.content_type.startswith("image"):
        raise HTTPException(status_code=400, detail="Only image uploads are supported right now")

    asset_id, url, checksum = storage_service.upload_file(file.file, suffix=file.filename or "")
    return MediaIngestResponse(asset_id=asset_id, media_url=url, checksum=checksum)
