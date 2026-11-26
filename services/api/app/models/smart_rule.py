import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class SmartRule(Base):
    __tablename__ = "smart_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
    )
    name = Column(String, nullable=False)
    condition_type = Column(String, nullable=False)
    threshold_value = Column(Float, nullable=True)
    unit = Column(String, nullable=True)
    scope = Column(String, nullable=True, default="per_model")
    is_active = Column(Boolean, nullable=False, default=True)
    last_evaluation_status = Column(String, nullable=True, default="not_triggered")
    last_evaluation_message = Column(String, nullable=True)
    last_evaluated_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    tenant = relationship("Tenant", lazy="selectin")
