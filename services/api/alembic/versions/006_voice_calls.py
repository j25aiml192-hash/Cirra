"""Create voice_calls table with RLS enforcement

Revision ID: 006_voice_calls
Revises: 005_savings
Create Date: 2026-11-13 03:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "006_voice_calls"
down_revision = "005_savings"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "voice_calls",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("anomaly_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("anomalies.id", ondelete="SET NULL"), nullable=True),
        sa.Column("call_sid", sa.Text(), unique=True, nullable=True),
        sa.Column("provider", sa.Text(), server_default="twilio", nullable=False),
        sa.Column("status", sa.Text(), server_default="initiated", nullable=False),
        sa.Column("to_number", sa.Text(), nullable=False),
        sa.Column("from_number", sa.Text(), nullable=False),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("turn_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("transcript", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'[]'::jsonb"), nullable=False),
        sa.Column("anomaly_snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("outcome", sa.Text(), nullable=True),
        sa.Column("initiated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("answered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("retry_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "status IN ('initiated', 'ringing', 'in-progress', 'completed', 'failed', 'no-answer', 'busy')",
            name="check_voice_call_status",
        ),
        sa.CheckConstraint(
            "outcome IS NULL OR outcome IN ('acknowledged', 'escalated', 'no-response', 'failed', 'completed', 'continuing')",
            name="check_voice_call_outcome",
        ),
    )
    op.create_index("ix_voice_calls_tenant_initiated", "voice_calls", ["tenant_id", sa.text("initiated_at DESC")])
    op.create_index("ix_voice_calls_call_sid", "voice_calls", ["call_sid"])
    op.create_index("ix_voice_calls_anomaly_id", "voice_calls", ["anomaly_id"])

    # Row Level Security (RLS)
    op.execute("ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE voice_calls FORCE ROW LEVEL SECURITY;")
    op.execute("""
        CREATE POLICY tenant_isolation_voice_calls ON voice_calls
        AS PERMISSIVE
        USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
        WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
    """)


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS tenant_isolation_voice_calls ON voice_calls;")
    op.drop_index("ix_voice_calls_anomaly_id", table_name="voice_calls")
    op.drop_index("ix_voice_calls_call_sid", table_name="voice_calls")
    op.drop_index("ix_voice_calls_tenant_initiated", table_name="voice_calls")
    op.drop_table("voice_calls")

