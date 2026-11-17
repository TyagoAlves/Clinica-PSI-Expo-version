# Logs do app no emulador: console.log do JS (ReactNativeJS), erros nativos e crashes.
# Uso: powershell -ExecutionPolicy Bypass -File scripts\logcat.ps1 [-Tudo]
param([switch]$Tudo)
$sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { 'C:\Android\Sdk' }
$adb = "$sdk\platform-tools\adb.exe"
& $adb logcat -c
if ($Tudo) { & $adb logcat -v time }
else { & $adb logcat -v time 'ReactNativeJS:V' 'ReactNative:W' 'AndroidRuntime:E' 'expo:V' '*:S' }
