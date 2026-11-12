import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Text, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base


class Action(Base):
    __tablename__ = "actions"
    __table_args__ = (
        CheckConstraint("type IN ('kill_switch', 'spend_cap', 'github_pr', 'scheduled_shutdown')", name="check_action_type"),
        CheckConstraint("status IN ('proposed', 'dry_run', 'approved', 'executing', 'executed', 'verified', 'rolled_back', 'failed')", name="check_action_status"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    anomaly_id = Column(UUID(as_uuid=True), ForeignKey("anomalies.id", ondelete="SET NULL"), nullable=True)
    type = Column(Text, nullable=False)
    status = Column(Text, nullable=False, default="proposed")
    provider = Column(Text, nullable=True)
    target_key_id = Column(Text, nullable=True)
    proposal_json = Column(JSONB, nullable=True)
    dry_run_result_json = Column(JSONB, nullable=True)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    executed_at = Column(DateTime(timezone=True), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    rolled_back_at = Column(DateTime(timezone=True), nullable=True)
    github_pr_url = Column(Text, nullable=True)
    audit_log = Column(JSONB, default=list, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    tenant = relationship("Tenant", back_populates="actions")
    anomaly = relationship("Anomaly", back_populates="actions")
    approver = relationship("User", foreign_keys=[approved_by])
    savings_entries = relationship("SavingsEntry", back_populates="action")

