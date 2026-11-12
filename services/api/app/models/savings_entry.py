import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Text, Numeric, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class SavingsEntry(Base):
    __tablename__ = "savings_entries"
    __table_args__ = (
        CheckConstraint("method IN ('unit_cost', 'counterfactual')", name="check_savings_method"),
        CheckConstraint("confidence IN ('exact', 'estimated', 'approximate')", name="check_savings_confidence"),
        CheckConstraint("status IN ('identified', 'approved', 'executed', 'verified', 'realized')", name="check_savings_status"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    action_id = Column(UUID(as_uuid=True), ForeignKey("actions.id", ondelete="SET NULL"), nullable=True)
    anomaly_id = Column(UUID(as_uuid=True), ForeignKey("anomalies.id", ondelete="SET NULL"), nullable=True)
    method = Column(Text, nullable=False)
    baseline_cost = Column(Numeric(18, 6), nullable=False)
    realized_cost = Column(Numeric(18, 6), nullable=True)
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=True)
    currency = Column(Text, default="USD", nullable=False)
    confidence = Column(Text, nullable=True)
    status = Column(Text, default="identified", nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    tenant = relationship("Tenant", back_populates="savings_entries")
    action = relationship("Action", back_populates="savings_entries")
    anomaly = relationship("Anomaly", back_populates="savings_entries")

