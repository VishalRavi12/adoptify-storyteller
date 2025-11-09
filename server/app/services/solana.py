import httpx

from app.config import settings


class SolanaClient:
    def __init__(self) -> None:
        self.worker_url = settings.solana_worker_url

    async def mint_badge(self, adopter: str, pet_id: str, campaign_id: str | None = None) -> dict:
        if settings.mock_mode or not self.worker_url:
            return {"ok": True, "signature": f"MOCK-{pet_id}"}

        payload = {"adopter": adopter, "petId": pet_id, "campaignId": campaign_id}
        async with httpx.AsyncClient(timeout=30) as client:
            res = await client.post(self.worker_url, json=payload)
            res.raise_for_status()
            return res.json()


def get_solana_client() -> SolanaClient:
    return SolanaClient()
