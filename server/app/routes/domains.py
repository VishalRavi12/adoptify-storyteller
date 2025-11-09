from fastapi import APIRouter

from app.schemas import DomainSuggestionRequest, DomainSuggestionResponse
from app.services.domains import generate_domains

router = APIRouter(prefix="/domains", tags=["domains"])


@router.post("/suggest", response_model=DomainSuggestionResponse)
async def suggest_domains(payload: DomainSuggestionRequest) -> DomainSuggestionResponse:
    suggestions = generate_domains(payload.pet_name, payload.location, payload.keywords, payload.tlds)
    return DomainSuggestionResponse(suggestions=suggestions)
