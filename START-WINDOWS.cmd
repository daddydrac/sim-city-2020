@echo off
cd /d "%~dp0"
docker compose up --build -d
if errorlevel 1 (
  echo Start Docker Desktop and check that port 8080 is free, then try again.
  pause
  exit /b 1
)
start "" "http://localhost:8080"
echo If the page is not ready, wait a few seconds and refresh it.
pause
