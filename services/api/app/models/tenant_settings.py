import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Text, Integer, Boolean, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class TenantSettings(Base):
    __tablename__ = "tenant_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, unique=True)
    alert_phone = Column(Text, nullable=True)
    slack_webhook_url = Column(Text, nullable=True)
    ntfy_topic_url = Column(Text, nullable=True)
    spend_cap_usd = Column(Numeric(12, 2), nullable=True)
    quiet_hours_start = Column(Integer, nullable=True)
    quiet_hours_end = Column(Integer, nullable=True)
    quiet_hours_tz = Column(Text, default="Asia/Kolkata", nullable=False)
    voice_calls_enabled = Column(Boolean, default=True, nullable=False)
    slack_enabled = Column(Boolean, default=True, nullable=False)
    ntfy_enabled = Column(Boolean, default=True, nullable=False)
    email_enabled = Column(Boolean, default=False, nullable=False)
    alert_email = Column(Text, nullable=True)
    min_severity_voice = Column(Text, default="critical", nullable=False)
    min_severity_slack = Column(Text, default="medium", nullable=False)
    anomaly_cooldown_minutes = Column(Integer, default=60, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    tenant = relationship("Tenant", back_populates="settings")
