"""Create anomalies table with RLS enforcement

Revision ID: 003_anomalies
Revises: 002_allocation_rules
Create Date: 2026-11-13 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "003_anomalies"
down_revision = "002_allocation_rules"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "anomalies",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("series_key", sa.Text(), nullable=False),
        sa.Column("provider", sa.Text(), nullable=False),
        sa.Column("api_key_id", sa.Text(), nullable=True),
        sa.Column("detected_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("severity", sa.Text(), nullable=False),
        sa.Column("status", sa.Text(), server_default="open", nullable=False),
        sa.Column("baseline_value", sa.Numeric(18, 6), nullable=True),
        sa.Column("actual_value", sa.Numeric(18, 6), nullable=True),
        sa.Column("deviation_pct", sa.Numeric(10, 4), nullable=True),
        sa.Column("explanation", sa.Text(), nullable=True),
        sa.Column("alert_sent", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("call_triggered", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("severity IN ('low', 'medium', 'high', 'critical')", name="check_anomaly_severity"),
        sa.CheckConstraint("status IN ('open', 'acknowledged', 'resolved', 'snoozed')", name="check_anomaly_status"),
    )
    op.create_index("ix_anomalies_tenant_id", "anomalies", ["tenant_id"])
    op.create_index("ix_anomalies_series_key", "anomalies", ["tenant_id", "series_key"])
    op.create_index("ix_anomalies_detected_at", "anomalies", ["tenant_id", "detected_at"])

    # Row Level Security (RLS)
    op.execute("ALTER TABLE anomalies ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE anomalies FORCE ROW LEVEL SECURITY;")
    op.execute("""
        CREATE POLICY tenant_isolation_anomalies ON anomalies
        AS RESTRICTIVE
        USING (tenant_id = current_setting('app.tenant_id')::uuid)
        WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
    """)


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS tenant_isolation_anomalies ON anomalies;")
    op.execute("ALTER TABLE anomalies NO FORCE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE anomalies DISABLE ROW LEVEL SECURITY;")
    op.drop_table("anomalies")

