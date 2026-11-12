"""Create actions table with RLS enforcement

Revision ID: 004_actions
Revises: 003_anomalies
Create Date: 2026-11-13 00:01:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "004_actions"
down_revision = "003_anomalies"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "actions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("anomaly_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("anomalies.id", ondelete="SET NULL"), nullable=True),
        sa.Column("type", sa.Text(), nullable=False),
        sa.Column("status", sa.Text(), server_default="proposed", nullable=False),
        sa.Column("provider", sa.Text(), nullable=True),
        sa.Column("target_key_id", sa.Text(), nullable=True),
        sa.Column("proposal_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("dry_run_result_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("approved_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("executed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rolled_back_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("github_pr_url", sa.Text(), nullable=True),
        sa.Column("audit_log", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'[]'::jsonb"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("type IN ('kill_switch', 'spend_cap', 'github_pr', 'scheduled_shutdown')", name="check_action_type"),
        sa.CheckConstraint("status IN ('proposed', 'dry_run', 'approved', 'executing', 'executed', 'verified', 'rolled_back', 'failed')", name="check_action_status"),
    )
    op.create_index("ix_actions_tenant_id", "actions", ["tenant_id"])
    op.create_index("ix_actions_anomaly_id", "actions", ["anomaly_id"])
    op.create_index("ix_actions_status", "actions", ["tenant_id", "status"])

    # Row Level Security (RLS)
    op.execute("ALTER TABLE actions ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE actions FORCE ROW LEVEL SECURITY;")
    op.execute("""
        CREATE POLICY tenant_isolation_actions ON actions
        AS RESTRICTIVE
        USING (tenant_id = current_setting('app.tenant_id')::uuid)
        WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
    """)


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS tenant_isolation_actions ON actions;")
    op.execute("ALTER TABLE actions NO FORCE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE actions DISABLE ROW LEVEL SECURITY;")
    op.drop_table("actions")

