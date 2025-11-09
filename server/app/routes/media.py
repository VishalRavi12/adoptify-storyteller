from pathlib import Path
from urllib.parse import unquote

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse

from app.config import settings

router = APIRouter(prefix="/media", tags=["media"])


@router.get("/local")
async def serve_local_file(path: str = Query(..., description="file:// URI within the tmp directory")):
    decoded = unquote(path)
    if decoded.startswith("file://"):
        decoded = decoded[7:]

    target = Path(decoded).resolve()
    tmp_root = Path(settings.tmp_dir).resolve()

    if not target.exists() or not str(target).startswith(str(tmp_root)):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(target)
