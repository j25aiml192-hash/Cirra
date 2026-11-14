# CIRRA Local Shutdown Script
Write-Host "Stopping CIRRA services..." -ForegroundColor Yellow

# Kill uvicorn processes
Get-Process -Name "python" -ErrorAction SilentlyContinue | 
  Where-Object { $_.CommandLine -like "*uvicorn*" } | 
  Stop-Process -Force

# Kill node processes on port 3000
$node = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($node) { Stop-Process -Id $node.OwningProcess -Force }

# Stop Docker containers
Set-Location "C:\PROJECTS(ALL)\Cirra"
docker-compose -f docker-compose.local.yml stop

Write-Host "All CIRRA services stopped." -ForegroundColor Green
