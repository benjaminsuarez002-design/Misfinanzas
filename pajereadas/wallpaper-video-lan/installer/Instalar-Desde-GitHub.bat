@echo off
setlocal EnableExtensions

set "REPO_ZIP_URL=https://codeload.github.com/benjaminsuarez002-design/Misfinanzas/zip/refs/heads/main"
set "SUBDIR_IN_REPO=pajereadas\wallpaper-video-lan"
set "WORK_DIR=%USERPROFILE%\WallpaperVideoLAN"
set "TMP_DIR=%TEMP%\wvlan-bootstrap"
set "ZIP_PATH=%TMP_DIR%\misfinanzas-main.zip"
set "EXTRACT_DIR=%TMP_DIR%\extract"
set "REPO_ROOT_IN_ZIP=%EXTRACT_DIR%\Misfinanzas-main"
set "SOURCE_DIR=%REPO_ROOT_IN_ZIP%\%SUBDIR_IN_REPO%"

echo.
echo === Bootstrap Wallpaper Video LAN desde GitHub ===
echo.

echo [1/5] Preparando carpetas...
if exist "%TMP_DIR%" rmdir /s /q "%TMP_DIR%"
mkdir "%TMP_DIR%" >nul 2>nul
mkdir "%EXTRACT_DIR%" >nul 2>nul
if not exist "%WORK_DIR%" mkdir "%WORK_DIR%" >nul 2>nul

echo [2/5] Descargando repo desde GitHub...
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -UseBasicParsing -Uri '%REPO_ZIP_URL%' -OutFile '%ZIP_PATH%' } catch { Write-Host $_.Exception.Message; exit 1 }"
if errorlevel 1 (
  echo [ERROR] No se pudo descargar el repo.
  echo Verifica internet y acceso a GitHub.
  goto :fail
)

echo [3/5] Extrayendo ZIP...
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('%ZIP_PATH%','%EXTRACT_DIR%') } catch { Write-Host $_.Exception.Message; exit 1 }"
if errorlevel 1 (
  echo [ERROR] No se pudo extraer el ZIP.
  echo En PCs muy antiguas puede faltar soporte .NET para ZIP.
  goto :fail
)

if not exist "%SOURCE_DIR%\package.json" (
  echo [ERROR] No se encontro la app en el repo: %SOURCE_DIR%
  goto :fail
)

echo [4/5] Copiando app a %WORK_DIR% ...
robocopy "%SOURCE_DIR%" "%WORK_DIR%" /E /NFL /NDL /NJH /NJS /NC /NS /XD node_modules .git .cache dist /XF .env server.log >nul
if errorlevel 8 (
  echo [ERROR] Fallo al copiar archivos.
  goto :fail
)

echo [5/5] Ejecutando instalador principal...
if not exist "%WORK_DIR%\installer\Instalar-WallpaperVideoLAN.bat" (
  echo [AVISO] No se encontro instalador principal. Ejecutando instalacion inline...
  call :inline_install
  exit /b %errorlevel%
)

call "%WORK_DIR%\installer\Instalar-WallpaperVideoLAN.bat"
exit /b %errorlevel%

:inline_install
echo.
echo === Instalacion inline ===

call :ensure_node
if errorlevel 1 exit /b 1

if not exist "%WORK_DIR%\package.json" (
  echo [ERROR] package.json no encontrado en %WORK_DIR%
  exit /b 1
)

cd /d "%WORK_DIR%"
call npm.cmd install
if errorlevel 1 (
  echo [ERROR] Fallo npm install.
  exit /b 1
)

set "DEFAULT_ROOT=C:\Program Files (x86)\Steam\steamapps\workshop\content\431960"
set /p "WPRoot=Ruta de videos [ENTER = %DEFAULT_ROOT%]: "
if "%WPRoot%"=="" set "WPRoot=%DEFAULT_ROOT%"

> "%WORK_DIR%\.env" (
  echo WALLPAPER_ROOT=%WPRoot%
  echo HOST=0.0.0.0
  echo PORT=3000
  echo SCAN_INTERVAL_SECONDS=180
  echo ENABLE_DURATION_PROBE=true
)

net session >nul 2>nul
if not errorlevel 1 (
  powershell -NoProfile -Command "if (-not (Get-NetFirewallRule -DisplayName 'WallpaperVideoLAN-3000' -ErrorAction SilentlyContinue)) { New-NetFirewallRule -DisplayName 'WallpaperVideoLAN-3000' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000 -Profile Private | Out-Null }"
)

set "START_BAT=%USERPROFILE%\Desktop\Levantar-Host-WallpaperVideoLAN.bat"
set "STOP_BAT=%USERPROFILE%\Desktop\Detener-WallpaperVideoLAN.bat"

> "%START_BAT%" echo @echo off
>> "%START_BAT%" echo setlocal
>> "%START_BAT%" echo set "APP_DIR=%WORK_DIR%"
>> "%START_BAT%" echo cd /d "%%APP_DIR%%"
>> "%START_BAT%" echo set "LAN_IP="
>> "%START_BAT%" echo for /f "usebackq delims=" %%%%I in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 ^| Where-Object { $_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown' } ^| Select-Object -ExpandProperty IPAddress -First 1)"`) do set "LAN_IP=%%%%I"
>> "%START_BAT%" echo if "%%LAN_IP%%"=="" set "LAN_IP=localhost"
>> "%START_BAT%" echo start "WallpaperVideoLAN" /min cmd /k "cd /d \"%%APP_DIR%%\" ^&^& npm.cmd start ^>^> \"%%APP_DIR%%\server.log\" 2^>^&1"
>> "%START_BAT%" echo echo URL local: http://localhost:3000
>> "%START_BAT%" echo echo URL telefono: http://%%LAN_IP%%:3000
>> "%START_BAT%" echo pause
>> "%START_BAT%" echo exit /b 0

> "%STOP_BAT%" echo @echo off
>> "%STOP_BAT%" echo powershell -NoProfile -Command "Get-CimInstance Win32_Process ^| Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -like '*wallpaper-video-lan*src\\server.js*' } ^| ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"
>> "%STOP_BAT%" echo echo Servidor detenido ^(si estaba corriendo^).
>> "%STOP_BAT%" echo timeout /t 2 /nobreak ^>nul

call "%START_BAT%"
exit /b 0

:ensure_node
where node >nul 2>nul
if errorlevel 1 goto :install_node
where npm.cmd >nul 2>nul
if errorlevel 1 goto :install_node
exit /b 0

:install_node
echo [INFO] Node.js no encontrado. Intentando instalar automaticamente...
where winget >nul 2>nul
if errorlevel 1 (
  echo [ERROR] No se encontro winget. Instala Node.js LTS manualmente desde https://nodejs.org
  exit /b 1
)

winget install OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements
if errorlevel 1 (
  echo [ERROR] Fallo la instalacion automatica de Node.js.
  exit /b 1
)

set "PATH=%PATH%;C:\Program Files\nodejs;C:\Program Files (x86)\nodejs;%LOCALAPPDATA%\Programs\nodejs"
where node >nul 2>nul
if errorlevel 1 exit /b 1
where npm.cmd >nul 2>nul
if errorlevel 1 exit /b 1
exit /b 0

:fail
echo.
echo Bootstrap cancelado por error.
echo.
pause
exit /b 1
