@echo off
setlocal EnableExtensions

set "APP_DIR=%~dp0"
set "OUTPUT=%APP_DIR%dist"
set "ZIP=%OUTPUT%\wallpaper-video-lan-instalable.zip"

if not exist "%OUTPUT%" mkdir "%OUTPUT%"
if exist "%ZIP%" del /f /q "%ZIP%"

powershell -NoProfile -Command "$items = Get-ChildItem -LiteralPath '%APP_DIR%' -Force | Where-Object { $_.Name -notin @('node_modules','.git','.cache','dist','.env','server.log') }; Compress-Archive -Path ($items.FullName) -DestinationPath '%ZIP%' -Force"
if errorlevel 1 (
  echo Error creando ZIP.
  pause
  exit /b 1
)

echo Paquete generado en:
echo %ZIP%
pause
