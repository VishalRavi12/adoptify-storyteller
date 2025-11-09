import asyncio
import logging
import shutil
import subprocess
import uuid
from pathlib import Path
from typing import List, Optional

import cv2
import httpx
import numpy as np

from app.config import settings


class Renderer:
    def __init__(self) -> None:
        self.tmp_dir = Path(settings.tmp_dir)
        self.tmp_dir.mkdir(parents=True, exist_ok=True)
        self.ffmpeg = settings.ffmpeg_binary
        self.ffmpeg_available = shutil.which(self.ffmpeg) is not None

    async def render(self, pet_name: str, captions: List[str], voiceover_url: Optional[str]) -> Path:
        frame_path = await asyncio.to_thread(self._make_slideshow, pet_name, captions)
        if voiceover_url:
            audio_path = await self._download_audio(voiceover_url)
            merged = self.tmp_dir / f"render-{uuid.uuid4().hex}.mp4"
            if not self.ffmpeg_available:
                logging.warning("FFmpeg not found (%s); returning video without multiplexed audio", self.ffmpeg)
                return frame_path
            cmd = [
                self.ffmpeg,
                "-y",
                "-i",
                str(frame_path),
                "-i",
                str(audio_path),
                "-c:v",
                "copy",
                "-c:a",
                "aac",
                str(merged),
            ]
            try:
                subprocess.run(cmd, check=True)
                return merged
            except FileNotFoundError:
                logging.warning("FFmpeg executable %s missing; returning video without audio track", self.ffmpeg)
                return frame_path
            except subprocess.CalledProcessError as exc:
                logging.error("FFmpeg merge failed: %s", exc)
                return frame_path
        return frame_path

    def _make_slideshow(self, pet_name: str, captions: List[str]) -> Path:
        width, height = 720, 1280
        fps = 30
        duration_per_card = 3
        output_path = self.tmp_dir / f"story-{uuid.uuid4().hex}.mp4"
        writer = cv2.VideoWriter(
            str(output_path),
            cv2.VideoWriter_fourcc(*"mp4v"),
            fps,
            (width, height),
        )

        for caption in captions:
            frame = np.full((height, width, 3), 245, dtype=np.uint8)
            cv2.rectangle(frame, (40, 40), (width - 40, height - 40), (255, 255, 255), -1)
            self._draw_text(frame, pet_name, (60, 120), scale=1.2, color=(134, 76, 191))
            self._draw_multiline(frame, caption, (60, 200))
            for _ in range(duration_per_card * fps):
                writer.write(frame)

        writer.release()
        return output_path

    async def _download_audio(self, url: str) -> Path:
        local = self.tmp_dir / f"voice-{uuid.uuid4().hex}.mp3"
        if url.startswith("file://"):
            local.write_bytes(Path(url[7:]).read_bytes())
            return local
        async with httpx.AsyncClient(timeout=60) as client:
            res = await client.get(url)
            res.raise_for_status()
            local.write_bytes(res.content)
            return local

    def _draw_text(self, frame, text: str, position, scale=1.0, color=(0, 0, 0)):
        cv2.putText(
            frame,
            text,
            position,
            cv2.FONT_HERSHEY_SIMPLEX,
            scale,
            color,
            2,
            cv2.LINE_AA,
        )

    def _draw_multiline(self, frame, text: str, origin, line_height: int = 60):
        words = text.split(" ")
        width_limit = 32
        lines = []
        buf = []
        for word in words:
            buf.append(word)
            if len(" ".join(buf)) > width_limit:
                lines.append(" ".join(buf))
                buf = []
        if buf:
            lines.append(" ".join(buf))

        y = origin[1]
        for line in lines:
            self._draw_text(frame, line, (origin[0], y), scale=0.9)
            y += line_height


def get_renderer() -> Renderer:
    return Renderer()
