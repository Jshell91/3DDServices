# Script para insertar mapa ART_EXHIBITIONS_4Deya
$apiKey = "08b9bfdf65f54e49b0b286790786f263b18d3cefcda345b59f6295ee9a746ec2"  # Reemplaza con tu API key real
$baseUrl = "http://localhost:3000"

$mapData = @{
    name = "ART_EXHIBITIONS_4Deya"
    map = "ART_EXHIBITIONS_4Deya"
    codemap = ""
    is_single_player = $true
    name_in_game = "4DEYA COMMUNITY CAMPUS"
    is_online = $true
    visible_map_select = $true
    views = "1000"
    sponsor = "4DEYA"
    image = "IMP_4DEYA_COMMUNITY_CAMPUS.jpg"
    max_players = 50
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "x-api-key" = $apiKey
}

try {
    Write-Host "Insertando mapa ART_EXHIBITIONS_4Deya..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Uri "$baseUrl/maps" -Method Post -Body $mapData -Headers $headers
    
    if ($response.ok) {
        Write-Host "✅ Mapa insertado exitosamente!" -ForegroundColor Green
        Write-Host "ID del mapa: $($response.data.id)" -ForegroundColor Cyan
        Write-Host "Nombre: $($response.data.name)" -ForegroundColor Cyan
        Write-Host "Nombre en juego: $($response.data.name_in_game)" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Error: $($response.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error en la petición: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Respuesta del servidor: $($_.Exception.Response)" -ForegroundColor Red
}
