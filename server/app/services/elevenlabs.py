import math
import struct
import tempfile
from pathlib import Path
from typing import Optional
import wave

import httpx

from app.config import settings


class ElevenLabsClient:
    def __init__(self) -> None:
        self.api_key = settings.eleven_api_key

    async def synthesize(self, text: str, voice_id: Optional[str] = None, fmt: str = "mp3") -> Path:
        voice = voice_id or settings.eleven_voice_id

        if settings.mock_mode or not self.api_key:
            # Always return a short WAV clip so the browser can actually play audio in mock mode
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
            duration = max(2, min(8, len(text) // 15))
            sample_rate = 16_000
            amplitude = 16_000
            frequency = 220
            with wave.open(tmp, "wb") as wav_file:
                wav_file.setnchannels(1)
                wav_file.setsampwidth(2)
                wav_file.setframerate(sample_rate)
                for i in range(duration * sample_rate):
                    value = int(amplitude * math.sin(2 * math.pi * frequency * (i / sample_rate)))
                    wav_file.writeframes(struct.pack("<h", value))
            return Path(tmp.name)

        endpoint = f"https://api.elevenlabs.io/v1/text-to-speech/{voice}"
        headers = {
            "xi-api-key": self.api_key,
            "Accept": f"audio/{fmt}",
        }
        payload = {
            "text": text,
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.7},
        }

        async with httpx.AsyncClient(timeout=120) as client:
            res = await client.post(endpoint, headers=headers, json=payload)
            res.raise_for_status()

        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=f".{fmt}")
        tmp.write(res.content)
        tmp.close()
        return Path(tmp.name)


def get_elevenlabs_client() -> ElevenLabsClient:
    return ElevenLabsClient()
