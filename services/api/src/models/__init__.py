import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    Numeric,
    Integer,
    ForeignKey,
    JSON,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from src.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    connections = relationship("Connection", back_populates="tenant", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    hashed_password = Column(String(255), nullable=True)
    name = Column(String(255), nullable=True)
    role = Column(String(50), default="viewer", nullable=False)  # owner | admin | viewer
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    tenant = relationship("Tenant", back_populates="users")


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    key_prefix = Column(String(16), nullable=False)
    hashed_secret = Column(String(255), nullable=False)
    team_tag = Column(String(100), nullable=True)
    customer_tag = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    last_used_at = Column(DateTime(timezone=True), nullable=True)


class Connection(Base):
    __tablename__ = "connections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    provider = Column(String(50), nullable=False)  # aws | gcp | azure | openai | anthropic
    status = Column(String(50), default="pending", nullable=False)
    encrypted_credentials = Column(Text, nullable=False)  # AES-256-GCM
    last_synced_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    config_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    tenant = relationship("Tenant", back_populates="connections")


class AllocationRule(Base):
    __tablename__ = "allocation_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    priority = Column(Integer, default=1, nullable=False)
    method = Column(String(50), nullable=False)  # tag_exact | pro_rata | fixed_percentage | rule_based
    tag_key = Column(String(100), nullable=True)
    target_dimension = Column(String(50), nullable=False)  # team | customer | feature
    target_value = Column(String(255), nullable=False)
    filter_conditions = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    service_name = Column(String(255), nullable=False)
    provider = Column(String(50), nullable=False)
    detected_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    severity = Column(String(50), default="medium", nullable=False)  # critical | high | medium | low
    status = Column(String(50), default="active", nullable=False)  # active | investigating | resolved | dismissed
    baseline_spend = Column(Numeric(14, 4), nullable=False)
    actual_spend = Column(Numeric(14, 4), nullable=False)
    spike_percentage = Column(Numeric(8, 2), nullable=False)
    explanation = Column(Text, nullable=False)
    root_cause_candidate = Column(Text, nullable=True)


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    amount_limit = Column(Numeric(14, 2), nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    period = Column(String(50), default="monthly", nullable=False)  # monthly | quarterly | annual
    dimension_type = Column(String(50), nullable=True)  # team | service | provider
    dimension_value = Column(String(255), nullable=True)
    alert_threshold_pct = Column(Integer, default=85, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class Action(Base):
    __tablename__ = "actions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    provider = Column(String(50), nullable=False)
    action_type = Column(String(100), nullable=False)  # scale_down | delete_idle | migrate_tier | purchase_commitment | revoke_key
    estimated_monthly_savings = Column(Numeric(14, 2), nullable=False)
    status = Column(String(50), default="proposed", nullable=False)  # proposed | pending_approval | approved | executing | completed | failed | rolled_back
    proposed_by = Column(String(255), nullable=False)
    approved_by = Column(String(255), nullable=True)
    executed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class SavingsEntry(Base):
    __tablename__ = "savings_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(100), nullable=False)  # idle_resources | rightsizing | commitments | ai_caching | prompt_optimization
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    potential_monthly_savings_usd = Column(Numeric(14, 2), nullable=False)
    realized_monthly_savings_usd = Column(Numeric(14, 2), default=0.0, nullable=False)
    effort = Column(String(50), default="medium", nullable=False)  # low | medium | high
    status = Column(String(50), default="identified", nullable=False)  # identified | in_progress | realized | ignored
    detected_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
