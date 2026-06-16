# CHANGOSBET - Script para compartir con amigos
# Ejecutar con:  ! .\compartir.ps1   (desde Claude Code)
#           o:   .\compartir.ps1     (desde PowerShell)

$frontendPort = 3000
$backendPort  = 3002

# IP real de WiFi/Ethernet (excluye Hyper-V, WSL, loopback, APIPA)
$lanIp = (Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.InterfaceAlias -notmatch 'Loopback|vEthernet|WSL|Hyper|VirtualBox|Bluetooth|VMware' -and
    $_.IPAddress -notmatch '^127\.' -and
    $_.IPAddress -notmatch '^169\.' -and
    $_.IPAddress -notmatch '^172\.'
  } | Select-Object -First 1).IPAddress

if (-not $lanIp) {
  $lanIp = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notmatch '^127\.' -and $_.IPAddress -notmatch '^169\.' } |
    Select-Object -First 1).IPAddress
}

$shareUrl = "http://$($lanIp):$frontendPort"

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "  ║       🎰  CHANGOSBET CASINO  🎰              ║" -ForegroundColor Yellow
Write-Host "  ╚══════════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""
Write-Host "  📱  LINK PARA TUS AMIGOS (misma WiFi):" -ForegroundColor Cyan
Write-Host ""
Write-Host "       $shareUrl" -ForegroundColor Green
Write-Host ""
Write-Host "  🖥️   Tu URL local:  http://localhost:$frontendPort" -ForegroundColor White
Write-Host ""
Write-Host "  ─────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  🌐  Para jugar desde INTERNET (cualquier parte):" -ForegroundColor Magenta
Write-Host "      1. Descargá ngrok: https://ngrok.com/download" -ForegroundColor White
Write-Host "      2. Terminal 1:  ngrok http $frontendPort" -ForegroundColor Yellow
Write-Host "      3. Terminal 2:  ngrok http $backendPort" -ForegroundColor Yellow
Write-Host "      4. Usá la URL  https://xxxx.ngrok-free.app  del frontend" -ForegroundColor White
Write-Host "         (el socket se conecta solo al mismo host en puerto $backendPort)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  ─────────────────────────────────────────────" -ForegroundColor DarkGray

# Check servers
$backOk = $false; $frontOk = $false
try { $backOk  = (Invoke-WebRequest "http://localhost:$backendPort/health" -UseBasicParsing -TimeoutSec 2 -EA Stop).StatusCode -eq 200 } catch {}
try { $frontOk = (Invoke-WebRequest "http://localhost:$frontendPort"       -UseBasicParsing -TimeoutSec 3 -EA Stop).StatusCode -eq 200 } catch {}

Write-Host ""
Write-Host "  Estado:" -ForegroundColor White
Write-Host "    Backend  :3002  $(if ($backOk)  { '✅ Online' } else { '❌ Offline  →  cd backend  &&  npm run dev' })" -ForegroundColor $(if ($backOk)  { 'Green' } else { 'Red' })
Write-Host "    Frontend :3000  $(if ($frontOk) { '✅ Online' } else { '❌ Offline  →  cd frontend &&  npx next dev -H 0.0.0.0' })" -ForegroundColor $(if ($frontOk) { 'Green' } else { 'Red' })
Write-Host ""

Set-Clipboard -Value $shareUrl
Write-Host "  📋 URL copiada al portapapeles!" -ForegroundColor Yellow
Write-Host ""
