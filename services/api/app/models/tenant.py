import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    plan = Column(String, nullable=False, default="starter")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    onboarding_complete = Column(Boolean, default=False)
    setup_completed_at = Column(DateTime(timezone=True), nullable=True)

    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    api_keys = relationship("ApiKey", back_populates="tenant", cascade="all, delete-orphan")
    connections = relationship("Connection", back_populates="tenant", cascade="all, delete-orphan")
    allocation_rules = relationship("AllocationRule", back_populates="tenant", cascade="all, delete-orphan")
    anomalies = relationship("Anomaly", back_populates="tenant", cascade="all, delete-orphan")
    actions = relationship("Action", back_populates="tenant", cascade="all, delete-orphan")
    savings_entries = relationship("SavingsEntry", back_populates="tenant", cascade="all, delete-orphan")
    voice_calls = relationship("VoiceCall", back_populates="tenant", cascade="all, delete-orphan")
    onboarding_state = relationship("OnboardingState", back_populates="tenant", uselist=False, cascade="all, delete-orphan")
    settings = relationship("TenantSettings", back_populates="tenant", uselist=False, cascade="all, delete-orphan")
