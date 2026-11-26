@echo off
setlocal

REM ============================================================
REM  Cirra — Start All Local Services
REM  Run from repo root: C:\PROJECTS(ALL)\Cirra
REM ============================================================

set PYTHON=C:\PROJECTS(ALL)\Cirra\services\api\.venv\Scripts\python.exe
set UVICORN=C:\PROJECTS(ALL)\Cirra\services\api\.venv\Scripts\uvicorn.exe
set REPO=C:\PROJECTS(ALL)\Cirra

echo Starting Postgres + Redis...
docker-compose -f "%REPO%\docker-compose.local.yml" up -d
timeout /t 3 /nobreak >nul

echo.
echo Starting API (port 8000)...
start "Cirra API" cmd /k "cd /d %REPO%\services\api && %PYTHON% -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 2 /nobreak >nul

echo Starting Investigator (port 8001)...
start "Cirra Investigator" cmd /k "cd /d %REPO%\services\investigator && %PYTHON% -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload"
timeout /t 2 /nobreak >nul

echo Starting Sentinel (port 8002)...
start "Cirra Sentinel" cmd /k "cd /d %REPO%\services\sentinel && %PYTHON% -m uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload"
timeout /t 2 /nobreak >nul

echo Starting Action Engine (port 8003)...
start "Cirra Action Engine" cmd /k "cd /d %REPO%\services\action-engine && %PYTHON% -m uvicorn app.main:app --host 0.0.0.0 --port 8003 --reload"
timeout /t 2 /nobreak >nul

echo Starting Frontend (port 3000)...
start "Cirra Frontend" cmd /k "cd /d %REPO%\frontend && pnpm run dev"

echo.
echo ============================================================
echo  All services starting. Health checks:
echo    API:           http://localhost:8000/health
echo    Investigator:  http://localhost:8001/health
echo    Sentinel:      http://localhost:8002/health
echo    Action Engine: http://localhost:8003/health
echo    Frontend:      http://localhost:3000
echo ============================================================

