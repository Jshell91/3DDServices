# Script para modificar artwork likes via API
param(
    [Parameter(Mandatory=$true)]
    [string]$ArtworkId,
    
    [Parameter(Mandatory=$true)]  
    [int]$TargetLikes,
    
    [string]$ApiKey = "08b9bfdf65f54e49b0b286790786f263b18d3cefcda345b59f6295ee9a746ec2",
    [string]$BaseUrl = "http://localhost:3000"
)

$headers = @{
    "x-api-key" = $ApiKey
    "Content-Type" = "application/json"
}

Write-Host "🎯 Modificando likes para artwork: $ArtworkId" -ForegroundColor Cyan
Write-Host "📊 Target: $TargetLikes likes"

# Ver likes actuales
try {
    $currentResponse = Invoke-RestMethod -Uri "$BaseUrl/artwork/likes/$ArtworkId" -Headers $headers -Method GET
    $currentLikes = [int]$currentResponse.likes
    Write-Host "✅ Likes actuales: $currentLikes" -ForegroundColor Green
} catch {
    Write-Host "⚠️  No se pudieron obtener likes actuales (artwork nuevo?)" -ForegroundColor Yellow
    $currentLikes = 0
}

# Calcular cuántos likes necesitamos añadir
$likesToAdd = $TargetLikes - $currentLikes

if ($likesToAdd -le 0) {
    Write-Host "ℹ️  No se necesita añadir likes (target: $TargetLikes, actual: $currentLikes)" -ForegroundColor Yellow
    exit 0
}

Write-Host "🚀 Añadiendo $likesToAdd likes..." -ForegroundColor Green

# Añadir likes (usuarios simulados)
for ($i = 1; $i -le $likesToAdd; $i++) {
    $userId = "batch_user_${i}_$(Get-Date -Format 'HHmmss')"
    $body = @{
        artwork_id = $ArtworkId
        user_id = $userId
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/artwork/like" -Headers $headers -Method POST -Body $body
        Write-Host "  ✅ Like #$i añadido (user: $userId)" -ForegroundColor DarkGreen
        Start-Sleep -Milliseconds 100  # Evitar sobrecarga
    } catch {
        Write-Host "  ❌ Error añadiendo like #$i: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Verificar resultado final
try {
    $finalResponse = Invoke-RestMethod -Uri "$BaseUrl/artwork/likes/$ArtworkId" -Headers $headers -Method GET
    $finalLikes = [int]$finalResponse.likes
    Write-Host ""
    Write-Host "🎉 Resultado final: $finalLikes likes para '$ArtworkId'" -ForegroundColor Cyan
    
    if ($finalLikes -eq $TargetLikes) {
        Write-Host "✅ Target alcanzado correctamente!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Target no alcanzado (esperado: $TargetLikes, actual: $finalLikes)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error verificando resultado final" -ForegroundColor Red
}