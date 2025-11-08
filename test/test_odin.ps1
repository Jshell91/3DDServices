# Test script for Odin4Players endpoints
# Fecha: $(Get-Date)
# PowerShell Test Script para endpoints de chat de voz/texto con Odin4Players

# Configuración de la API
$baseUrl = "http://localhost:3000"
$apiKey = "08b9bfdf65f54e49b0b286790786f263b18d3cefcda345b59f6295ee9a746ec2"

# Headers con API Key
$headers = @{
    "Content-Type" = "application/json"
    "x-api-key" = $apiKey
}

# Función para manejar errores y mostrar respuesta
function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Url,
        [object]$Body = $null,
        [string]$Description
    )
    
    Write-Host "`n=== $Description ===" -ForegroundColor Cyan
    Write-Host "Method: $Method" -ForegroundColor Yellow
    Write-Host "URL: $Url" -ForegroundColor Yellow
    
    if ($Body) {
        $jsonBody = $Body | ConvertTo-Json -Depth 3
        Write-Host "Body: $jsonBody" -ForegroundColor Yellow
    }
    
    try {
        if ($Body) {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers -Body ($Body | ConvertTo-Json -Depth 3)
        } else {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers
        }
        
        Write-Host "Response:" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor Green
    }
    catch {
        Write-Host "ERROR:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-Host "Status Code: $statusCode" -ForegroundColor Red
            
            try {
                $errorResponse = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($errorResponse)
                $errorBody = $reader.ReadToEnd()
                Write-Host "Error Body: $errorBody" -ForegroundColor Red
            } catch {
                Write-Host "Could not read error body" -ForegroundColor Red
            }
        }
    }
}

Write-Host "🎮 Testing Odin4Players Voice/Text Chat Endpoints" -ForegroundColor Magenta
Write-Host "=============================================" -ForegroundColor Magenta

# Test 1: Generar token básico para sala de chat
Test-Endpoint -Method "POST" -Url "$baseUrl/odin/token" -Body @{
    room_id = "general_chat"
    user_id = "player_001"
} -Description "Generar token básico para sala de chat"

# Test 2: Generar token para sala de chat de mapa específico
Test-Endpoint -Method "POST" -Url "$baseUrl/odin/token" -Body @{
    room_id = "map_12345"
    user_id = "player_002"
} -Description "Generar token para sala de chat de mapa"

# Test 3: Generar token usando endpoint específico para mapas
Test-Endpoint -Method "POST" -Url "$baseUrl/odin/token/map/67890" -Body @{
    user_id = "player_003"
} -Description "Generar token usando endpoint específico para mapas"

# Test 4: Error - sin room_id
Test-Endpoint -Method "POST" -Url "$baseUrl/odin/token" -Body @{
    user_id = "player_004"
} -Description "Test error - sin room_id"

# Test 5: Error - sin user_id
Test-Endpoint -Method "POST" -Url "$baseUrl/odin/token" -Body @{
    room_id = "test_room"
} -Description "Test error - sin user_id"

# Test 6: Error - sin user_id en endpoint de mapa
Test-Endpoint -Method "POST" -Url "$baseUrl/odin/token/map/12345" -Body @{
} -Description "Test error - sin user_id en endpoint de mapa"

Write-Host "`n🎮 Tests de Odin4Players completados!" -ForegroundColor Magenta
