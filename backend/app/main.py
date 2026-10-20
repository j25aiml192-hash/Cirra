from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.database import init_db
from app.routers import (
    auth, dashboard, spend, connections,
    ask, allocation, anomalies, budgets,
    actions, savings, audit, settings
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title="Cirra API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}

for router in [auth, dashboard, spend, connections, ask,
               allocation, anomalies, budgets, actions,
               savings, audit, settings]:
    app.include_router(router.router, prefix="/api/v1")
