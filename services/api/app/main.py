from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.database import engine, verify_non_superuser_role
from app.core.redis import close_redis
from app.middleware.error_handler import (
    http_exception_handler,
    validation_exception_handler,
    unhandled_exception_handler,
)
from app.middleware.onboarding_guard import OnboardingGuard
from app.routers import (
    auth,
    connections,
    team,
    health,
    dashboard,
    spend,
    allocation,
    anomalies,
    ask,
    actions,
    savings,
    voice,
    voice_webhooks,
    settings as settings_router,
    onboarding,
    dev,
    demo,
    inject,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks: verify non-superuser role so RLS is strictly enforced
    await verify_non_superuser_role()
    yield
    # Shutdown tasks
    await close_redis()
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware
cors_origins = list(settings.CORS_ORIGINS)
for origin in [
    "https://cirra-frontend.vercel.app",
    "https://*.vercel.app",
]:
    if origin not in cors_origins:
        cors_origins.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(OnboardingGuard)

# Custom error handlers for consistent error response format: {error: {code, message}}
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

# Root health endpoints (/health and /ready)
app.include_router(health.router)

# Versioned API routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(connections.router, prefix=settings.API_V1_PREFIX)
app.include_router(team.router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_V1_PREFIX)
app.include_router(spend.router, prefix=settings.API_V1_PREFIX)
app.include_router(allocation.router, prefix=settings.API_V1_PREFIX)
app.include_router(anomalies.router, prefix=settings.API_V1_PREFIX)
app.include_router(ask.router, prefix=settings.API_V1_PREFIX)
app.include_router(ask.router)
app.include_router(actions.router, prefix=settings.API_V1_PREFIX)
app.include_router(actions.router)
app.include_router(savings.router, prefix=settings.API_V1_PREFIX)
app.include_router(savings.router)
app.include_router(voice.router)
app.include_router(voice_webhooks.router)
app.include_router(settings_router.router, prefix=settings.API_V1_PREFIX)
app.include_router(settings_router.router)
app.include_router(onboarding.router, prefix=settings.API_V1_PREFIX)
app.include_router(onboarding.router)
app.include_router(dev.router, prefix=settings.API_V1_PREFIX)
app.include_router(dev.router)
app.include_router(demo.router, prefix="/demo")
app.include_router(inject.router, prefix="/inject", tags=["inject"])
app.include_router(inject.router, prefix=settings.API_V1_PREFIX + "/inject", tags=["inject"])
