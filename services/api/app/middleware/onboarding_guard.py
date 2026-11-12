from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from sqlalchemy import text

from app.core.database import async_session_factory
from app.core.security import decode_cirra_token

TENANT_ZERO_ID = "00000000-0000-0000-0000-000000000001"

EXEMPT_PREFIXES = (
    "/api/v1/onboarding",
    "/onboarding",
    "/api/v1/auth",
    "/auth",
    "/health",
    "/ready",
    "/docs",
    "/openapi.json",
    "/redoc",
)


class OnboardingGuard(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if request.method == "OPTIONS" or any(path == p or path.startswith(f"{p}/") or path.startswith(p) for p in EXEMPT_PREFIXES):
            return await call_next(request)

        # Extract authorization token
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return await call_next(request)

        token = auth_header.split(" ", 1)[1].strip()
        try:
            payload = decode_cirra_token(token)
            tenant_id = payload.get("tenant_id")
        except Exception:
            return await call_next(request)

        if not tenant_id:
            return await call_next(request)

        if str(tenant_id) == TENANT_ZERO_ID:
            return await call_next(request)

        try:
            async with async_session_factory() as session:
                res = await session.execute(
                    text("SELECT onboarding_complete FROM tenants WHERE id = CAST(:tenant_id AS uuid)"),
                    {"tenant_id": str(tenant_id)},
                )
                tenant_row = res.first()
                if tenant_row and not tenant_row[0]:
                    # Tenant exists but onboarding_complete is false
                    step_res = await session.execute(
                        text("SELECT current_step FROM onboarding_state WHERE tenant_id = CAST(:tenant_id AS uuid)"),
                        {"tenant_id": str(tenant_id)},
                    )
                    step_row = step_res.first()
                    current_step = step_row[0] if step_row else 1

                    return JSONResponse(
                        status_code=403,
                        content={
                            "error": "onboarding_required",
                            "message": "Please complete setup wizard first",
                            "redirect": "/onboarding",
                            "current_step": current_step,
                        },
                    )
        except Exception:
            pass

        return await call_next(request)
