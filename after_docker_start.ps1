# Run this ONCE after docker-compose.local.yml is running
# This sets up the database schema and seeds demo data

$root = "C:\PROJECTS(ALL)\Cirra"
$python = "$root\services\api\.venv\Scripts\python.exe"

Write-Host "=== CIRRA Post-Docker Setup ===" -ForegroundColor Cyan

# Wait for Postgres to be ready
Write-Host "`n[1/3] Waiting for Postgres..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Run migrations
Write-Host "`n[2/3] Running Alembic migrations..." -ForegroundColor Yellow
Set-Location "$root\services\api"
& "$root\services\api\.venv\Scripts\alembic.exe" upgrade head
if ($LASTEXITCODE -eq 0) {
    Write-Host "Migrations: OK" -ForegroundColor Green
} else {
    Write-Host "Migrations FAILED — check Postgres is running" -ForegroundColor Red
    exit 1
}

# Seed demo data
Write-Host "`n[3/3] Seeding demo data (540 cost facts, 8 anomalies)..." -ForegroundColor Yellow
Set-Location $root
& $python scripts\seed_demo_data.py
if ($LASTEXITCODE -eq 0) {
    Write-Host "Demo data seeded: OK" -ForegroundColor Green
} else {
    Write-Host "Seed script failed" -ForegroundColor Red
}

Write-Host "`n=== Setup Complete ===" -ForegroundColor Cyan
Write-Host "Dashboard will now show real data." -ForegroundColor Green
Write-Host "Login: hiten@cirra.dev / 12345" -ForegroundColor Cyan
