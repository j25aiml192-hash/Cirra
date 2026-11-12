import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Text, Numeric, Boolean, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Anomaly(Base):
    __tablename__ = "anomalies"
    __table_args__ = (
        CheckConstraint("severity IN ('low', 'medium', 'high', 'critical')", name="check_anomaly_severity"),
        CheckConstraint("status IN ('open', 'acknowledged', 'resolved', 'snoozed')", name="check_anomaly_status"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    series_key = Column(Text, nullable=False)
    provider = Column(Text, nullable=False)
    api_key_id = Column(Text, nullable=True)
    detected_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    severity = Column(Text, nullable=False)
    status = Column(Text, nullable=False, default="open")
    baseline_value = Column(Numeric(18, 6), nullable=True)
    actual_value = Column(Numeric(18, 6), nullable=True)
    deviation_pct = Column(Numeric(10, 4), nullable=True)
    explanation = Column(Text, nullable=True)
    alert_sent = Column(Boolean, default=False, nullable=False)
    call_triggered = Column(Boolean, default=False, nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    tenant = relationship("Tenant", back_populates="anomalies")
    actions = relationship("Action", back_populates="anomaly")
    savings_entries = relationship("SavingsEntry", back_populates="anomaly")

