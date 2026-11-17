# Sobe o emulador Android (AVD "ClinicaPsi_API35").
# Uso: powershell -ExecutionPolicy Bypass -File scripts\emulador.ps1 [-Cold]
param([switch]$Cold)
$sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { 'C:\Android\Sdk' }
$emuArgs = @('-avd', 'ClinicaPsi_API35', '-gpu', 'host', '-no-audio', '-no-boot-anim')
if ($Cold) { $emuArgs += '-no-snapshot-load' }
& "$sdk\emulator\emulator.exe" @emuArgs
