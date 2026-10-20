"""Add allocation_rules table with RLS enforcement

Revision ID: 002_allocation_rules
Revises: 001_initial_schema
Create Date: 2026-10-20 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "002_allocation_rules"
down_revision = "001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "allocation_rules",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("priority", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("match_type", sa.String(), nullable=False),
        sa.Column("match_value", sa.String(), nullable=False),
        sa.Column("assign_team", sa.String(), nullable=True),
        sa.Column("assign_customer", sa.String(), nullable=True),
        sa.Column("assign_feature", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_allocation_rules_tenant_id", "allocation_rules", ["tenant_id"])
    op.create_index("ix_allocation_rules_priority", "allocation_rules", ["tenant_id", "priority"])

    # Row Level Security (RLS)
    op.execute("ALTER TABLE allocation_rules ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE allocation_rules FORCE ROW LEVEL SECURITY;")
    op.execute("""
        CREATE POLICY tenant_isolation_allocation_rules ON allocation_rules
        AS RESTRICTIVE
        USING (tenant_id = current_setting('app.tenant_id')::uuid)
        WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
    """)


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS tenant_isolation_allocation_rules ON allocation_rules;")
    op.execute("ALTER TABLE allocation_rules NO FORCE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE allocation_rules DISABLE ROW LEVEL SECURITY;")
    op.drop_table("allocation_rules")
