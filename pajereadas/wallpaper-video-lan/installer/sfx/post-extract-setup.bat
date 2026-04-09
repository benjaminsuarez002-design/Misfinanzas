@echo off
setlocal EnableExtensions

set "APP_DIR=%USERPROFILE%\WallpaperVideoLAN"
set "TOOLS_DIR=%APP_DIR%\installer\tools"
set "LAUNCHERS_DIR=%APP_DIR%\installer\launchers"
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "AUTO_BAT=%STARTUP_DIR%\AutoInicio-WallpaperVideoLAN.bat"
set "DEFAULT_ROOT=C:\"

echo.
echo === Configuracion final WallpaperVideoLAN ===
echo.

if not exist "%APP_DIR%\package.json" (
  echo [ERROR] No se encontro la app en "%APP_DIR%".
  pause
  exit /b 1
)

if not exist "%APP_DIR%\.env" (
  > "%APP_DIR%\.env" (
    echo WALLPAPER_ROOT=%DEFAULT_ROOT%
    echo HOST=0.0.0.0
    echo PORT=3000
    echo SCAN_INTERVAL_SECONDS=180
    echo ENABLE_DURATION_PROBE=true
  )
)

where node >nul 2>nul
if errorlevel 1 goto :install_node
where npm.cmd >nul 2>nul
if errorlevel 1 goto :install_node
goto :deps

:install_node
echo [INFO] Node.js no encontrado. Intentando instalar automaticamente...
where winget >nul 2>nul
if errorlevel 1 (
  echo [ERROR] No se encontro winget. Instala Node.js LTS manualmente y vuelve a abrir el acceso directo.
  pause
  exit /b 1
)
winget install OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements --disable-interactivity
if errorlevel 1 (
  echo [ERROR] No se pudo instalar Node.js automaticamente.
  pause
  exit /b 1
)
set "PATH=%PATH%;C:\Program Files\nodejs;C:\Program Files (x86)\nodejs;%LOCALAPPDATA%\Programs\nodejs"

:deps
cd /d "%APP_DIR%"
echo [INFO] Ejecutando npm install...
call npm.cmd install
if errorlevel 1 (
  echo [ERROR] Fallo npm install.
  pause
  exit /b 1
)

if exist "%TOOLS_DIR%\WallpaperVideoLAN.HostControl.exe" (
  copy /Y "%TOOLS_DIR%\WallpaperVideoLAN.HostControl.exe" "%APP_DIR%\WallpaperVideoLAN.HostControl.exe" >nul
)
if exist "%TOOLS_DIR%\WallpaperVideoLAN.HostControl.ico" (
  copy /Y "%TOOLS_DIR%\WallpaperVideoLAN.HostControl.ico" "%APP_DIR%\WallpaperVideoLAN.HostControl.ico" >nul
)

for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "[Environment]::GetFolderPath('DesktopDirectory')"`) do set "DESKTOP_DIR=%%I"
if "%DESKTOP_DIR%"=="" set "DESKTOP_DIR=%USERPROFILE%\Desktop"
if not exist "%DESKTOP_DIR%" set "DESKTOP_DIR=%USERPROFILE%\Escritorio"
if not exist "%DESKTOP_DIR%" mkdir "%DESKTOP_DIR%" >nul 2>nul

if exist "%DESKTOP_DIR%\Levantar-Host-WallpaperVideoLAN.bat" del /f /q "%DESKTOP_DIR%\Levantar-Host-WallpaperVideoLAN.bat" >nul 2>nul
if exist "%DESKTOP_DIR%\Levantar-Host-WallpaperVideoLAN-Visible.bat" del /f /q "%DESKTOP_DIR%\Levantar-Host-WallpaperVideoLAN-Visible.bat" >nul 2>nul
if exist "%DESKTOP_DIR%\Cerrar-Host-WallpaperVideoLAN.bat" del /f /q "%DESKTOP_DIR%\Cerrar-Host-WallpaperVideoLAN.bat" >nul 2>nul

set "DESKTOP_SHORTCUT=%DESKTOP_DIR%\WallpaperVideoLAN Host Control.lnk"
set "APP_EXE=%APP_DIR%\WallpaperVideoLAN.HostControl.exe"
set "APP_ICON=%APP_DIR%\WallpaperVideoLAN.HostControl.ico"
set "ICON_FOR_SHORTCUT=%APP_EXE%"
if exist "%APP_ICON%" set "ICON_FOR_SHORTCUT=%APP_ICON%"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws=New-Object -ComObject WScript.Shell; $s=$ws.CreateShortcut('%DESKTOP_SHORTCUT%'); $s.TargetPath='%APP_EXE%'; $s.WorkingDirectory='%APP_DIR%'; $s.IconLocation='%ICON_FOR_SHORTCUT%,0'; $s.Save()"
if errorlevel 1 (
  echo [ERROR] No se pudo crear el acceso directo del escritorio.
  pause
  exit /b 1
)

if not exist "%STARTUP_DIR%" mkdir "%STARTUP_DIR%" >nul 2>nul
copy /Y "%LAUNCHERS_DIR%\AutoInicio-WallpaperVideoLAN.bat" "%AUTO_BAT%" >nul
if errorlevel 1 (
  echo [ERROR] No se pudo copiar el auto inicio a "%AUTO_BAT%".
  pause
  exit /b 1
)

echo.
echo [OK] Ruta instalada: %APP_DIR%
echo [OK] Acceso directo creado: %DESKTOP_SHORTCUT%
echo [OK] Auto inicio copiado a: %AUTO_BAT%
echo.
echo Presiona una tecla para cerrar...
pause >nul
exit /b 0
