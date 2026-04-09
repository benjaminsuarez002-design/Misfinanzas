@echo off
setlocal EnableExtensions

echo.
echo === Desinstalador Wallpaper Video LAN ===
echo.

set "APP_DIR=%~dp0.."
set "BOOTSTRAP_APP=%USERPROFILE%\WallpaperVideoLAN"

set "DESKTOP_DIR="
for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "[Environment]::GetFolderPath('Desktop')"`) do set "DESKTOP_DIR=%%I"
if "%DESKTOP_DIR%"=="" set "DESKTOP_DIR=%USERPROFILE%\Desktop"
if not exist "%DESKTOP_DIR%" set "DESKTOP_DIR=%USERPROFILE%\Escritorio"
set "PUBLIC_DESKTOP=%PUBLIC%\Desktop"

echo [1/5] Deteniendo servidores Node de Wallpaper Video LAN...
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and ($_.CommandLine -like '*wallpaper-video-lan*src\\server.js*' -or $_.CommandLine -like '*WallpaperVideoLAN*src\\server.js*') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"

echo [2/5] Eliminando regla de firewall (si existe)...
powershell -NoProfile -Command "Get-NetFirewallRule -DisplayName 'WallpaperVideoLAN-3000' -ErrorAction SilentlyContinue | Remove-NetFirewallRule -ErrorAction SilentlyContinue"

echo [3/5] Eliminando lanzadores de escritorio...
if exist "%DESKTOP_DIR%\Levantar-Host-WallpaperVideoLAN.bat" del /f /q "%DESKTOP_DIR%\Levantar-Host-WallpaperVideoLAN.bat"
if exist "%DESKTOP_DIR%\Detener-WallpaperVideoLAN.bat" del /f /q "%DESKTOP_DIR%\Detener-WallpaperVideoLAN.bat"
if exist "%PUBLIC_DESKTOP%\Levantar-Host-WallpaperVideoLAN.bat" del /f /q "%PUBLIC_DESKTOP%\Levantar-Host-WallpaperVideoLAN.bat"
if exist "%PUBLIC_DESKTOP%\Detener-WallpaperVideoLAN.bat" del /f /q "%PUBLIC_DESKTOP%\Detener-WallpaperVideoLAN.bat"

echo [4/5] Limpiando logs/cache basica...
if exist "%APP_DIR%\server.log" del /f /q "%APP_DIR%\server.log"
if exist "%APP_DIR%\.cache" rmdir /s /q "%APP_DIR%\.cache"
if exist "%BOOTSTRAP_APP%\server.log" del /f /q "%BOOTSTRAP_APP%\server.log"
if exist "%BOOTSTRAP_APP%\.cache" rmdir /s /q "%BOOTSTRAP_APP%\.cache"

echo [5/5] Opcional: borrar carpeta instalada en %%USERPROFILE%%\WallpaperVideoLAN
choice /M "Deseas borrar tambien la carpeta %BOOTSTRAP_APP%"
if errorlevel 2 goto :done
if exist "%BOOTSTRAP_APP%" (
  rmdir /s /q "%BOOTSTRAP_APP%"
  echo Carpeta eliminada: %BOOTSTRAP_APP%
) else (
  echo No existe carpeta bootstrap: %BOOTSTRAP_APP%
)

:done
echo.
echo Desinstalacion finalizada.
pause
exit /b 0
