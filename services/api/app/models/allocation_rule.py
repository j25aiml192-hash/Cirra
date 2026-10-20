import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class AllocationRule(Base):
    __tablename__ = "allocation_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    priority = Column(Integer, nullable=False, default=1)
    name = Column(String, nullable=True)
    match_type = Column(String, nullable=False)  # tag_key_value, account_id, name_regex, service (or tag, prefix, regex)
    match_value = Column(String, nullable=False)
    assign_team = Column(String, nullable=True)
    assign_customer = Column(String, nullable=True)
    assign_feature = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    tenant = relationship("Tenant", back_populates="allocation_rules")
