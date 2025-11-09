from fastapi import APIRouter

from app.schemas import MintRequest, MintResponse
from app.services.solana import get_solana_client

router = APIRouter(prefix="/solana", tags=["solana"])

solana_client = get_solana_client()


@router.post("/mint", response_model=MintResponse)
async def mint_badge(payload: MintRequest) -> MintResponse:
    result = await solana_client.mint_badge(payload.adopter_wallet, payload.pet_id, payload.campaign_id)
    return MintResponse(ok=result.get("ok", True), signature=result.get("sig") or result.get("signature"))
