from typing import AsyncGenerator, Dict, Any, List
from fastapi import Depends, HTTPException, Security, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import async_session_factory
from app.core.security import decode_cirra_token
from app.core.redis import get_redis
from app.core.config import settings

security_bearer = HTTPBearer(auto_error=False)

ROLE_HIERARCHY: Dict[str, int] = {
    "viewer": 1,
    "member": 2,
    "admin": 3,
}


async def get_current_user_claims(
    credentials: HTTPAuthorizationCredentials = Security(security_bearer)
) -> Dict[str, Any]:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Missing authentication token"}
        )
    try:
        payload = decode_cirra_token(credentials.credentials)
        if "tenant_id" not in payload or "user_id" not in payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "INVALID_TOKEN", "message": "Malformed token payload"}
            )
        return payload
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN", "message": str(e)}
        )


async def get_db_tenant_session(
    claims: Dict[str, Any] = Depends(get_current_user_claims)
) -> AsyncGenerator[AsyncSession, None]:
    """Database session with SET LOCAL app.tenant_id = :tenant_id inside an open transaction."""
    tenant_id = claims["tenant_id"]
    async with async_session_factory() as session:
        async with session.begin():
            await session.execute(
                text("SET LOCAL app.tenant_id = :tenant_id"),
                {"tenant_id": tenant_id}
            )
            yield session


async def get_raw_db() -> AsyncGenerator[AsyncSession, None]:
    """Raw database session for public endpoints like health or initial auth."""
    async with async_session_factory() as session:
        yield session


def require_role(min_role: str):
    """Enforce role based access control (admin > member > viewer)."""
    min_level = ROLE_HIERARCHY.get(min_role, 1)

    async def role_checker(claims: Dict[str, Any] = Depends(get_current_user_claims)) -> Dict[str, Any]:
        user_role = claims.get("role", "viewer")
        user_level = ROLE_HIERARCHY.get(user_role, 0)
        if user_level < min_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "FORBIDDEN", "message": f"Requires {min_role} privileges"}
            )
        return claims

    return role_checker


async def check_rate_limit(
    request: Request,
    claims: Dict[str, Any] = Depends(get_current_user_claims)
) -> None:
    """Rate limit per subject (user_id) via Redis."""
    try:
        r = await get_redis()
        user_id = claims["user_id"]
        key = f"rate_limit:{user_id}"
        current = await r.incr(key)
        if current == 1:
            await r.expire(key, 60)
        if current > settings.RATE_LIMIT_PER_MINUTE:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={"code": "RATE_LIMITED", "message": "Rate limit exceeded. Please wait a minute."}
            )
    except HTTPException:
        raise
    except Exception:
        # If redis is temporarily unavailable, do not block the request
        pass
