@echo off
setlocal EnableExtensions

set "APP_DIR=%USERPROFILE%\WallpaperVideoLAN"

if not exist "%APP_DIR%\src\server.js" exit /b 0

for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":3000" ^| findstr "LISTENING"') do (
  exit /b 0
)

where node >nul 2>nul
if errorlevel 1 exit /b 0

powershell -NoProfile -WindowStyle Hidden -Command "Start-Process -WindowStyle Hidden -FilePath 'node' -ArgumentList 'src\\server.js' -WorkingDirectory '%APP_DIR%'"
exit /b 0
