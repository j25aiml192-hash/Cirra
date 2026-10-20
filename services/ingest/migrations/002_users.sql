-- 002_users.sql
-- Create read-only user for API and Ask Cirra
CREATE USER IF NOT EXISTS cirra_reader IDENTIFIED WITH sha256_password BY 'reader_secure_password';
GRANT SELECT ON cirra.* TO cirra_reader;

-- Create write user for Ingest Pipeline
CREATE USER IF NOT EXISTS cirra_ingest IDENTIFIED WITH sha256_password BY 'ingest_secure_password';
GRANT SELECT, INSERT ON cirra.* TO cirra_ingest;
