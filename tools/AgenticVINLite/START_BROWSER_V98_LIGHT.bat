@echo off
setlocal
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  echo Virtual environment not found. Run SETUP_ONCE_V98_LIGHT.bat first.
  pause
  exit /b 1
)
start "Agentic VIN Email Sorter Lite" ".venv\Scripts\python.exe" "Agentic_VIN_Email_Sorter_v98_Lite.py" --browser --port 8765
endlocal
