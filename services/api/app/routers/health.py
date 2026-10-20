from fastapi import APIRouter, Response, status
from app.core.database import check_database_health
from app.core.redis import check_redis_health

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}


@router.get("/ready")
async def ready(response: Response):
    db_ok = await check_database_health()
    redis_ok = await check_redis_health()

    payload = {
        "status": "ready" if (db_ok and redis_ok) else "degraded",
        "checks": {
            "database": "ok" if db_ok else "unreachable",
            "redis": "ok" if redis_ok else "unreachable"
        }
    }

    if not db_ok or not redis_ok:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return payload
