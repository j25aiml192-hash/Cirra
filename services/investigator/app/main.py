import logging
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.config import settings
from app.explainer import ResultExplainer
from app.query_runner import ClickHouseQueryRunner
from app.sql_generator import SQLGenerator
from app.sql_validator import SQLValidator

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("cirra.investigator.main")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    description="Ask Cirra Text-to-SQL Cost Intelligence Service",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instantiate core components
sql_generator = SQLGenerator()
sql_validator = SQLValidator()
query_runner = ClickHouseQueryRunner()
explainer = ResultExplainer()


class AskRequest(BaseModel):
    question: str = Field(..., description="Natural language question about cloud/AI spend")
    tenant_id: str = Field(..., description="UUID of the tenant requesting spend data")
    conversation_history: Optional[List[Dict[str, Any]]] = Field(
        default_factory=list,
        description="Previous conversation turns for context",
    )


class AskResponse(BaseModel):
    answer: str
    sql_used: str
    row_count: int
    columns: List[str]
    rows: List[List[Any]]
    injected_tenant_filter: bool
    execution_time_ms: float


@app.get("/health", tags=["Health"])
def health():
    return {
        "status": "ok",
        "service": "cirra-investigator",
        "environment": settings.ENVIRONMENT,
        "version": "0.1.0",
    }


@app.post("/ask", response_model=AskResponse, tags=["Investigator"])
def ask(request: AskRequest):
    """
    Handle natural language cost questions via text-to-SQL.
    Pipeline:
      1. Generate SQL from question via Groq (with fallback).
      2. Strictly validate SQL with AST validator and enforce tenant isolation.
      3. Execute against ClickHouse.
      4. Explain query results in plain English.
    """
    logger.info(f"Received ask query for tenant={request.tenant_id}: '{request.question}'")

    # Step 1: Text-to-SQL generation
    raw_sql = sql_generator.generate(
        question=request.question,
        tenant_id=request.tenant_id,
        conversation_history=request.conversation_history,
    )
    logger.info(f"Generated raw SQL: {raw_sql}")

    # Step 2: AST-based SQL Validation & Security Enforcement
    val_result = sql_validator.validate_and_transform(raw_sql, request.tenant_id)
    if not val_result.is_valid:
        logger.error(f"SQL validation failed: {val_result.error} (raw SQL: {raw_sql})")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Security/Validation Error: {val_result.error}",
        )

    validated_sql = val_result.transformed_sql
    logger.info(f"Executing validated SQL: {validated_sql}")

    # Step 3: Execute query against ClickHouse
    try:
        query_result = query_runner.execute(validated_sql)
    except Exception as e:
        logger.exception(f"ClickHouse query execution failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database execution error: {str(e)}",
        )

    # Step 4: Explain results in plain English
    answer = explainer.explain(
        question=request.question,
        columns=query_result.columns,
        rows=query_result.rows,
    )

    return AskResponse(
        answer=answer,
        sql_used=validated_sql,
        row_count=query_result.row_count,
        columns=query_result.columns,
        rows=query_result.rows,
        injected_tenant_filter=val_result.injected_tenant_filter,
        execution_time_ms=query_result.execution_time_ms,
    )
