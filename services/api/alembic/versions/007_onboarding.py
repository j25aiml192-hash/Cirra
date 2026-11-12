"""Create onboarding_state table and update tenants

Revision ID: 007_onboarding
Revises: 006_voice_calls
Create Date: 2026-11-13 04:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "007_onboarding"
down_revision = "006_voice_calls"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "onboarding_state",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("current_step", sa.Integer(), server_default="1", nullable=False),
        sa.Column("completed_steps", postgresql.ARRAY(sa.Integer()), server_default="{}", nullable=False),
        sa.Column("company_name", sa.Text(), nullable=True),
        sa.Column("company_size", sa.Text(), nullable=True),
        sa.Column("primary_use_case", sa.Text(), nullable=True),
        sa.Column("step1_completed", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("step2_completed", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("step3_completed", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("step4_completed", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("wizard_completed", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index("ix_onboarding_state_tenant_id", "onboarding_state", ["tenant_id"])

    # Row Level Security (RLS)
    op.execute("ALTER TABLE onboarding_state ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE onboarding_state FORCE ROW LEVEL SECURITY;")
    op.execute("""
        CREATE POLICY tenant_isolation_onboarding_state ON onboarding_state
        AS RESTRICTIVE
        USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
        WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
    """)

    # Update tenants table
    op.execute("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;")
    op.execute("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS setup_completed_at TIMESTAMPTZ;")


def downgrade() -> None:
    op.execute("ALTER TABLE tenants DROP COLUMN IF EXISTS setup_completed_at;")
    op.execute("ALTER TABLE tenants DROP COLUMN IF EXISTS onboarding_complete;")
    op.execute("DROP POLICY IF EXISTS tenant_isolation_onboarding_state ON onboarding_state;")
    op.drop_index("ix_onboarding_state_tenant_id", table_name="onboarding_state")
    op.drop_table("onboarding_state")

