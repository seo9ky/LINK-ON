@echo off
setlocal
cd /d "%~dp0.."
where npm.cmd >nul 2>nul
if not errorlevel 1 goto standard
if not exist ".tools\npm\bin\npm-cli.js" goto missing
where node.exe >nul 2>nul
if not errorlevel 1 goto localnpm
if not exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" goto missing
"%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" ".tools\npm\bin\npm-cli.js" %*
exit /b %errorlevel%
:localnpm
node ".tools\npm\bin\npm-cli.js" %*
exit /b %errorlevel%
:standard
call npm.cmd %*
exit /b %errorlevel%
:missing
echo Install Node.js 24 LTS from https://nodejs.org/ and restart VS Code.
exit /b 1
