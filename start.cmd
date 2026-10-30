@echo off
setlocal
cd /d "%~dp0"
if not exist "node_modules\vite\bin\vite.js" (
  call scripts\package.cmd ci
  if errorlevel 1 goto failed
)
call scripts\package.cmd run dev -- --open
if errorlevel 1 goto failed
exit /b 0
:failed
echo If port 5173 is already in use, open http://127.0.0.1:5173/
pause
exit /b 1
