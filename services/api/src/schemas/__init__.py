from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, ConfigDict

Provider = Literal[
    "aws", "gcp", "azure", "kubernetes", "openai", "anthropic", "bedrock", "vertex", "stripe"
]
UserRole = Literal["owner", "admin", "viewer"]
ConnectionStatus = Literal["connected", "disconnected", "pending", "error", "syncing"]
AllocationMethod = Literal[
    "tag_exact", "pro_rata", "fixed_percentage", "unallocated", "rule_based", "heuristic"
]
AnomalySeverity = Literal["critical", "high", "medium", "low"]
AnomalyStatus = Literal["active", "investigating", "resolved", "dismissed"]
ActionStatus = Literal[
    "proposed", "pending_approval", "approved", "executing", "completed", "failed", "rolled_back"
]


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class DashboardTopService(BaseSchema):
    serviceName: str
    provider: Provider
    cost: float
    pctTotal: float


class DailySpendPoint(BaseSchema):
    date: str
    cloudCost: float
    aiCost: float
    totalCost: float


class DashboardSummaryResponse(BaseSchema):
    tenantId: str
    totalSpendMonthToDate: float
    projectedMonthEndSpend: float
    cloudSpendMonthToDate: float
    aiSpendMonthToDate: float
    spendChangePercentage: float
    activeAnomaliesCount: int
    potentialSavingsEstimate: float
    topServices: List[DashboardTopService]
    dailySpendTrend: List[DailySpendPoint]


class SpendFiltersRequest(BaseSchema):
    startDate: str
    endDate: str
    providers: Optional[List[Provider]] = None
    services: Optional[List[str]] = None
    teams: Optional[List[str]] = None
    customers: Optional[List[str]] = None
    features: Optional[List[str]] = None
    groupBy: Optional[Literal["day", "week", "month", "service", "provider", "team"]] = None


class SpendBreakdownItem(BaseSchema):
    key: str
    provider: Optional[Provider] = None
    cost: float
    billedCost: float
    effectiveCost: float
    percentage: float


class SpendResponse(BaseSchema):
    totalCost: float
    billedCost: float
    effectiveCost: float
    currency: str = "USD"
    timeSeries: List[Dict[str, Any]]
    breakdown: List[SpendBreakdownItem]


class AiSpendRowResponse(BaseSchema):
    model: str
    provider: Provider
    apiKeyId: str
    inputTokens: int
    outputTokens: int
    totalTokens: int
    costUsd: float
    teamTag: Optional[str] = None
    customerTag: Optional[str] = None
    featureTag: Optional[str] = None
    requestCount: Optional[int] = None


class ConnectionResponse(BaseSchema):
    id: str
    tenantId: str
    name: str
    provider: Provider
    status: ConnectionStatus
    lastSyncedAt: Optional[datetime] = None
    errorMessage: Optional[str] = None
    configMetadata: Optional[Dict[str, Any]] = None
    createdAt: datetime
    updatedAt: datetime


class CreateConnectionRequest(BaseSchema):
    name: str
    provider: Provider
    credentials: Dict[str, str]
    syncScheduleHours: Optional[int] = 4


class TestConnectionResponse(BaseSchema):
    success: bool = True
    message: str
    latencyMs: Optional[float] = None


class AskRequest(BaseSchema):
    question: str
    conversationId: Optional[str] = None


class AskResponse(BaseSchema):
    answer: str
    sql: str
    rows: List[Dict[str, Any]]
    confidence: float
    warning: Optional[str] = None


class AllocationRuleResponse(BaseSchema):
    id: str
    tenantId: str
    name: str
    priority: int
    method: AllocationMethod
    tagKey: Optional[str] = None
    targetDimension: Literal["team", "customer", "feature"]
    targetValue: str
    filterConditions: Dict[str, Any]
    createdAt: datetime
    updatedAt: datetime


class AnomalyResponse(BaseSchema):
    id: str
    tenantId: str
    serviceName: str
    provider: Provider
    detectedAt: datetime
    severity: AnomalySeverity
    status: AnomalyStatus
    baselineSpend: float
    actualSpend: float
    spikePercentage: float
    explanation: str
    rootCauseCandidate: Optional[str] = None


class ActionResponse(BaseSchema):
    id: str
    tenantId: str
    title: str
    description: str
    provider: Provider
    actionType: str
    estimatedMonthlySavings: float
    status: ActionStatus
    proposedBy: str
    approvedBy: Optional[str] = None
    executedAt: Optional[datetime] = None
    createdAt: datetime


class SavingsEntryResponse(BaseSchema):
    id: str
    tenantId: str
    category: str
    title: str
    description: str
    potentialMonthlySavingsUsd: float
    realizedMonthlySavingsUsd: float
    effort: Literal["low", "medium", "high"]
    status: Literal["identified", "in_progress", "realized", "ignored"]
    detectedAt: datetime


class ApiErrorResponse(BaseSchema):
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None
