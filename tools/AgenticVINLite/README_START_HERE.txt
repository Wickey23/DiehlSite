Agentic VIN Email Sorter Lite v98
=================================

Purpose
-------
This is a local Windows Python/browser tool for Diehl's Truck World. It is intentionally isolated from the DiehlSite React/Vite dealership website.

It is designed for Classic Outlook COM, local Excel files, OneDrive-synced folders, VIN evidence folders, a local working Notes DB, warranty/in-service capture, run checkpoints, and reminder-only follow-up handling.

Start here
----------
1. Run SETUP_ONCE_V98_LIGHT.bat once.
2. Run START_BROWSER_V98_LIGHT.bat.
3. Open http://127.0.0.1:8765 if the browser does not open automatically.

Direct launch
-------------
.venv\Scripts\python.exe Agentic_VIN_Email_Sorter_v98_Lite.py --browser --port 8765

Compile check
-------------
.venv\Scripts\python.exe -m py_compile Agentic_VIN_Email_Sorter_v98_Lite.py

Lite safety defaults
--------------------
- Active run writes go to %LOCALAPPDATA%\AgenticVIN\WorkingDB\VIN_Notes_Database_WORKING.xlsx.
- The OneDrive Notes DB is published only after validation.
- A run lock prevents two runs from writing at once.
- Follow-up mode is reminder-only.
- Automatic email sending is disabled.
- Heavy post-run compiles are disabled.
- Runtime working DB paths are never saved as the permanent Notes DB path.

Outlook note
------------
Outlook integration requires Classic desktop Outlook and pywin32. New Outlook does not expose the same COM automation surface.
