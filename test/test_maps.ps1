# test_maps.ps1
$apiKey = "08b9bfdf65f54e49b0b286790786f263b18d3cefcda345b59f6295ee9a746ec2"
$baseUrl = "http://localhost:3000"


function Get-Maps {
    Write-Host "GET /maps"
    $headers = @{ "x-api-key" = $apiKey }
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/maps" -Headers $headers -ErrorAction Stop
        $response.Content | Write-Output
    } catch {
        Write-Host $_.Exception.Response.GetResponseStream() | Get-Content | Write-Output
    }
    Write-Host ""
}


function Get-MapById($id) {
    Write-Host "GET /maps/$id"
    $headers = @{ "x-api-key" = $apiKey }
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/maps/$id" -Headers $headers -ErrorAction Stop
        $response.Content | Write-Output
    } catch {
        Write-Host $_.Exception.Response.GetResponseStream() | Get-Content | Write-Output
    }
    Write-Host ""
}


function Post-Map($map) {
    Write-Host "POST /maps (" + $map.name + ")"
    $body = $map | ConvertTo-Json -Depth 3
    $headers = @{ "Content-Type" = "application/json"; "x-api-key" = $apiKey }
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/maps" -Method POST -Headers $headers -Body $body -ErrorAction Stop
        $response.Content | Write-Output
        $json = $response.Content | ConvertFrom-Json
        if ($json.ok -and $json.data -and $json.data.id) {
            return $json.data.id
        } else {
            Write-Host "[ERROR] No se pudo obtener el id del mapa creado."
            return $null
        }
    } catch {
        Write-Host $_.Exception.Response.GetResponseStream() | Get-Content | Write-Output
        return $null
    }
    Write-Host ""
}


function Put-Map($id, $fields) {
    Write-Host "PUT /maps/$id"
    $body = $fields | ConvertTo-Json -Depth 3
    $headers = @{ "Content-Type" = "application/json"; "x-api-key" = $apiKey }
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/maps/$id" -Method PUT -Headers $headers -Body $body -ErrorAction Stop
        $response.Content | Write-Output
    } catch {
        Write-Host $_.Exception.Response.GetResponseStream() | Get-Content | Write-Output
    }
    Write-Host ""
}


function Delete-Map($id) {
    Write-Host "DELETE /maps/$id"
    $headers = @{ "x-api-key" = $apiKey }
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/maps/$id" -Method DELETE -Headers $headers -ErrorAction Stop
        $response.Content | Write-Output
    } catch {
        Write-Host $_.Exception.Response.GetResponseStream() | Get-Content | Write-Output
    }
    Write-Host ""
}


# Pruebas
Get-Maps


$newMap = @{
    name = "TEST_MAP_PS1"
    map = "TEST_MAP_PS1"
    codemap = ""
    is_single_player = $true
    name_in_game = "Test Map Powershell"
    is_online = $false
    visible_map_select = $true
    views = "0"
    sponsor = "TestPS1"
    image = "test_ps1.png"
    max_players = 77
}

$id = Post-Map $newMap
if ($id) {
    Get-MapById $id
    Put-Map $id @{ views = "123"; max_players = 99 }
    Get-MapById $id
    Delete-Map $id
    Get-MapById $id
}
Get-Maps
