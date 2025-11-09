from fastapi import APIRouter

from app.schemas import AuthWebhookPayload, AuthWebhookResponse
from app.services.auth0 import handle_webhook

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/webhook", response_model=AuthWebhookResponse)
async def auth_webhook(payload: AuthWebhookPayload) -> AuthWebhookResponse:
    return handle_webhook(payload)
