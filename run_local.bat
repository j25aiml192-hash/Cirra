@echo off
setlocal

REM ============================================================
REM  Cirra — Start All Local Services
REM ============================================================

set "REPO=%~dp0"
if "%REPO:~-1%"=="\" set "REPO=%REPO:~0,-1%"

REM Detect Python
set "PYTHON=python"
if exist "%REPO%\services\api\.venv\Scripts\python.exe" (
    set "PYTHON=%REPO%\services\api\.venv\Scripts\python.exe"
) else if exist "%REPO%\.venv\Scripts\python.exe" (
    set "PYTHON=%REPO%\.venv\Scripts\python.exe"
)

echo Cirra root: %REPO%
echo Using Python: %PYTHON%
echo.

where docker >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Starting Postgres + Redis via Docker...
    docker compose -f "%REPO%\docker-compose.local.yml" up -d 2>nul || docker-compose -f "%REPO%\docker-compose.local.yml" up -d 2>nul
    timeout /t 3 /nobreak >nul
) else (
    echo [NOTE] Docker not detected in PATH. Skipping local Postgres/Redis container startup.
)

echo.
echo Starting API (port 8000)...
start "Cirra API" cmd /k "cd /d "%REPO%\services\api" && "%PYTHON%" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
ping 127.0.0.1 -n 2 >nul

echo Starting Investigator (port 8001)...
start "Cirra Investigator" cmd /k "cd /d "%REPO%\services\investigator" && "%PYTHON%" -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload"
ping 127.0.0.1 -n 2 >nul

echo Starting Sentinel (port 8002)...
start "Cirra Sentinel" cmd /k "cd /d "%REPO%\services\sentinel" && "%PYTHON%" -m uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload"
ping 127.0.0.1 -n 2 >nul

echo Starting Action Engine (port 8003)...
start "Cirra Action Engine" cmd /k "cd /d "%REPO%\services\action-engine" && "%PYTHON%" -m uvicorn app.main:app --host 0.0.0.0 --port 8003 --reload"
ping 127.0.0.1 -n 2 >nul

echo Starting Frontend (port 3000)...
where pnpm >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    start "Cirra Frontend" cmd /k "cd /d "%REPO%\frontend" && pnpm.cmd run dev"
) else (
    start "Cirra Frontend" cmd /k "cd /d "%REPO%\frontend" && npm.cmd run dev"
)

echo.
echo ============================================================
echo  All services starting. Health checks:
echo    API:           http://localhost:8000/health
echo    Investigator:  http://localhost:8001/health
echo    Sentinel:      http://localhost:8002/health
echo    Action Engine: http://localhost:8003/health
echo    Frontend:      http://localhost:3000
echo ============================================================

