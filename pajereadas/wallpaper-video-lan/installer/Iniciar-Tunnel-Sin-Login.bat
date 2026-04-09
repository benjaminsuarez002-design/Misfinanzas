@echo off
setlocal EnableExtensions

echo.
echo === Iniciar Wallpaper Video LAN + Tunnel SIN login ===
echo.

set "APP_DIR=%USERPROFILE%\Downloads\Misfinanzas\pajereadas\wallpaper-video-lan"
if exist "%APP_DIR%\package.json" goto :app_ok
set "APP_DIR=%USERPROFILE%\WallpaperVideoLAN"
if exist "%APP_DIR%\package.json" goto :app_ok

echo [ERROR] No se encontro la app.
echo Busca package.json en:
echo - %USERPROFILE%\Downloads\Misfinanzas\pajereadas\wallpaper-video-lan
echo - %USERPROFILE%\WallpaperVideoLAN
pause
exit /b 1

:app_ok
set "CF_EXE="
for /f "delims=" %%I in ('where cloudflared 2^>nul') do set "CF_EXE=%%I"
if not "%CF_EXE%"=="" goto :cf_ok
if exist "C:\Program Files\Cloudflare\Cloudflared\cloudflared.exe" set "CF_EXE=C:\Program Files\Cloudflare\Cloudflared\cloudflared.exe"
if exist "C:\Program Files (x86)\Cloudflare\Cloudflared\cloudflared.exe" set "CF_EXE=C:\Program Files (x86)\Cloudflare\Cloudflared\cloudflared.exe"
if not "%CF_EXE%"=="" goto :cf_ok

echo [1/3] cloudflared no encontrado. Instalando...
where winget >nul 2>nul
if errorlevel 1 (
  echo [ERROR] No hay winget. Instala cloudflared manualmente.
  echo https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
  pause
  exit /b 1
)

winget install --id Cloudflare.cloudflared -e --accept-package-agreements --accept-source-agreements
if errorlevel 1 (
  echo [ERROR] Fallo instalacion de cloudflared.
  pause
  exit /b 1
)

if exist "C:\Program Files\Cloudflare\Cloudflared\cloudflared.exe" set "CF_EXE=C:\Program Files\Cloudflare\Cloudflared\cloudflared.exe"
if exist "C:\Program Files (x86)\Cloudflare\Cloudflared\cloudflared.exe" set "CF_EXE=C:\Program Files (x86)\Cloudflare\Cloudflared\cloudflared.exe"
for /f "delims=" %%I in ('where cloudflared 2^>nul') do set "CF_EXE=%%I"
if "%CF_EXE%"=="" (
  echo [ERROR] cloudflared se instalo pero no se encontro ejecutable.
  echo Cierra y vuelve a abrir CMD e intenta de nuevo.
  pause
  exit /b 1
)

:cf_ok
echo [2/3] Iniciando app local en puerto 3000...
start "WallpaperVideoLAN" /min cmd /k "cd /d %APP_DIR% && npm.cmd start"

timeout /t 3 /nobreak >nul

echo [3/3] Iniciando tunnel SIN login...
echo.
echo Cuando aparezca la URL trycloudflare.com, abre esa URL en el telefono.
echo (La URL cambia cada vez que reinicias el tunnel)
echo.
"%CF_EXE%" tunnel --url http://localhost:3000

pause
exit /b 0
