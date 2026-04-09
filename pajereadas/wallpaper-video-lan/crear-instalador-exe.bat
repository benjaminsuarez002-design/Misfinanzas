@echo off
setlocal EnableExtensions

set "APP_DIR=%~dp0"
set "PROJECT=%APP_DIR%installer\exe-installer\WallpaperVideoLAN.Installer.csproj"
set "OUTPUT=%APP_DIR%installer\dist"
set "RUNTIME=win-x64"

where dotnet >nul 2>nul
if errorlevel 1 (
  echo [ERROR] No se encontro dotnet SDK en PATH.
  echo Instala .NET SDK 9 o superior y volve a ejecutar este script.
  pause
  exit /b 1
)

if not exist "%PROJECT%" (
  echo [ERROR] No se encontro el proyecto del instalador:
  echo %PROJECT%
  pause
  exit /b 1
)

echo.
echo Generando instalador .exe...
echo.

dotnet publish "%PROJECT%" ^
  -c Release ^
  -r %RUNTIME% ^
  --self-contained true ^
  -p:PublishSingleFile=true ^
  -p:IncludeNativeLibrariesForSelfExtract=true ^
  -p:PublishTrimmed=false ^
  -p:DebugSymbols=false ^
  -p:DebugType=None ^
  -o "%OUTPUT%"

if errorlevel 1 (
  echo.
  echo [ERROR] Fallo la compilacion del instalador.
  pause
  exit /b 1
)

echo.
echo Instalador generado en:
echo %OUTPUT%\WallpaperVideoLAN-Installer.exe
echo.
pause
