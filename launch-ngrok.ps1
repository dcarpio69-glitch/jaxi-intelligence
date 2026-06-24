#!/usr/bin/env pwsh
# JAXI Intelligence — ngrok Launcher
# Lanza dos tunnels (backend:3001 + frontend:3000) y actualiza el .env automáticamente

Write-Host "`n🚀 JAXI Intelligence — ngrok Setup" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

# Check ngrok installed
if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
    Write-Host "❌ ngrok no está instalado. Instálalo desde https://ngrok.com/download" -ForegroundColor Red
    exit 1
}

Write-Host "✅ ngrok encontrado`n" -ForegroundColor Green

# Check ngrok auth token
$ngrokConfig = "$env:USERPROFILE\.ngrok2\ngrok.yml"
$ngrokConfig2 = "$env:USERPROFILE\AppData\Local\ngrok\ngrok.yml"
$hasToken = (Test-Path $ngrokConfig) -or (Test-Path $ngrokConfig2)

if (-not $hasToken) {
    Write-Host "⚠️  Necesitas un authtoken de ngrok (gratis en https://dashboard.ngrok.com/get-started/your-authtoken)" -ForegroundColor Yellow
    $token = Read-Host "Pega tu ngrok authtoken aquí"
    if ($token) {
        ngrok config add-authtoken $token
        Write-Host "✅ Token configurado`n" -ForegroundColor Green
    }
}

Write-Host "🔧 Iniciando tunnels..." -ForegroundColor Yellow
Write-Host "   Espera 5 segundos para obtener las URLs...`n" -ForegroundColor Gray

# Start backend tunnel in background
$backendJob = Start-Job -ScriptBlock { ngrok http 3001 --log=stdout }
Start-Sleep -Seconds 5

# Get backend URL from ngrok API
try {
    $ngrokAPI = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
    $backendUrl = ($ngrokAPI.tunnels | Where-Object { $_.config.addr -like "*3001*" } | Select-Object -First 1).public_url
    
    if (-not $backendUrl) {
        $backendUrl = $ngrokAPI.tunnels[0].public_url
    }
    
    Write-Host "✅ Backend tunnel: $backendUrl" -ForegroundColor Green
    
    # Force HTTPS
    if ($backendUrl -like "http://*") { $backendUrl = $backendUrl -replace "^http://", "https://" }
    
    # Now update .env file
    $envPath = Join-Path $PSScriptRoot "backend\.env"
    if (Test-Path $envPath) {
        $env_content = Get-Content $envPath -Raw
        
        # Update relevant URLs
        $env_content = $env_content -replace 'ALLOWED_ORIGINS=.*', "ALLOWED_ORIGINS=http://localhost:3000,$backendUrl"
        $env_content = $env_content -replace 'MICROSOFT_REDIRECT_URI=.*', "MICROSOFT_REDIRECT_URI=$backendUrl/api/v1/integrations/outlook/callback"
        $env_content = $env_content -replace 'PROCORE_REDIRECT_URI=.*', "PROCORE_REDIRECT_URI=$backendUrl/api/v1/integrations/procore/callback"
        
        Set-Content $envPath $env_content -NoNewline
        Write-Host "✅ .env actualizado con URLs de ngrok" -ForegroundColor Green
    }
    
    Write-Host "`n=====================================" -ForegroundColor Cyan
    Write-Host "🎉 JAXI Intelligence compartido en:" -ForegroundColor Green
    Write-Host "`n   BACKEND : $backendUrl" -ForegroundColor White
    Write-Host "   FRONTEND: http://localhost:3000 (local) o ejecuta ngrok http 3000" -ForegroundColor White
    Write-Host "`n📋 PASOS PENDIENTES (manual):" -ForegroundColor Yellow
    Write-Host "   1. Azure Portal → App Registrations → JAXI Intelligence → Authentication" -ForegroundColor Gray
    Write-Host "      Agregar Redirect URI: $backendUrl/api/v1/integrations/outlook/callback" -ForegroundColor Gray
    Write-Host "`n   2. Procore Developer Portal → My Apps → JAXI Intelligence" -ForegroundColor Gray
    Write-Host "      Agregar OAuth Redirect: $backendUrl/api/v1/integrations/procore/callback" -ForegroundColor Gray
    Write-Host "`n   3. Reiniciar el backend para que tome el nuevo .env" -ForegroundColor Gray
    Write-Host "=====================================" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ No se pudo conectar al API de ngrok. Verifica que ngrok esté corriendo." -ForegroundColor Red
    Write-Host "   Corre manualmente: ngrok http 3001" -ForegroundColor Gray
}

Write-Host "`nPresiona Enter para continuar..." -ForegroundColor Gray
Read-Host
Stop-Job $backendJob -ErrorAction SilentlyContinue
Remove-Job $backendJob -ErrorAction SilentlyContinue
