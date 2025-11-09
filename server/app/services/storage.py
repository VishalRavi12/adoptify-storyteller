import hashlib
import os
import uuid
from pathlib import Path
from typing import BinaryIO, Optional

import boto3
from botocore.client import Config

from app.config import settings


class StorageService:
    def __init__(self) -> None:
        self.bucket = settings.storage_bucket
        self.base_url = settings.public_media_base_url
        self.tmp_dir = Path(settings.tmp_dir)
        self.tmp_dir.mkdir(parents=True, exist_ok=True)
        self._client = None

        if self.bucket and settings.storage_access_key and settings.storage_secret_key:
            endpoint = settings.storage_endpoint or "https://s3.amazonaws.com"
            self._client = boto3.client(
                "s3",
                region_name=settings.storage_region,
                endpoint_url=endpoint,
                aws_access_key_id=settings.storage_access_key,
                aws_secret_access_key=settings.storage_secret_key,
                config=Config(signature_version="s3v4"),
            )

    def _hash_bytes(self, data: bytes) -> str:
        return hashlib.sha256(data).hexdigest()

    def upload_file(self, file_obj: BinaryIO, suffix: str = "") -> tuple[str, str, str]:
        data = file_obj.read()
        checksum = self._hash_bytes(data)
        asset_id = f"asset-{uuid.uuid4().hex}{suffix}"
        filename = f"{asset_id}"

        if self._client and self.bucket:
            key = f"uploads/{filename}"
            self._client.put_object(Bucket=self.bucket, Key=key, Body=data)
            url = self.base_url.rstrip("/") + f"/{key}" if self.base_url else key
            return asset_id, url, checksum

        # fallback: local tmp store
        local_path = self.tmp_dir / filename
        local_path.write_bytes(data)
        return asset_id, local_path.as_uri(), checksum


storage_service = StorageService()
