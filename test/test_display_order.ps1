# Test Display Order Functionality
# Script para validar automáticamente la funcionalidad de display_order

param(
    [string]$BaseUrl = "localhost:3000"
)

Write-Host "🧪 Testing Display Order Functionality" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Función helper para hacer requests
function Invoke-ApiRequest {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Body = $null
    )
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            UseBasicParsing = $true
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        return @{
            Success = $true
            StatusCode = $response.StatusCode
            Data = ($response.Content | ConvertFrom-Json)
        }
    }
    catch {
        return @{
            Success = $false
            Error = $_.Exception.Message
            StatusCode = $_.Exception.Response.StatusCode.value__
        }
    }
}

# Test 1: Verificar que servidor esté corriendo
Write-Host "`n📡 Test 1: Server Health Check" -ForegroundColor Yellow
$health = Invoke-ApiRequest "http://$BaseUrl/health"
if ($health.Success) {
    Write-Host "✅ Server is running" -ForegroundColor Green
} else {
    Write-Host "❌ Server not responding: $($health.Error)" -ForegroundColor Red
    exit 1
}

# Test 2: Obtener maps públicos (solo visibles)
Write-Host "`n🗺️ Test 2: Public Maps Endpoint" -ForegroundColor Yellow
$publicMaps = Invoke-ApiRequest "http://$BaseUrl/maps"
if ($publicMaps.Success) {
    $count = $publicMaps.Data.data.Count
    Write-Host "✅ Got $count public maps" -ForegroundColor Green
    
    # Verificar orden ascendente
    $orders = $publicMaps.Data.data | ForEach-Object { $_.display_order }
    $sortedOrders = $orders | Sort-Object
    if (($orders -join ",") -eq ($sortedOrders -join ",")) {
        Write-Host "✅ Maps are properly ordered by display_order" -ForegroundColor Green
    } else {
        Write-Host "❌ Maps are NOT properly ordered" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Failed to get public maps: $($publicMaps.Error)" -ForegroundColor Red
}

# Test 3: Test validación de display_order negativo
Write-Host "`n❌ Test 3: Negative display_order validation" -ForegroundColor Yellow
$invalidMap = @{
    name = "Test Invalid Order"
    map = "test_invalid.scene"
    codemap = "invalid"
    is_single_player = $true
    name_in_game = "Invalid Test"
    is_online = $false
    visible_map_select = $true
    views = 0
    sponsor = "Test"
    image = "test.jpg"
    max_players = 1
    display_order = -1
}

$invalidResult = Invoke-ApiRequest "http://$BaseUrl/maps" "POST" $invalidMap
if (!$invalidResult.Success -and $invalidResult.StatusCode -eq 400) {
    Write-Host "✅ Correctly rejected negative display_order" -ForegroundColor Green
} else {
    Write-Host "❌ Should have rejected negative display_order" -ForegroundColor Red
}

# Test 4: Test validación de display_order = 0
Write-Host "`n🚫 Test 4: Zero display_order validation" -ForegroundColor Yellow
$zeroMap = $invalidMap.Clone()
$zeroMap.display_order = 0
$zeroMap.name = "Test Zero Order"

$zeroResult = Invoke-ApiRequest "http://$BaseUrl/maps" "POST" $zeroMap
if (!$zeroResult.Success -and $zeroResult.StatusCode -eq 400) {
    Write-Host "✅ Correctly rejected zero display_order" -ForegroundColor Green
} else {
    Write-Host "❌ Should have rejected zero display_order" -ForegroundColor Red
}

# Test 5: Crear map con display_order válido
Write-Host "`n✅ Test 5: Valid display_order creation" -ForegroundColor Yellow
$validMap = @{
    name = "Test Valid Order"
    map = "test_valid.scene"
    codemap = "valid"
    is_single_player = $true
    name_in_game = "Valid Test"
    is_online = $false
    visible_map_select = $true
    views = 0
    sponsor = "Test"
    image = "test.jpg"
    max_players = 1
    display_order = 999
}

$validResult = Invoke-ApiRequest "http://$BaseUrl/maps" "POST" $validMap
if ($validResult.Success) {
    Write-Host "✅ Successfully created map with display_order = 999" -ForegroundColor Green
    $createdId = $validResult.Data.data.id
    Write-Host "   Created map ID: $createdId" -ForegroundColor Cyan
    
    # Cleanup: Eliminar el map de prueba
    $deleteResult = Invoke-ApiRequest "http://$BaseUrl/maps/$createdId" "DELETE"
    if ($deleteResult.Success) {
        Write-Host "🧹 Cleaned up test map" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Failed to create valid map: $($validResult.Error)" -ForegroundColor Red
}

# Test 6: Verificar auto-asignación de display_order
Write-Host "`n🔄 Test 6: Auto-assign display_order" -ForegroundColor Yellow
$autoMap = @{
    name = "Test Auto Order"
    map = "test_auto.scene"
    codemap = "auto"
    is_single_player = $true
    name_in_game = "Auto Test"
    is_online = $false
    visible_map_select = $true
    views = 0
    sponsor = "Test"
    image = "test.jpg"
    max_players = 1
    # No display_order - debe auto-asignar
}

$autoResult = Invoke-ApiRequest "http://$BaseUrl/maps" "POST" $autoMap
if ($autoResult.Success) {
    $assignedOrder = $autoResult.Data.data.display_order
    Write-Host "✅ Auto-assigned display_order: $assignedOrder" -ForegroundColor Green
    
    # Cleanup
    $createdId = $autoResult.Data.data.id
    $deleteResult = Invoke-ApiRequest "http://$BaseUrl/maps/$createdId" "DELETE"
    if ($deleteResult.Success) {
        Write-Host "🧹 Cleaned up test map" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Failed to auto-assign display_order: $($autoResult.Error)" -ForegroundColor Red
}

Write-Host "`n🎯 Testing Complete!" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Test manual de dashboard
Write-Host "`n🖥️ Manual Tests:" -ForegroundColor Magenta
Write-Host "1. Open dashboard: http://$BaseUrl/admin" -ForegroundColor White
Write-Host "2. Go to 'Maps Management' tab" -ForegroundColor White
Write-Host "3. Try drag and drop reordering" -ForegroundColor White
Write-Host "4. Try editing display_order manually" -ForegroundColor White
Write-Host "5. Test duplicate order (should auto-increment others)" -ForegroundColor White
