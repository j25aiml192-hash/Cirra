import uuid
from sqlalchemy import Column, String, Numeric, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class SavingsEntry(Base):
    __tablename__ = "savings_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    action_id = Column(UUID(as_uuid=True), ForeignKey("actions.id"), nullable=True)
    method = Column(String, nullable=False)
    baseline_cost = Column(Numeric(12, 4), nullable=True)
    realized_cost = Column(Numeric(12, 4), nullable=True)
    period_start = Column(Date, nullable=True)
    period_end = Column(Date, nullable=True)
    confidence = Column(Numeric(4, 3), nullable=True)
    status = Column(String, default="identified", nullable=False)
