@echo off
setlocal EnableExtensions

set "FOUND="
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":3000" ^| findstr "LISTENING"') do (
  taskkill /PID %%P /F >nul 2>nul
  set "FOUND=1"
)

if defined FOUND (
  echo [OK] Servidor detenido.
) else (
  echo [INFO] No habia servidor escuchando en puerto 3000.
)

exit /b 0
