from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.core.config import settings
from src.core.database import engine
from src.middleware.tenant import TenantIsolationMiddleware
from src.routers import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database connection pool
    yield
    # Shutdown: dispose database pool
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Multi-tenant isolation middleware
app.add_middleware(TenantIsolationMiddleware)

# API Routers
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }


@app.get("/", tags=["Root"])
async def root():
    return {
        "service": "Cirra Control Plane API",
        "docs": "/docs",
        "status": "operational",
    }
