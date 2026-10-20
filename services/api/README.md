# Cirra Backend API (Sprint 1: Multi-Tenant Foundation)

This service provides the core multi-tenant backend foundation for Cirra, featuring Row-Level Security (RLS) enforcement, Supabase JWT session exchange, AES-256-GCM credential encryption, RBAC, Redis rate-limiting, and connection management.

---

## 1. Local Run Commands

### With Docker Compose
```bash
# Start PostgreSQL 15, Redis 7, and Cirra API
docker compose up -d

# Check service health
docker compose ps
```

### Local Virtual Environment
```bash
cd services/api

# Create & activate Python 3.11+ venv
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -e .

# Run dev server with auto-reload
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 2. Database Migrations (Alembic)

> **Important**: All schema changes and RLS policies are applied via Alembic only (`create_all` is never used).

```bash
cd services/api

# Run all migrations up to head
alembic upgrade head

# Roll back the most recent migration
alembic downgrade -1

# Seed demo test tenants (Tenant A & Tenant B) for isolation testing
python ../../scripts/seed/seed_db.py
```

---

## 3. Running Test Suite

```bash
cd services/api
pytest -v
```

Includes:
- Cross-tenant RLS isolation tests
- AES-256-GCM encryption & non-leakage verification
- Role-Based Access Control (viewer vs. admin)
- Token authenticity, expiration, and malformation rejection

---

## 4. API Endpoints & cURL Examples

### Health & Readiness
```bash
# Liveness probe
curl -X GET http://localhost:8000/health

# Readiness probe (verifies Postgres + Redis connectivity)
curl -X GET http://localhost:8000/ready
```

### Auth: Exchange Supabase Token for Cirra Session JWT
```bash
curl -X POST http://localhost:8000/api/v1/auth/session \
  -H "Content-Type: application/json" \
  -d '{
    "supabase_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```
*Response*:
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "tenant_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "user_id": "a1111111-1111-1111-1111-111111111111",
  "role": "admin"
}
```

### Connections Management
```bash
# 1. Create encrypted connection (Admin only)
curl -X POST http://localhost:8000/api/v1/connections \
  -H "Authorization: Bearer <CIRRA_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production AWS CUR",
    "provider": "aws",
    "credentials": {
      "role_arn": "arn:aws:iam::123456789012:role/CirraCostReader",
      "external_id": "cirra-tenant-token-98f2b"
    }
  }'

# 2. List connections (never returns credentials)
curl -X GET http://localhost:8000/api/v1/connections \
  -H "Authorization: Bearer <CIRRA_JWT>"

# 3. Get single connection (polled by UI every 5s)
curl -X GET http://localhost:8000/api/v1/connections/<CONNECTION_ID> \
  -H "Authorization: Bearer <CIRRA_JWT>"

# 4. Test provider handshake (Admin only)
curl -X POST http://localhost:8000/api/v1/connections/<CONNECTION_ID>/test \
  -H "Authorization: Bearer <CIRRA_JWT>"

# 5. Delete connection (Admin only)
curl -X DELETE http://localhost:8000/api/v1/connections/<CONNECTION_ID> \
  -H "Authorization: Bearer <CIRRA_JWT>"
```

### Team Management
```bash
# 1. List organization members
curl -X GET http://localhost:8000/api/v1/team \
  -H "Authorization: Bearer <CIRRA_JWT>"

# 2. Invite team member (Admin only)
curl -X POST http://localhost:8000/api/v1/team/invite \
  -H "Authorization: Bearer <CIRRA_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "analyst@acme.com",
    "role": "viewer"
  }'

# 3. Update member role (Admin only; prevents removing last admin)
curl -X PATCH http://localhost:8000/api/v1/team/<USER_ID>/role \
  -H "Authorization: Bearer <CIRRA_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"role": "member"}'

# 4. Remove member (Admin only; prevents removing last admin)
curl -X DELETE http://localhost:8000/api/v1/team/<USER_ID> \
  -H "Authorization: Bearer <CIRRA_JWT>"
```

---

## 5. UI Contract Reconciliation & Differences

| Component / Endpoint | UI Expectation | Backend Implementation | Reconciliation / Action |
| :--- | :--- | :--- | :--- |
| **Team Roles** | UI display shows roles `owner`, `admin`, `viewer` | Backend DB constraint enforces `admin`, `member`, `viewer` (standard Sprint 1 spec) | In single-tenant organizations, the first user receives `admin` role which maps to owner capabilities. Added alias handling so `owner` maps to `admin`. |
| **Connection Test Response** | UI checks `ok: boolean` with inline error banner | Backend `/test` returns `{"ok": bool, "error": str \| null}` | Fully aligned. Updates `status` to `connected` or `error` and sets `last_synced_at`. |
| **Connection List Security** | UI never requests raw credentials | Backend strictly strips `credentials_encrypted` from `ConnectionResponse` | Fully aligned. Credentials are encrypted at rest using AES-256-GCM and never returned. |
| **Error Handling** | UI error banners expect `{error: {code: string, message: string}}` | Custom Starlette exception handlers format all errors as `{error: {code, message}}` | Fully aligned with stable error codes (`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `RATE_LIMITED`). |
