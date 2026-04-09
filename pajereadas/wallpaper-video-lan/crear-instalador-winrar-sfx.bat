@echo off
setlocal EnableExtensions

set "APP_DIR=%~dp0"
set "RAR_EXE=C:\Program Files\WinRAR\Rar.exe"
set "COMMENT_FILE=%APP_DIR%installer\sfx\wallpaper-video-lan.sfx.comment"
set "OUTPUT=%APP_DIR%installer\dist\WallpaperVideoLAN-WinRAR-Setup.exe"

if not exist "%RAR_EXE%" (
  echo [ERROR] No se encontro WinRAR en:
  echo %RAR_EXE%
  pause
  exit /b 1
)

if not exist "%COMMENT_FILE%" (
  echo [ERROR] No se encontro el comentario SFX:
  echo %COMMENT_FILE%
  pause
  exit /b 1
)

if not exist "%APP_DIR%installer\dist" mkdir "%APP_DIR%installer\dist"
if exist "%OUTPUT%" del /f /q "%OUTPUT%"

echo.
echo Generando instalador autoextraible WinRAR...
echo.

pushd "%APP_DIR%"
"%RAR_EXE%" a -r -ep1 -sfxDefault.sfx -z"%COMMENT_FILE%" "%OUTPUT%" ^
  public ^
  src ^
  installer\launchers ^
  installer\tools ^
  installer\sfx ^
  package.json ^
  package-lock.json ^
  .env.example ^
  .gitignore ^
  README.md ^
  HANDOFF.md
set "RAR_EXIT=%ERRORLEVEL%"
popd

if not "%RAR_EXIT%"=="0" (
  echo.
  echo [ERROR] Fallo la generacion del instalador SFX.
  pause
  exit /b 1
)

echo.
echo Instalador SFX generado en:
echo %OUTPUT%
echo.
pause
