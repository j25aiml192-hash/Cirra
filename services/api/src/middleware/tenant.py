from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from src.core.security import verify_token

# Public paths that do not require tenant authentication
EXEMPT_PATHS = {
    "/",
    "/health",
    "/docs",
    "/openapi.json",
    "/redoc",
    "/api/v1/auth/login",
    "/api/v1/auth/signup",
}


class TenantIsolationMiddleware(BaseHTTPMiddleware):
    """
    Middleware that decodes JWT, extracts tenant_id, and attaches it to request.state.
    Enforces tenant context across all /api/v1 endpoints.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path

        if path in EXEMPT_PATHS or request.method == "OPTIONS":
            return await call_next(request)

        auth_header = request.headers.get("Authorization")
        tenant_id = None
        user_role = "viewer"
        user_id = None

        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]
            payload = verify_token(token)
            if payload:
                tenant_id = payload.get("tenant_id")
                user_role = payload.get("role", "viewer")
                user_id = payload.get("sub")

        # Allow fallback header in dev or internal service-to-service calls
        if not tenant_id:
            dev_tenant = request.headers.get("X-Tenant-ID")
            if dev_tenant:
                tenant_id = dev_tenant
                user_role = request.headers.get("X-User-Role", "admin")

        if not tenant_id and path.startswith("/api/v1"):
            return JSONResponse(
                status_code=401,
                content={
                    "code": "UNAUTHORIZED",
                    "message": "Missing or invalid authorization token with tenant context",
                },
            )

        request.state.tenant_id = tenant_id
        request.state.user_role = user_role
        request.state.user_id = user_id

        return await call_next(request)
