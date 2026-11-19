@echo off
setlocal
cd /d "%~dp0" || exit /b 1
if not exist "dist\index.html" (
    echo Preview files are missing. Run npm ci and npm run build first.
    pause
    exit /b 1
)
call npm.cmd run preview -- --host 127.0.0.1 --port 4174 --strictPort --open
if errorlevel 1 pause
