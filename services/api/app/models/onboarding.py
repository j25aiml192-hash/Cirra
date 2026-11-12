import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Boolean, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from app.core.database import Base


class OnboardingState(Base):
    __tablename__ = "onboarding_state"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, unique=True)
    current_step = Column(Integer, nullable=False, default=1)
    completed_steps = Column(ARRAY(Integer), nullable=False, default=list)
    company_name = Column(Text, nullable=True)
    company_size = Column(Text, nullable=True)
    primary_use_case = Column(Text, nullable=True)
    step1_completed = Column(Boolean, nullable=False, default=False)
    step2_completed = Column(Boolean, nullable=False, default=False)
    step3_completed = Column(Boolean, nullable=False, default=False)
    step4_completed = Column(Boolean, nullable=False, default=False)
    wizard_completed = Column(Boolean, nullable=False, default=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), default=lambda: datetime.now(timezone.utc), nullable=False)

    tenant = relationship("Tenant", back_populates="onboarding_state")
