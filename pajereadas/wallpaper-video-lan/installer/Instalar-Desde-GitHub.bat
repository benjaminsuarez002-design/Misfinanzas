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
set "LAUNCHERS_DIR=%WORK_DIR%\installer\launchers"

set "DEFAULT_ROOT=C:\"
set "FIREWALL_RULE=WallpaperVideoLAN-3000"
set "TOTAL_STEPS=9"
set "BAR_WIDTH=28"
set "INSTALL_OK=0"

echo.
echo === Instalador WallpaperVideoLAN desde GitHub ===
echo.

call :progress 1 "Preparando carpetas"
if exist "%TMP_DIR%" rmdir /s /q "%TMP_DIR%"
mkdir "%TMP_DIR%" >nul 2>nul
mkdir "%EXTRACT_DIR%" >nul 2>nul
if not exist "%WORK_DIR%" mkdir "%WORK_DIR%" >nul 2>nul

call :progress 2 "Descargando repo desde GitHub"
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -UseBasicParsing -Uri '%REPO_ZIP_URL%' -OutFile '%ZIP_PATH%' } catch { Write-Host $_.Exception.Message; exit 1 }"
if errorlevel 1 (
  echo [ERROR] No se pudo descargar el repo.
  goto :fail
)

call :progress 3 "Extrayendo ZIP"
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('%ZIP_PATH%','%EXTRACT_DIR%') } catch { Write-Host $_.Exception.Message; exit 1 }"
if errorlevel 1 (
  echo [ERROR] No se pudo extraer el ZIP.
  goto :fail
)

if not exist "%SOURCE_DIR%\package.json" (
  echo [ERROR] No se encontro la app en: %SOURCE_DIR%
  goto :fail
)

call :progress 4 "Copiando app a %WORK_DIR%"
robocopy "%SOURCE_DIR%" "%WORK_DIR%" /E /NFL /NDL /NJH /NJS /NC /NS /XD node_modules .git .cache dist /XF .env server.log >nul
if errorlevel 8 (
  echo [ERROR] Fallo al copiar archivos.
  goto :fail
)

call :progress 5 "Verificando Node.js"
call :ensure_node
if errorlevel 1 goto :fail

call :progress 6 "Verificando/instalando dependencias"
cd /d "%WORK_DIR%"
call :install_dependencies
if errorlevel 1 goto :fail

call :progress 7 "Configurando .env"
echo.
echo Ruta de videos:
echo - Presiona ENTER para usar la ruta por defecto.
echo - O escribe una ruta personalizada (ej: C:\).
echo.
:ask_root
set "WPRoot="
set /p "WPRoot=Ruta de videos [ENTER=%DEFAULT_ROOT%]: "
if "%WPRoot%"=="" set "WPRoot=%DEFAULT_ROOT%"
echo Ruta elegida: "%WPRoot%"
choice /C SN /N /M "Confirmar ruta? [S/N]: "
if errorlevel 2 goto :ask_root

> "%WORK_DIR%\.env" (
  echo WALLPAPER_ROOT=%WPRoot%
  echo HOST=0.0.0.0
  echo PORT=3000
  echo SCAN_INTERVAL_SECONDS=180
  echo ENABLE_DURATION_PROBE=true
)

call :progress 8 "Configurando firewall y lanzadores"
call :configure_firewall
if errorlevel 1 goto :fail
call :create_launchers
if errorlevel 1 goto :fail
call :configure_autostart
if errorlevel 1 goto :fail

call :progress 9 "Finalizando instalacion"

echo.
echo Instalacion completada.
echo App: %WORK_DIR%
echo Lanzadores en escritorio:
echo - %BG_BAT%
echo - %FG_BAT%
echo - %STOP_BAT%
echo.

set "INSTALL_OK=1"
goto :end

:ensure_node
where node >nul 2>nul
if errorlevel 1 goto :install_node
where npm.cmd >nul 2>nul
if errorlevel 1 goto :install_node
for /f "delims=" %%I in ('where node 2^>nul') do (
  set "NODE_EXE=%%I"
  goto :node_done
)
:node_done
if "%NODE_EXE%"=="" set "NODE_EXE=C:\Program Files\nodejs\node.exe"
exit /b 0

:install_node
echo [INFO] Node.js no encontrado. Intentando instalar automaticamente...
where winget >nul 2>nul
if errorlevel 1 (
  echo [ERROR] No se encontro winget. Instala Node.js LTS manualmente.
  exit /b 1
)

winget install OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements
if errorlevel 1 (
  echo [ERROR] Fallo la instalacion automatica de Node.js.
  exit /b 1
)

set "PATH=%PATH%;C:\Program Files\nodejs;C:\Program Files (x86)\nodejs;%LOCALAPPDATA%\Programs\nodejs"
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js no disponible aun. Reabre consola y ejecuta otra vez.
  exit /b 1
)
where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm no disponible aun. Reabre consola y ejecuta otra vez.
  exit /b 1
)
for /f "delims=" %%I in ('where node 2^>nul') do (
  set "NODE_EXE=%%I"
  goto :node_after_install
)
:node_after_install
exit /b 0

:configure_firewall
echo [INFO] Configurando firewall (si hay permisos admin)...
net session >nul 2>nul
if errorlevel 1 (
  echo [AVISO] Sin permisos de administrador. Saltando firewall.
  exit /b 0
)

powershell -NoProfile -Command "if (-not (Get-NetFirewallRule -DisplayName '%FIREWALL_RULE%' -ErrorAction SilentlyContinue)) { New-NetFirewallRule -DisplayName '%FIREWALL_RULE%' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000 -Profile Private | Out-Null }"
exit /b 0

:create_launchers
set "DESKTOP_DIR="
for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "[Environment]::GetFolderPath('DesktopDirectory')"`) do set "DESKTOP_DIR=%%I"
if "%DESKTOP_DIR%"=="" set "DESKTOP_DIR=%USERPROFILE%\Desktop"
if not exist "%DESKTOP_DIR%" set "DESKTOP_DIR=%USERPROFILE%\Escritorio"
if not exist "%DESKTOP_DIR%" mkdir "%DESKTOP_DIR%" >nul 2>nul

set "BG_BAT=%DESKTOP_DIR%\Levantar-Host-WallpaperVideoLAN.bat"
set "FG_BAT=%DESKTOP_DIR%\Levantar-Host-WallpaperVideoLAN-Visible.bat"
set "STOP_BAT=%DESKTOP_DIR%\Cerrar-Host-WallpaperVideoLAN.bat"
set "AUTO_TEMPLATE=%LAUNCHERS_DIR%\AutoInicio-WallpaperVideoLAN.bat"

if not exist "%LAUNCHERS_DIR%\Levantar-Host-WallpaperVideoLAN.bat" (
  echo [ERROR] No se encontro el lanzador base en: %LAUNCHERS_DIR%
  exit /b 1
)
if not exist "%LAUNCHERS_DIR%\Levantar-Host-WallpaperVideoLAN-Visible.bat" (
  echo [ERROR] No se encontro el lanzador visible en: %LAUNCHERS_DIR%
  exit /b 1
)
if not exist "%LAUNCHERS_DIR%\Cerrar-Host-WallpaperVideoLAN.bat" (
  echo [ERROR] No se encontro el lanzador de cierre en: %LAUNCHERS_DIR%
  exit /b 1
)

copy /Y "%LAUNCHERS_DIR%\Levantar-Host-WallpaperVideoLAN.bat" "%BG_BAT%" >nul
if errorlevel 1 (
  echo [ERROR] No se pudo crear: %BG_BAT%
  exit /b 1
)
copy /Y "%LAUNCHERS_DIR%\Levantar-Host-WallpaperVideoLAN-Visible.bat" "%FG_BAT%" >nul
if errorlevel 1 (
  echo [ERROR] No se pudo crear: %FG_BAT%
  exit /b 1
)
copy /Y "%LAUNCHERS_DIR%\Cerrar-Host-WallpaperVideoLAN.bat" "%STOP_BAT%" >nul
if errorlevel 1 (
  echo [ERROR] No se pudo crear: %STOP_BAT%
  exit /b 1
)

echo [OK] Lanzadores creados en escritorio:
echo - %BG_BAT%
echo - %FG_BAT%
echo - %STOP_BAT%

exit /b 0

:configure_autostart
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
if not exist "%STARTUP_DIR%" mkdir "%STARTUP_DIR%" >nul 2>nul
set "AUTO_BAT=%STARTUP_DIR%\AutoInicio-WallpaperVideoLAN.bat"

choice /C SN /N /M "Quieres iniciar WallpaperVideoLAN con Windows? [S/N]: "
if errorlevel 2 (
  if exist "%AUTO_BAT%" del /f /q "%AUTO_BAT%"
  echo [OK] Auto inicio desactivado.
  exit /b 0
)

if errorlevel 1 (
  if exist "%AUTO_TEMPLATE%" (
    copy /Y "%AUTO_TEMPLATE%" "%AUTO_BAT%" >nul
  ) else (
    copy /Y "%BG_BAT%" "%AUTO_BAT%" >nul
  )
  if errorlevel 1 (
    echo [ERROR] No se pudo crear auto inicio en: %AUTO_BAT%
    exit /b 1
  )
  echo [OK] Auto inicio activado: %AUTO_BAT%
)
exit /b 0

:install_dependencies
set "STAMP_FILE=%WORK_DIR%\.deps-lock.sha256"
set "LOCK_HASH="
set "PREV_HASH="

if exist "%WORK_DIR%\package-lock.json" (
  for /f "usebackq delims=" %%H in (`powershell -NoProfile -Command "(Get-FileHash -Algorithm SHA256 '%WORK_DIR%\package-lock.json').Hash"`) do set "LOCK_HASH=%%H"
)

if exist "%STAMP_FILE%" (
  set /p "PREV_HASH="<"%STAMP_FILE%"
)

if exist "%WORK_DIR%\node_modules" if not "%LOCK_HASH%"=="" if /I "%LOCK_HASH%"=="%PREV_HASH%" (
  echo [INFO] Dependencias ya estan instaladas. Saltando npm install.
  exit /b 0
)

echo [INFO] Ejecutando npm install...
call npm.cmd install
if errorlevel 1 (
  echo [ERROR] Fallo npm install.
  exit /b 1
)

if not "%LOCK_HASH%"=="" (
  > "%STAMP_FILE%" echo %LOCK_HASH%
)
exit /b 0

:progress
setlocal EnableDelayedExpansion
set "STEP=%~1"
set "LABEL=%~2"
set /a PCT=(STEP*100)/TOTAL_STEPS
set /a FILLED=(STEP*BAR_WIDTH)/TOTAL_STEPS
set "BAR="
for /L %%I in (1,1,!BAR_WIDTH!) do (
  if %%I LEQ !FILLED! (
    set "BAR=!BAR!#"
  ) else (
    set "BAR=!BAR!-"
  )
)
echo [!BAR!] !PCT!%% - !LABEL!
endlocal
exit /b 0

:fail
echo.
echo Instalacion cancelada por error.
echo.
set "INSTALL_OK=0"

:end
echo.
if "%INSTALL_OK%"=="1" (
  choice /C SN /N /M "Abrir iniciador visible ahora? [S/N]: "
  if errorlevel 1 call "%FG_BAT%"
)
echo.
echo Presiona una tecla para cerrar este instalador...
pause >nul
if "%INSTALL_OK%"=="1" (
  exit /b 0
)
exit /b 1
