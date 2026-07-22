# Local Testing

## Easiest method on Windows

1. Extract the entire project ZIP to a normal folder.
2. Install the current Node.js LTS release from <https://nodejs.org/> if it is not already installed.
3. Double-click `START_LOCAL_TEST.bat`.
4. Leave the command window open while testing.
5. The site opens automatically at <http://localhost:3000>.
6. Press `Ctrl+C` in the command window to stop it.

The first launch runs `npm install`, so it can take a few minutes. Later launches
start immediately. The two truck GLB files are included in the project.

## Manual method

Open Command Prompt or PowerShell in the extracted project folder and run:

```powershell
npm install
npm run local
```

Then open <http://localhost:3000>.

## Common fixes

- **Port 3000 is already in use:** close the other development server, or restart the computer.
- **`node` is not recognized:** install Node.js LTS, then reopen the project folder.
- **Truck is not visible:** keep an internet connection available because the 3D viewer library loads from its official CDN. The GLB truck files themselves are local.
- **Blank or stale page:** press `Ctrl+F5` to force a full browser refresh.
