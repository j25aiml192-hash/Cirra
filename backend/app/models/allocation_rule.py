import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class AllocationRule(Base):
    __tablename__ = "allocation_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    priority = Column(Integer, default=0, nullable=False)
    match_type = Column(String, nullable=False)
    match_value = Column(String, nullable=False)
    assign_team = Column(String, nullable=True)
    assign_customer = Column(String, nullable=True)
    assign_feature = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
