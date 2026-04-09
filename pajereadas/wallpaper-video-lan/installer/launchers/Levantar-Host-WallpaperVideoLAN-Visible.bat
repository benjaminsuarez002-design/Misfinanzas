@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "STARTER=%~dp0Levantar-Host-WallpaperVideoLAN.bat"
if exist "%STARTER%" (
  call "%STARTER%"
  if errorlevel 1 (
    echo [ERROR] No se pudo iniciar el host.
    pause
    exit /b 1
  )
) else (
  echo [AVISO] No se encontro el lanzador invisible en escritorio.
  echo [INFO] Intentando iniciar host directamente...
  set "APP_DIR=%USERPROFILE%\WallpaperVideoLAN"
  if not exist "%APP_DIR%\src\server.js" (
    echo [ERROR] No se encontro la app en "%APP_DIR%".
    pause
    exit /b 1
  )
  for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":3000" ^| findstr "LISTENING"') do goto :host_ready
  where node >nul 2>nul
  if errorlevel 1 (
    echo [ERROR] Node.js no esta en PATH.
    pause
    exit /b 1
  )
  powershell -NoProfile -WindowStyle Hidden -Command "Start-Process -WindowStyle Hidden -FilePath 'node' -ArgumentList 'src\\server.js' -WorkingDirectory '%APP_DIR%'"
  if errorlevel 1 (
    echo [ERROR] No se pudo iniciar el servidor.
    pause
    exit /b 1
  )
)

:host_ready

set "LAN_IP="
for /f "tokens=2 delims=:" %%I in ('ipconfig ^| findstr /R /C:"IPv4"') do (
  for /f "tokens=* delims= " %%J in ("%%I") do (
    if not defined LAN_IP if /I not "%%J"=="127.0.0.1" set "LAN_IP=%%J"
  )
)
if "!LAN_IP!"=="" set "LAN_IP=localhost"

echo =============================================
echo WallpaperVideoLAN - Host en segundo plano
echo URL local:    http://localhost:3000
echo URL telefono: http://!LAN_IP!:3000
echo =============================================
echo.
echo El servidor se ejecuto en segundo plano (invisible).
echo Usa "Cerrar-Host-WallpaperVideoLAN.bat" para detenerlo.
echo.
pause
exit /b 0
