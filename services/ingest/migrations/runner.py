import os
import glob
import clickhouse_connect


def run_migrations(
    host: str = "localhost",
    port: int = 8123,
    user: str = "default",
    password: str = "",
    database: str = "cirra"
):
    print(f"Connecting to ClickHouse at {host}:{port} db={database}...")
    client = clickhouse_connect.get_client(
        host=host,
        port=port,
        username=user,
        password=password
    )

    # Ensure database exists
    client.command(f"CREATE DATABASE IF NOT EXISTS {database}")
    client.database = database

    # Ensure schema_migrations table exists
    client.command("""
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version String,
            applied_at DateTime DEFAULT now()
        ) ENGINE = MergeTree()
        ORDER BY version;
    """)

    # Get applied migrations
    applied_rows = client.query("SELECT version FROM schema_migrations").result_rows
    applied = {row[0] for row in applied_rows}

    # Find migration files
    migrations_dir = os.path.dirname(os.path.abspath(__file__))
    sql_files = sorted(glob.glob(os.path.join(migrations_dir, "*.sql")))

    for filepath in sql_files:
        filename = os.path.basename(filepath)
        if filename in applied:
            print(f"Migration {filename} already applied.")
            continue

        print(f"Applying migration: {filename}...")
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        # Split multiple queries by semicolon (excluding comment lines)
        statements = [stmt.strip() for stmt in content.split(";") if stmt.strip()]
        for stmt in statements:
            client.command(stmt)

        client.command(
            "INSERT INTO schema_migrations (version) VALUES (%s)",
            parameters=[filename]
        )
        print(f"Migration {filename} successfully applied.")

    print("ClickHouse schema migrations complete.")


if __name__ == "__main__":
    host = os.getenv("CLICKHOUSE_HOST", "localhost")
    port = int(os.getenv("CLICKHOUSE_PORT", "8123"))
    user = os.getenv("CLICKHOUSE_ADMIN_USER", "default")
    password = os.getenv("CLICKHOUSE_ADMIN_PASSWORD", "")
    database = os.getenv("CLICKHOUSE_DATABASE", "cirra")

    run_migrations(host=host, port=port, user=user, password=password, database=database)
