"""Create tenant_settings table and update api_keys

Revision ID: 008_settings
Revises: 007_onboarding
Create Date: 2026-11-13 04:35:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "008_settings"
down_revision = "007_onboarding"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "tenant_settings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("alert_phone", sa.Text(), nullable=True),
        sa.Column("slack_webhook_url", sa.Text(), nullable=True),
        sa.Column("ntfy_topic_url", sa.Text(), nullable=True),
        sa.Column("spend_cap_usd", sa.Numeric(12, 2), nullable=True),
        sa.Column("quiet_hours_start", sa.Integer(), nullable=True),
        sa.Column("quiet_hours_end", sa.Integer(), nullable=True),
        sa.Column("quiet_hours_tz", sa.Text(), server_default="Asia/Kolkata", nullable=False),
        sa.Column("voice_calls_enabled", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("slack_enabled", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("ntfy_enabled", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("email_enabled", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("alert_email", sa.Text(), nullable=True),
        sa.Column("min_severity_voice", sa.Text(), server_default="critical", nullable=False),
        sa.Column("min_severity_slack", sa.Text(), server_default="medium", nullable=False),
        sa.Column("anomaly_cooldown_minutes", sa.Integer(), server_default="60", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index("ix_tenant_settings_tenant_id", "tenant_settings", ["tenant_id"])

    # Row Level Security (RLS)
    op.execute("ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE tenant_settings FORCE ROW LEVEL SECURITY;")
    op.execute("""
        CREATE POLICY tenant_isolation_tenant_settings ON tenant_settings
        AS RESTRICTIVE
        USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
        WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
    """)

    # Update api_keys table
    op.execute("ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS provider TEXT;")
    op.execute("ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS label TEXT;")
    op.execute("ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS encrypted_key TEXT;")
    op.execute("ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';")
    op.execute("ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';")
    op.execute("ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS last_tested_at TIMESTAMPTZ;")
    op.execute("ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS last_test_status TEXT;")
    op.execute("ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS monthly_spend_cap NUMERIC(12,2);")
    op.execute("ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS is_monitored BOOLEAN DEFAULT true;")
    op.execute("ALTER TABLE api_keys ALTER COLUMN name DROP NOT NULL;")
    op.execute("ALTER TABLE api_keys ALTER COLUMN prefix DROP NOT NULL;")


def downgrade() -> None:
    op.execute("ALTER TABLE api_keys DROP COLUMN IF EXISTS is_monitored;")
    op.execute("ALTER TABLE api_keys DROP COLUMN IF EXISTS monthly_spend_cap;")
    op.execute("ALTER TABLE api_keys DROP COLUMN IF EXISTS last_test_status;")
    op.execute("ALTER TABLE api_keys DROP COLUMN IF EXISTS last_tested_at;")
    op.execute("ALTER TABLE api_keys DROP COLUMN IF EXISTS source;")
    op.execute("ALTER TABLE api_keys DROP COLUMN IF EXISTS status;")
    op.execute("ALTER TABLE api_keys DROP COLUMN IF EXISTS encrypted_key;")
    op.execute("ALTER TABLE api_keys DROP COLUMN IF EXISTS label;")
    op.execute("ALTER TABLE api_keys DROP COLUMN IF EXISTS provider;")
    op.execute("DROP POLICY IF EXISTS tenant_isolation_tenant_settings ON tenant_settings;")
    op.drop_index("ix_tenant_settings_tenant_id", table_name="tenant_settings")
    op.drop_table("tenant_settings")

