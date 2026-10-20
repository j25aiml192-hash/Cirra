import uuid
from sqlalchemy import Column, String, Numeric, Integer, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    amount_limit = Column(Numeric(14, 2), nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    alert_threshold_pct = Column(Integer, default=85, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
