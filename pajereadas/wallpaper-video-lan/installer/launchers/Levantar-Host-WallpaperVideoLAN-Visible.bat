@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "STARTER=%~dp0Levantar-Host-WallpaperVideoLAN.bat"
if not exist "%STARTER%" (
  echo [ERROR] No se encontro: %STARTER%
  pause
  exit /b 1
)

call "%STARTER%"
if errorlevel 1 (
  echo [ERROR] No se pudo iniciar el host.
  pause
  exit /b 1
)

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
