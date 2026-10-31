import { createClient } from '@clickhouse/client';
import * as fs from 'fs';
import * as path from 'path';

// Helper to load env files if not set in process.env
function loadEnv() {
  const envFiles = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), 'frontend', '.env.local'),
    path.resolve(process.cwd(), 'services', 'api', '.env'),
  ];

  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.substring(0, eqIdx).trim();
          let value = trimmed.substring(eqIdx + 1).trim();
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.substring(1, value.length - 1);
          }
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    }
  }
}

loadEnv();

async function runMigration() {
  const host = process.env.CLICKHOUSE_HOST;
  const port = process.env.CLICKHOUSE_PORT || '8443';
  const username = process.env.CLICKHOUSE_USER || 'default';
  const password = process.env.CLICKHOUSE_PASSWORD;
  const database = process.env.CLICKHOUSE_DATABASE || 'cirra';

  if (!host || !password) {
    console.error('❌ Error: Missing CLICKHOUSE_HOST or CLICKHOUSE_PASSWORD environment variables.');
    process.exit(1);
  }

  const baseUrl = host.startsWith('http://') || host.startsWith('https://')
    ? host
    : `https://${host}:${port}`;

  console.log(`Connecting to ClickHouse Cloud at ${baseUrl}...`);

  // Step 1: Ensure database exists
  const rootClient = createClient({
    url: baseUrl,
    username,
    password,
    request_timeout: 30000,
  });

  try {
    console.log(`Ensuring database '${database}' exists...`);
    await rootClient.command({
      query: `CREATE DATABASE IF NOT EXISTS ${database}`,
    });
    console.log(` Database '${database}' is ready.`);
  } catch (err) {
    console.error('Failed to create/verify database:', err);
    throw err;
  } finally {
    await rootClient.close();
  }

  // Step 2: Connect to the specific database
  const client = createClient({
    url: baseUrl,
    username,
    password,
    database,
    request_timeout: 30000,
  });

  try {
    const migrationFilePath = path.resolve(
      process.cwd(),
      'services',
      'ingest',
      'migrations',
      '001_initial_schema.sql'
    );

    if (!fs.existsSync(migrationFilePath)) {
      throw new Error(`Migration file not found at: ${migrationFilePath}`);
    }

    console.log(`Reading DDL from: ${migrationFilePath}`);
    const ddl = fs.readFileSync(migrationFilePath, 'utf8');

    // Split statements on semicolon while handling whitespace and comments
    const rawStatements = ddl.split(';');
    const statements: string[] = [];

    for (const raw of rawStatements) {
      // Remove full-line comments and trim
      const cleaned = raw
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n')
        .trim();

      if (cleaned.length > 0) {
        statements.push(cleaned);
      }
    }

    console.log(`Found ${statements.length} DDL statements to execute.`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      // Extract table name if present for clear logging
      const tableMatch = stmt.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i);
      const tableName = tableMatch ? tableMatch[1] : `Statement ${i + 1}`;

      console.log(`[${i + 1}/${statements.length}] Executing: ${tableName}...`);
      await client.command({
        query: stmt,
      });
      console.log(` [${i + 1}/${statements.length}] Table/Statement '${tableName}' applied successfully.`);
    }

    // Step 3: Record migration in schema_migrations
    try {
      await client.command({
        query: `INSERT INTO schema_migrations (version) VALUES ('001_initial_schema')`,
      });
      console.log(` Recorded migration '001_initial_schema' in schema_migrations.`);
    } catch {
      // May already be recorded or logged
    }

    // Step 4: Verify tables
    const tableResultSet = await client.query({
      query: `SHOW TABLES FROM ${database}`,
      format: 'JSONEachRow',
    });
    const tables = await tableResultSet.json<{ name: string }>();
    console.log('\n Existing ClickHouse tables in database:', tables.map((t) => t.name).join(', '));
    console.log('\n✨ ClickHouse migration completed successfully.');
  } catch (err) {
    console.error('\n❌ ClickHouse migration failed:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

runMigration().catch((err) => {
  console.error('Fatal error during migration:', err);
  process.exit(1);
});

