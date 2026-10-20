"""001_initial_schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-20 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

RLS_TABLES = [
    "users",
    "api_keys",
    "connections",
    "allocation_rules",
    "anomalies",
    "budgets",
    "actions",
    "savings_entries",
]


def upgrade() -> None:
    # Enable pgvector if available
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")

    # 1. Tenants table
    op.create_table(
        'tenants',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=100), nullable=False, unique=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False)
    )

    # 2. Users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('email', sa.String(length=255), nullable=False, index=True),
        sa.Column('hashed_password', sa.String(length=255), nullable=True),
        sa.Column('name', sa.String(length=255), nullable=True),
        sa.Column('role', sa.String(length=50), nullable=False, server_default='viewer'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False)
    )

    # 3. Api Keys table
    op.create_table(
        'api_keys',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('key_prefix', sa.String(length=16), nullable=False),
        sa.Column('hashed_secret', sa.String(length=255), nullable=False),
        sa.Column('team_tag', sa.String(length=100), nullable=True),
        sa.Column('customer_tag', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True)
    )

    # 4. Connections table
    op.create_table(
        'connections',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('provider', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='pending'),
        sa.Column('encrypted_credentials', sa.Text(), nullable=False),
        sa.Column('last_synced_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('config_metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False)
    )

    # 5. Allocation Rules table
    op.create_table(
        'allocation_rules',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('priority', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('method', sa.String(length=50), nullable=False),
        sa.Column('tag_key', sa.String(length=100), nullable=True),
        sa.Column('target_dimension', sa.String(length=50), nullable=False),
        sa.Column('target_value', sa.String(length=255), nullable=False),
        sa.Column('filter_conditions', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False)
    )

    # 6. Anomalies table
    op.create_table(
        'anomalies',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('service_name', sa.String(length=255), nullable=False),
        sa.Column('provider', sa.String(length=50), nullable=False),
        sa.Column('detected_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('severity', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='active'),
        sa.Column('baseline_spend', sa.Numeric(precision=14, scale=4), nullable=False),
        sa.Column('actual_spend', sa.Numeric(precision=14, scale=4), nullable=False),
        sa.Column('spike_percentage', sa.Numeric(precision=8, scale=2), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=False),
        sa.Column('root_cause_candidate', sa.Text(), nullable=True)
    )

    # 7. Budgets table
    op.create_table(
        'budgets',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('amount_limit', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=10), nullable=False, server_default='USD'),
        sa.Column('period', sa.String(length=50), nullable=False, server_default='monthly'),
        sa.Column('dimension_type', sa.String(length=50), nullable=True),
        sa.Column('dimension_value', sa.String(length=255), nullable=True),
        sa.Column('alert_threshold_pct', sa.Integer(), nullable=False, server_default='85'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False)
    )

    # 8. Actions table
    op.create_table(
        'actions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('provider', sa.String(length=50), nullable=False),
        sa.Column('action_type', sa.String(length=100), nullable=False),
        sa.Column('estimated_monthly_savings', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='proposed'),
        sa.Column('proposed_by', sa.String(length=255), nullable=False),
        sa.Column('approved_by', sa.String(length=255), nullable=True),
        sa.Column('executed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False)
    )

    # 9. Savings Entries table
    op.create_table(
        'savings_entries',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('potential_monthly_savings_usd', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('realized_monthly_savings_usd', sa.Numeric(precision=14, scale=2), nullable=False, server_default='0.0'),
        sa.Column('effort', sa.String(length=50), nullable=False, server_default='medium'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='identified'),
        sa.Column('detected_at', sa.DateTime(timezone=True), nullable=False)
    )

    # Enforce Row Level Security (RLS) on all tenant-specific tables
    for tbl in RLS_TABLES:
        op.execute(f"ALTER TABLE {tbl} ENABLE ROW LEVEL SECURITY;")
        op.execute(f"""
            CREATE POLICY tenant_isolation ON {tbl}
            USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
        """)


def downgrade() -> None:
    for tbl in reversed(RLS_TABLES):
        op.execute(f"DROP POLICY IF EXISTS tenant_isolation ON {tbl};")
        op.drop_table(tbl)
    op.drop_table('tenants')
