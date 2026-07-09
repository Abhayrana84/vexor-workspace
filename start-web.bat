@echo off
set "NODE_DIR=%~dp0.node\node-v20.11.1-win-x64"
set "PATH=%NODE_DIR%;%PATH%"
cd /d "%~dp0apps\web"
npm run dev
