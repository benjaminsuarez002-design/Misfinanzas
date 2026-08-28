$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$outputDir = Join-Path $projectRoot '.deploy-static'
$wrangler = Join-Path $projectRoot 'voice-capture-worker\node_modules\.bin\wrangler.cmd'
$config = Join-Path $projectRoot 'wrangler.direct.jsonc'

$publicFiles = @(
  'index.html',
  'app.html',
  'admin.html',
  'autorizar.html',
  'reset.html',
  'theme-config.js',
  'apple-touch-icon.png',
  'MisFinanzas-web.apk',
  'MisFinanzas-widget.apk',
  'MisFinanzas-widget-gemini.apk'
)

New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

Get-ChildItem -LiteralPath $outputDir -File | ForEach-Object {
  if (-not $publicFiles.Contains($_.Name)) {
    Remove-Item -LiteralPath $_.FullName -Force
  }
}

foreach ($file in $publicFiles) {
  $source = Join-Path $projectRoot $file
  if (-not (Test-Path -LiteralPath $source)) {
    throw "Falta el archivo público: $file"
  }
  Copy-Item -LiteralPath $source -Destination (Join-Path $outputDir $file) -Force
}

& $wrangler deploy --config $config
if ($LASTEXITCODE -ne 0) { throw 'Cloudflare no pudo completar el despliegue.' }
