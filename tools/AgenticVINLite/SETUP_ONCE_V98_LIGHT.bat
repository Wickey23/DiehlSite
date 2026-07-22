@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if %ERRORLEVEL%==0 (
  py -3 -m venv .venv
) else (
  python -m venv .venv
)
if not exist ".venv\Scripts\python.exe" (
  echo Could not create .venv. Install Python 3 for Windows and try again.
  pause
  exit /b 1
)
".venv\Scripts\python.exe" -m pip install --upgrade pip
".venv\Scripts\python.exe" -m pip install openpyxl pywin32 pypdf python-docx
".venv\Scripts\python.exe" -m py_compile Agentic_VIN_Email_Sorter_v98_Lite.py
pause
endlocal
