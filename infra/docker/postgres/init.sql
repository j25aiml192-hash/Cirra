-- PostgreSQL initialization script for Cirra Control Plane

-- Set timezone to UTC
SET timezone = 'UTC';
ALTER SYSTEM SET timezone TO 'UTC';

-- Create cirra database if not already created
SELECT 'CREATE DATABASE cirra'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'cirra')\gexec

\connect cirra;

-- Enable pgvector extension for AI and semantic embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify extensions
SELECT extname, extversion FROM pg_extension WHERE extname IN ('vector', 'uuid-ossp');
