from fastapi import APIRouter
from app.schemas.ask import AskRequest, AskResponse
from app.services.investigator.ask_cirra import AskCirraService

router = APIRouter(prefix="/ask", tags=["ask"])
ask_service = AskCirraService()

@router.post("", response_model=AskResponse)
async def ask_cirra(payload: AskRequest):
    return await ask_service.answer_question("00000000-0000-0000-0000-000000000001", payload.question)
