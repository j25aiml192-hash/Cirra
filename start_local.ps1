# CIRRA Full Local Startup
# REQUIREMENT: Docker Desktop must be open and running first

$root = "C:\PROJECTS(ALL)\Cirra"
$venv = "$root\services\api\.venv\Scripts"

Write-Host "=== CIRRA Starting ===" -ForegroundColor Cyan
Write-Host "Make sure Docker Desktop is running!" -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Start Postgres + Redis
Write-Host "`n>> Starting databases..." -ForegroundColor Yellow
Set-Location $root
docker-compose -f docker-compose.local.yml up -d
Write-Host "Waiting 8s for databases to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 8

# Run migrations (safe to run every time — idempotent)
Write-Host "`n>> Running migrations..." -ForegroundColor Yellow
Set-Location "$root\services\api"
& "$venv\python.exe" -m alembic upgrade head 2>&1 | Select-Object -Last 3

Set-Location $root

# Start API
Write-Host "`n>> Starting API :8000" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
  "cd '$root\services\api'; & '$venv\uvicorn.exe' app.main:app --host 0.0.0.0 --port 8000 --reload" `
  -WindowStyle Normal

Start-Sleep -Seconds 4

# Start Investigator
Write-Host ">> Starting Investigator :8001" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
  "cd '$root\services\investigator'; & '$venv\uvicorn.exe' app.main:app --host 0.0.0.0 --port 8001 --reload" `
  -WindowStyle Normal

Start-Sleep -Seconds 2

# Start Sentinel
Write-Host ">> Starting Sentinel :8002" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
  "cd '$root\services\sentinel'; & '$venv\uvicorn.exe' app.main:app --host 0.0.0.0 --port 8002 --reload" `
  -WindowStyle Normal

Start-Sleep -Seconds 2

# Start Action Engine
Write-Host ">> Starting Action Engine :8003" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
  "cd '$root\services\action-engine'; & '$venv\uvicorn.exe' app.main:app --host 0.0.0.0 --port 8003 --reload" `
  -WindowStyle Normal

Start-Sleep -Seconds 2

# Start Frontend
Write-Host ">> Starting Frontend :3000" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
  "cd '$root\frontend'; npm run dev" `
  -WindowStyle Normal

Start-Sleep -Seconds 8

# Quick health check
Write-Host "`n=== Health Check ===" -ForegroundColor Cyan
$checks = @(
  @{url="http://localhost:8000/health"; name="API :8000"},
  @{url="http://localhost:8001/health"; name="Investigator :8001"},
  @{url="http://localhost:8002/health"; name="Sentinel :8002"},
  @{url="http://localhost:8003/health"; name="Action-Engine :8003"}
)
foreach ($c in $checks) {
  try {
    $r = Invoke-WebRequest -Uri $c.url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "$($c.name) → $($r.StatusCode) OK" -ForegroundColor Green
  } catch {
    Write-Host "$($c.name) → still starting (check window)" -ForegroundColor Yellow
  }
}

Write-Host "`nOpen: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Login: hiten@cirra.dev / 12345" -ForegroundColor Cyan
