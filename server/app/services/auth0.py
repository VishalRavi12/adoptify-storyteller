from datetime import datetime

from app.schemas import AuthWebhookPayload, AuthWebhookResponse


def handle_webhook(payload: AuthWebhookPayload) -> AuthWebhookResponse:
    # In a production system this would call Auth0 Management API and/or persist to DB
    return AuthWebhookResponse(ok=True, processed_at=datetime.utcnow())
