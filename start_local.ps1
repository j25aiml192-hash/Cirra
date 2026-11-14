# CIRRA Local Startup Script
# Run this from PowerShell as Administrator
# Requires Docker Desktop to be running first

$root = "C:\PROJECTS(ALL)\Cirra"
$venv = "$root\services\api\.venv\Scripts"

Write-Host "=== CIRRA Local Startup ===" -ForegroundColor Cyan

# Step 1: Start databases
Write-Host "`n[1/6] Starting Postgres + Redis via Docker..." -ForegroundColor Yellow
Set-Location $root
docker-compose -f docker-compose.local.yml up -d
Start-Sleep -Seconds 5

# Step 2: Check databases are up
Write-Host "`n[2/6] Checking database health..." -ForegroundColor Yellow
docker-compose -f docker-compose.local.yml ps

# Step 3: Run migrations
Write-Host "`n[3/6] Running Alembic migrations..." -ForegroundColor Yellow
Set-Location "$root\services\api"
& "$venv\python.exe" -m alembic upgrade head
Set-Location $root

# Step 4: Start API
Write-Host "`n[4/6] Starting API on :8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$root\services\api'; & '$venv\uvicorn.exe' app.main:app --host 0.0.0.0 --port 8000 --reload"
) -WindowStyle Normal

Start-Sleep -Seconds 3

# Step 5: Start Investigator, Sentinel, Action-Engine
Write-Host "`n[5/6] Starting Investigator on :8001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$root\services\investigator'; & '$venv\uvicorn.exe' app.main:app --host 0.0.0.0 --port 8001 --reload"
) -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host "Starting Sentinel on :8002..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$root\services\sentinel'; & '$venv\uvicorn.exe' app.main:app --host 0.0.0.0 --port 8002 --reload"
) -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host "Starting Action-Engine on :8003..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$root\services\action-engine'; & '$venv\uvicorn.exe' app.main:app --host 0.0.0.0 --port 8003 --reload"
) -WindowStyle Normal

Start-Sleep -Seconds 3

# Step 6: Start Frontend
Write-Host "`n[6/6] Starting Next.js frontend on :3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$root\frontend'; npm run dev"
) -WindowStyle Normal

Start-Sleep -Seconds 5

# Health check
Write-Host "`n=== Health Check ===" -ForegroundColor Cyan
try { $r = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5; Write-Host "API :8000 → $($r.StatusCode) OK" -ForegroundColor Green } catch { Write-Host "API :8000 → NOT READY YET (wait 10s and check manually)" -ForegroundColor Red }

Write-Host "`nAll services launched in separate windows." -ForegroundColor Green
Write-Host "Open http://localhost:3000 in your browser." -ForegroundColor Cyan
Write-Host "Login: hiten@cirra.dev / 12345" -ForegroundColor Cyan
