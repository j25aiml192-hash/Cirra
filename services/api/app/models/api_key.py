import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Boolean, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=True)
    key_hash = Column(String, nullable=False)
    prefix = Column(String, nullable=True)
    provider = Column(Text, nullable=True)
    label = Column(Text, nullable=True)
    encrypted_key = Column(Text, nullable=True)
    status = Column(Text, default="active", nullable=True)
    source = Column(Text, default="manual", nullable=True)
    last_tested_at = Column(DateTime(timezone=True), nullable=True)
    last_test_status = Column(Text, nullable=True)
    monthly_spend_cap = Column(Numeric(12, 2), nullable=True)
    is_monitored = Column(Boolean, default=True, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    tenant = relationship("Tenant", back_populates="api_keys")
