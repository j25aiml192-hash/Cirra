"""Create smart_rules table with RLS enforcement

Revision ID: 009_smart_rules
Revises: 008_settings
Create Date: 2026-11-14 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "009_smart_rules"
down_revision = "008_settings"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "smart_rules",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "tenant_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tenants.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("condition_type", sa.String(), nullable=False),
        sa.Column("threshold_value", sa.Float(), nullable=True),
        sa.Column("unit", sa.String(), nullable=True),
        sa.Column("scope", sa.String(), nullable=True, server_default="per_model"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "last_evaluation_status",
            sa.String(),
            nullable=True,
            server_default="not_triggered",
        ),
        sa.Column("last_evaluation_message", sa.Text(), nullable=True),
        sa.Column("last_evaluated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_smart_rules_tenant_id", "smart_rules", ["tenant_id"])
    op.create_index("ix_smart_rules_condition_type", "smart_rules", ["tenant_id", "condition_type"])

    # Row Level Security (RLS) - Permissive policy
    op.execute("ALTER TABLE smart_rules ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE smart_rules FORCE ROW LEVEL SECURITY;")
    op.execute("""
        CREATE POLICY tenant_isolation_smart_rules ON smart_rules
        USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
        WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
    """)


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS tenant_isolation_smart_rules ON smart_rules;")
    op.execute("ALTER TABLE smart_rules NO FORCE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE smart_rules DISABLE ROW LEVEL SECURITY;")
    op.drop_table("smart_rules")

