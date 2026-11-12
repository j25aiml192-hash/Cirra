import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Text, Integer, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base


class VoiceCall(Base):
    __tablename__ = "voice_calls"
    __table_args__ = (
        CheckConstraint(
            "status IN ('initiated', 'ringing', 'in-progress', 'completed', 'failed', 'no-answer', 'busy')",
            name="check_voice_call_status",
        ),
        CheckConstraint(
            "outcome IS NULL OR outcome IN ('acknowledged', 'escalated', 'no-response', 'failed', 'completed', 'continuing')",
            name="check_voice_call_outcome",
        ),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    anomaly_id = Column(UUID(as_uuid=True), ForeignKey("anomalies.id", ondelete="SET NULL"), nullable=True)
    call_sid = Column(Text, unique=True, nullable=True)
    provider = Column(Text, nullable=False, default="twilio")
    status = Column(Text, nullable=False, default="initiated")
    to_number = Column(Text, nullable=False)
    from_number = Column(Text, nullable=False)
    duration_seconds = Column(Integer, nullable=True)
    turn_count = Column(Integer, nullable=False, default=0)
    transcript = Column(JSONB, nullable=False, default=list)
    anomaly_snapshot = Column(JSONB, nullable=True)
    outcome = Column(Text, nullable=True)
    initiated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    answered_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    retry_count = Column(Integer, nullable=False, default=0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    tenant = relationship("Tenant", back_populates="voice_calls")
    anomaly = relationship("Anomaly", backref="voice_calls")

