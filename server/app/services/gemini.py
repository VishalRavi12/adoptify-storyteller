from __future__ import annotations

import httpx

from app.config import settings


class GeminiClient:
    def __init__(self) -> None:
        self.api_key = settings.gemini_api_key
        self.model = settings.gemini_model

    async def storyboard(self, prompt: str, image_url: str | None = None) -> dict:
        if settings.mock_mode or not self.api_key:
            return {
                "storyboard": "1) Close-up eyes. 2) Playful zoom. 3) CTA card",
                "palette": ["#f8d9d6", "#6c63ff"],
            }

        endpoint = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.model}:generateContent?key={self.api_key}"
        )
        contents = [
            {
                "role": "user",
                "parts": [
                    {"text": prompt},
                ],
            }
        ]
        if image_url:
            contents[0]["parts"].append({"inline_data": {"mime_type": "image/jpeg", "data": image_url}})

        payload = {"contents": contents}

        async with httpx.AsyncClient(timeout=60) as client:
            res = await client.post(endpoint, json=payload)
            res.raise_for_status()
            data = res.json()

        text = data["candidates"][0]["content"]["parts"][0]["text"]
        return {"storyboard": text}


def get_gemini_client() -> GeminiClient:
    return GeminiClient()
