@echo off
setlocal EnableExtensions

echo.
echo === Configurar acceso HTTPS con Cloudflare Tunnel ===
echo.

set "DEFAULT_HOST=wallpaper.misfinanzas.uk"
set "DEFAULT_TUNNEL=wallpaper-lan"
set /p "CF_HOST=Subdominio [ENTER=%DEFAULT_HOST%]: "
if "%CF_HOST%"=="" set "CF_HOST=%DEFAULT_HOST%"
set /p "CF_TUNNEL=Nombre del tunnel [ENTER=%DEFAULT_TUNNEL%]: "
if "%CF_TUNNEL%"=="" set "CF_TUNNEL=%DEFAULT_TUNNEL%"

where cloudflared >nul 2>nul
if errorlevel 1 (
  echo [1/7] cloudflared no encontrado. Intentando instalar...
  where winget >nul 2>nul
  if errorlevel 1 (
    echo [ERROR] No hay winget. Instala cloudflared manualmente y vuelve a ejecutar.
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
) else (
  echo [1/7] cloudflared ya instalado.
)

echo [2/7] Login en Cloudflare (se abrira navegador)...
cloudflared tunnel login
if errorlevel 1 (
  echo [ERROR] Fallo login de Cloudflare.
  pause
  exit /b 1
)

echo [3/7] Creando tunnel: %CF_TUNNEL%
cloudflared tunnel create %CF_TUNNEL%
if errorlevel 1 (
  echo [AVISO] Si ya existia, continuamos.
)

echo [4/7] Listando tunnel para obtener Tunnel ID...
echo.
cloudflared tunnel list

echo.
set /p "CF_TUNNEL_ID=Pega aqui el Tunnel ID exacto: "
if "%CF_TUNNEL_ID%"=="" (
  echo [ERROR] Tunnel ID vacio.
  pause
  exit /b 1
)

echo [5/7] Creando DNS route: %CF_HOST%
cloudflared tunnel route dns %CF_TUNNEL% %CF_HOST%
if errorlevel 1 (
  echo [ERROR] Fallo route dns. Verifica que el dominio este en tu cuenta Cloudflare.
  pause
  exit /b 1
)

echo [6/7] Generando config.yml...
set "CF_DIR=%USERPROFILE%\.cloudflared"
if not exist "%CF_DIR%" mkdir "%CF_DIR%"

set "CFG_FILE=%CF_DIR%\config.yml"
> "%CFG_FILE%" (
  echo tunnel: %CF_TUNNEL_ID%
  echo credentials-file: %CF_DIR%\%CF_TUNNEL_ID%.json
  echo.
  echo ingress:
  echo   - hostname: %CF_HOST%
  echo     service: http://localhost:3000
  echo   - service: http_status:404
)

echo [7/7] Creando lanzador de tunnel en escritorio...
set "DESKTOP_DIR="
for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "[Environment]::GetFolderPath('Desktop')"`) do set "DESKTOP_DIR=%%I"
if "%DESKTOP_DIR%"=="" set "DESKTOP_DIR=%USERPROFILE%\Desktop"
if not exist "%DESKTOP_DIR%" set "DESKTOP_DIR=%USERPROFILE%\Escritorio"
if not exist "%DESKTOP_DIR%" mkdir "%DESKTOP_DIR%" >nul 2>nul

set "TUNNEL_BAT=%DESKTOP_DIR%\Levantar-Tunnel-WallpaperVideoLAN.bat"
> "%TUNNEL_BAT%" (
  echo @echo off
  echo setlocal
  echo echo Iniciando Cloudflare Tunnel...
  echo echo URL: https://%CF_HOST%
  echo cloudflared tunnel run %CF_TUNNEL%
  echo pause
)

echo.
echo Listo. Orden de uso:
echo 1) Levanta tu app local (puerto 3000)
echo 2) Ejecuta: %TUNNEL_BAT%
echo 3) En telefono abre: https://%CF_HOST%
echo.
pause
exit /b 0
