from fastapi import APIRouter
from src.routers.auth import router as auth_router
from src.routers.dashboard import router as dashboard_router
from src.routers.spend import router as spend_router
from src.routers.connections import router as connections_router
from src.routers.ask import router as ask_router
from src.routers.allocation import router as allocation_router
from src.routers.anomalies import router as anomalies_router
from src.routers.budgets import router as budgets_router
from src.routers.actions import router as actions_router
from src.routers.savings import router as savings_router
from src.routers.audit import router as audit_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Auth"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(spend_router, prefix="/spend", tags=["Spend"])
api_router.include_router(connections_router, prefix="/connections", tags=["Connections"])
api_router.include_router(ask_router, prefix="/ask", tags=["Ask Cirra"])
api_router.include_router(allocation_router, prefix="/allocation", tags=["Allocation"])
api_router.include_router(anomalies_router, prefix="/anomalies", tags=["Anomalies"])
api_router.include_router(budgets_router, prefix="/budgets", tags=["Budgets"])
api_router.include_router(actions_router, prefix="/actions", tags=["Actions"])
api_router.include_router(savings_router, prefix="/savings", tags=["Savings"])
api_router.include_router(audit_router, prefix="/audit", tags=["Audit"])
