@echo off
setlocal EnableExtensions

set "APP_DIR=%USERPROFILE%\Downloads\Misfinanzas\pajereadas\wallpaper-video-lan"
if not exist "%APP_DIR%\package.json" set "APP_DIR=%USERPROFILE%\WallpaperVideoLAN"
if not exist "%APP_DIR%\package.json" (
  echo [ERROR] No se encontro la app local.
  pause
  exit /b 1
)

echo Iniciando servidor local en 3000...
start "WallpaperVideoLAN" /min cmd /k "cd /d %APP_DIR% && npm.cmd start"

timeout /t 3 /nobreak >nul

echo Iniciando tunnel Cloudflare...
cloudflared tunnel run wallpaper-lan

pause
