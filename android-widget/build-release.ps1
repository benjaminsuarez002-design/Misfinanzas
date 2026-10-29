$ErrorActionPreference = 'Stop'
$signingRoot = Join-Path $env:USERPROFILE '.misfinanzas-signing'
$credentials = Get-Content -Raw -LiteralPath (Join-Path $signingRoot 'credenciales.json') | ConvertFrom-Json
$env:MISFINANZAS_SIGNING_STORE = Join-Path $signingRoot 'misfinanzas-release.p12'
$env:MISFINANZAS_SIGNING_PASSWORD = $credentials.password
Push-Location $PSScriptRoot
try {
    if (Test-Path -LiteralPath '.\gradlew.bat') { & '.\gradlew.bat' assembleRelease }
    elseif (Get-Command gradle -ErrorAction SilentlyContinue) { & gradle assembleRelease }
    else { throw 'Falta Gradle. Abrí el proyecto en Android Studio para instalar las herramientas de compilación.' }
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo compilar el APK.' }
} finally {
    Pop-Location
    Remove-Item Env:MISFINANZAS_SIGNING_PASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:MISFINANZAS_SIGNING_STORE -ErrorAction SilentlyContinue
}
