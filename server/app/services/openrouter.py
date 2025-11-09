import os
import time
from typing import List

import httpx

from app.config import settings


OPENROUTER_BASE = os.environ.get("OPENROUTER_BASE", "https://openrouter.ai/api/v1")


class OpenRouterClient:
    def __init__(self) -> None:
        self.models = settings.openrouter_models
        self.api_key = settings.openrouter_api_key

    async def generate_script(self, pet_name: str, bio: str, traits: List[str]) -> List[dict]:
        results: List[dict] = []
        prompt = self._build_prompt(pet_name, bio, traits)

        for model in self.models:
            start = time.perf_counter()
            if settings.mock_mode or not self.api_key:
                content = self._mock_response(pet_name, model)
                latency = int((time.perf_counter() - start) * 1000)
                results.append(
                    {
                        "model": model,
                        "latency_ms": latency,
                        "cost_usd": 0.0004,
                        "content": content,
                    }
                )
                continue

            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "HTTP-Referer": "https://adoptify.local",
                "X-Title": "Adoptify Storyteller",
            }

            payload = {
                "model": model,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are Adoptify, an adoption marketing expert writing short heartfelt scripts.",
                    },
                    {"role": "user", "content": prompt},
                ],
            }

            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.post(f"{OPENROUTER_BASE}/chat/completions", headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()

            latency = int((time.perf_counter() - start) * 1000)
            content = data["choices"][0]["message"]["content"]
            cost = data.get("usage", {}).get("total_cost", 0.001)

            results.append(
                {
                    "model": model,
                    "latency_ms": latency,
                    "cost_usd": cost,
                    "content": content,
                }
            )

        return results

    def _build_prompt(self, pet_name: str, bio: str, traits: List[str]) -> str:
        trait_text = ", ".join(traits) if traits else "loving"
        return (
            f"Write a 45-60 second video script for a shelter adoption reel.\n"
            f"Pet name: {pet_name}. Traits: {trait_text}.\n"
            f"Bio: {bio}.\n"
            "Sections: Hook (0-3s), Meet + micro-backstory, 2 heart moments, CTA with shelter location."
            "Include 3 IG caption ideas and 6 hashtags inline."
        )

    def _mock_response(self, pet_name: str, model: str) -> str:
        return (
            f"[mock:{model}] Meet {pet_name}, the cuddle-forward hero looking for a couch."
            " Hook: 'Buffalo, your new hiking buddy is waiting!'."
            " Story beats, CTA, hashtags..."
        )


def get_openrouter_client() -> OpenRouterClient:
    return OpenRouterClient()
