@echo off
setlocal

set "ROOT=%~dp0"
cd /d "%ROOT%"

if not exist "%ROOT%node_modules" (
  echo Dependencies are missing.
  echo Please run: npm install
  pause
  exit /b 1
)

echo Starting Quintask API and Web dev servers...
echo.

start "Quintask API - http://localhost:3000" /D "%ROOT%" cmd /k npm run dev:api

timeout /t 2 /nobreak >nul

start "Quintask Web - http://127.0.0.1:5173" /D "%ROOT%" cmd /k npm run dev:web

echo API: http://localhost:3000
echo Web: http://127.0.0.1:5173
echo.
echo Two terminal windows have been opened. Keep them running while developing.
echo Press any key to open the web app in your browser...
pause >nul

start "" "http://127.0.0.1:5173"

endlocal
