import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base


class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    series_key = Column(String, nullable=False)
    detected_at = Column(DateTime(timezone=True), server_default=func.now())
    severity = Column(String, nullable=False)
    explanation_json = Column(JSONB, nullable=True)
    status = Column(String, default="open", nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
