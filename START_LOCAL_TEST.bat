@echo off
setlocal
title Diehl's Truck World - Local Test Server
cd /d "%~dp0"

echo.
echo ================================================
echo   DIEHL'S TRUCK WORLD - LOCAL TEST SERVER
echo ================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed.
  echo.
  echo Install the LTS version from https://nodejs.org/
  echo Then double-click this file again.
  echo.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found. Reinstall the Node.js LTS version.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Installing the website packages. This is only needed the first time...
  call npm install
  if errorlevel 1 (
    echo.
    echo Package installation failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)

echo Starting the website at http://localhost:3000
echo The browser will open automatically when the site is ready.
echo.
echo Keep this window open while testing.
echo Press Ctrl+C to stop the local website.
echo.

start "" powershell -NoProfile -WindowStyle Hidden -Command "$url='http://localhost:3000'; for($i=0; $i -lt 90; $i++){ try { $r=Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 2; if($r.StatusCode -eq 200){ Start-Process $url; exit } } catch {}; Start-Sleep -Seconds 1 }"

call npm run local

echo.
echo The local test server has stopped.
pause
endlocal
