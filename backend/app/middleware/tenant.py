from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from app.core.security import verify_token

EXEMPT_PATHS = {"/", "/health", "/docs", "/openapi.json", "/redoc", "/api/v1/auth/session"}


class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path
        if path in EXEMPT_PATHS or request.method == "OPTIONS":
            return await call_next(request)

        tenant_id = None
        user_role = "viewer"
        auth_header = request.headers.get("Authorization")

        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]
            payload = verify_token(token)
            if payload:
                tenant_id = payload.get("tenant_id")
                user_role = payload.get("role", "viewer")

        if not tenant_id:
            dev_tenant = request.headers.get("X-Tenant-ID")
            if dev_tenant:
                tenant_id = dev_tenant
                user_role = request.headers.get("X-User-Role", "admin")

        if not tenant_id and path.startswith("/api/v1"):
            return JSONResponse(
                status_code=401,
                content={"code": "UNAUTHORIZED", "message": "Missing valid tenant token"},
            )

        request.state.tenant_id = tenant_id or "00000000-0000-0000-0000-000000000001"
        request.state.user_role = user_role

        return await call_next(request)
