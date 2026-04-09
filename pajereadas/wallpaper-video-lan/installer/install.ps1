Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$installerUrl = "https://raw.githubusercontent.com/benjaminsuarez002-design/Misfinanzas/main/pajereadas/wallpaper-video-lan/installer/Instalar-Desde-GitHub.bat"
$tempBat = Join-Path $env:TEMP "Instalar-Desde-GitHub.bat"

try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
} catch { }

Write-Host ""
Write-Host "WallpaperVideoLAN - Bootstrap installer"
Write-Host "Descargando instalador..."

Invoke-WebRequest -Uri $installerUrl -OutFile $tempBat -UseBasicParsing

if (-not (Test-Path $tempBat)) {
    throw "No se pudo descargar el instalador."
}

Write-Host "Ejecutando instalador..."
Start-Process -FilePath $tempBat -Verb RunAs

