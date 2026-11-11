# Captura a tela do emulador para docs\screenshots\tela-<data>.png
# Uso: powershell -ExecutionPolicy Bypass -File tools\screenshot.ps1 [-Nome login]
param([string]$Nome = ("tela-" + (Get-Date -Format 'yyyyMMdd-HHmmss')))
$sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { 'C:\Android\Sdk' }
$dir = Join-Path $PSScriptRoot '..\docs\screenshots'
New-Item -ItemType Directory -Force $dir | Out-Null
$remote = '/sdcard/__shot.png'
& "$sdk\platform-tools\adb.exe" shell screencap -p $remote
& "$sdk\platform-tools\adb.exe" pull $remote (Join-Path $dir "$Nome.png") | Out-Null
& "$sdk\platform-tools\adb.exe" shell rm $remote
Write-Output (Resolve-Path (Join-Path $dir "$Nome.png")).Path
