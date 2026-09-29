@echo off
cd /d "%~dp0"
where py >nul 2>nul
if not errorlevel 1 (
  echo Open http://localhost:8080 after the server starts. Ctrl+C stops it.
  py -3 server\server.py
  pause
  exit /b
)
where python >nul 2>nul
if errorlevel 1 (
  echo Install Python 3.10 or later, or use START-WINDOWS.cmd with Docker Desktop.
  pause
  exit /b 1
)
echo Open http://localhost:8080 after the server starts. Ctrl+C stops it.
python server\server.py
pause
