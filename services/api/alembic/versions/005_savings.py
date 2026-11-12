"""Create savings_entries table with RLS enforcement

Revision ID: 005_savings
Revises: 004_actions
Create Date: 2026-11-13 00:02:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "005_savings"
down_revision = "004_actions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "savings_entries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("action_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("actions.id", ondelete="SET NULL"), nullable=True),
        sa.Column("anomaly_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("anomalies.id", ondelete="SET NULL"), nullable=True),
        sa.Column("method", sa.Text(), nullable=False),
        sa.Column("baseline_cost", sa.Numeric(18, 6), nullable=False),
        sa.Column("realized_cost", sa.Numeric(18, 6), nullable=True),
        sa.Column("period_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("period_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("currency", sa.Text(), server_default="USD", nullable=False),
        sa.Column("confidence", sa.Text(), nullable=True),
        sa.Column("status", sa.Text(), server_default="identified", nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("method IN ('unit_cost', 'counterfactual')", name="check_savings_method"),
        sa.CheckConstraint("confidence IN ('exact', 'estimated', 'approximate')", name="check_savings_confidence"),
        sa.CheckConstraint("status IN ('identified', 'approved', 'executed', 'verified', 'realized')", name="check_savings_status"),
    )
    op.create_index("ix_savings_entries_tenant_id", "savings_entries", ["tenant_id"])
    op.create_index("ix_savings_entries_action_id", "savings_entries", ["action_id"])
    op.create_index("ix_savings_entries_anomaly_id", "savings_entries", ["anomaly_id"])
    op.create_index("ix_savings_entries_status", "savings_entries", ["tenant_id", "status"])

    # Row Level Security (RLS)
    op.execute("ALTER TABLE savings_entries ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE savings_entries FORCE ROW LEVEL SECURITY;")
    op.execute("""
        CREATE POLICY tenant_isolation_savings_entries ON savings_entries
        AS RESTRICTIVE
        USING (tenant_id = current_setting('app.tenant_id')::uuid)
        WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
    """)


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS tenant_isolation_savings_entries ON savings_entries;")
    op.execute("ALTER TABLE savings_entries NO FORCE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE savings_entries DISABLE ROW LEVEL SECURITY;")
    op.drop_table("savings_entries")

