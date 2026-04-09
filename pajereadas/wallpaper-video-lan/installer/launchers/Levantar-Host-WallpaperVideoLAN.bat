@echo off
setlocal EnableExtensions

set "APP_DIR=%USERPROFILE%\WallpaperVideoLAN"

if not exist "%APP_DIR%\src\server.js" (
  echo [ERROR] No se encontro la app en "%APP_DIR%".
  echo Ejecuta primero el instalador.
  exit /b 1
)

for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":3000" ^| findstr "LISTENING"') do (
  exit /b 0
)

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js no esta en PATH.
  exit /b 1
)

powershell -NoProfile -WindowStyle Hidden -Command "Start-Process -WindowStyle Hidden -FilePath 'node' -ArgumentList 'src\\server.js' -WorkingDirectory '%APP_DIR%'"
if errorlevel 1 (
  echo [ERROR] No se pudo iniciar el servidor.
  exit /b 1
)

exit /b 0
