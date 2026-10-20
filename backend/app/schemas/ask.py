from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict


class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    answer: str
    sql: str
    rows: List[Dict[str, Any]]
    confidence: float
    warning: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
