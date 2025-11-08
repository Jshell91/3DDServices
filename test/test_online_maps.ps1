# test_online_maps.ps1
$apiKey = "08b9bfdf65f54e49b0b286790786f263b18d3cefcda345b59f6295ee9a746ec2"
$baseUrl = "http://localhost:3000"

function Get-OnlineMaps {
    Write-Host "GET /online-maps"
    $headers = @{ "x-api-key" = $apiKey }
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/online-maps" -Headers $headers -ErrorAction Stop
        $response.Content | Write-Output
    } catch {
        if ($_.Exception.Response -and $_.Exception.Response.GetResponseStream()) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $body = $reader.ReadToEnd()
            Write-Output $body
        } else {
            Write-Host $_
        }
    }
    Write-Host ""
}

function Get-OnlineMapById($id) {
    Write-Host "GET /online-maps/$id"
    $headers = @{ "x-api-key" = $apiKey }
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/online-maps/$id" -Headers $headers -ErrorAction Stop
        $response.Content | Write-Output
    } catch {
        Write-Host $_.Exception.Response.GetResponseStream() | Get-Content | Write-Output
    }
    Write-Host ""
}


function New-OnlineMap {
    param($map)
    Write-Host "POST /online-maps (" + $map.map_name + ")"
    $body = $map | ConvertTo-Json -Depth 3
    $headers = @{ "Content-Type" = "application/json"; "x-api-key" = $apiKey }
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/online-maps" -Method POST -Headers $headers -Body $body -ErrorAction Stop
        $response.Content | Write-Output
        $json = $response.Content | ConvertFrom-Json
        if ($json.ok -and $json.data -and $json.data.id) {
            return $json.data.id
        } else {
            Write-Host "[ERROR] Could not get the id of the created online map."
            return $null
        }
    } catch {
        Write-Host $_.Exception.Response.GetResponseStream() | Get-Content | Write-Output
        return $null
    }
    Write-Host ""
}

function Set-OnlineMap {
    param($id, $fields)
    Write-Host "PUT /online-maps/$id"
    $body = $fields | ConvertTo-Json -Depth 3
    $headers = @{ "Content-Type" = "application/json"; "x-api-key" = $apiKey }
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/online-maps/$id" -Method PUT -Headers $headers -Body $body -ErrorAction Stop
        $response.Content | Write-Output
    } catch {
        Write-Host $_.Exception.Response.GetResponseStream() | Get-Content | Write-Output
    }
    Write-Host ""
}

function Remove-OnlineMap {
    param($id)
    Write-Host "DELETE /online-maps/$id"
    $headers = @{ "x-api-key" = $apiKey }
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/online-maps/$id" -Method DELETE -Headers $headers -ErrorAction Stop
        $response.Content | Write-Output
    } catch {
        Write-Host $_.Exception.Response.GetResponseStream() | Get-Content | Write-Output
    }
    Write-Host ""
}

# Pruebas
Get-OnlineMaps

$newOnlineMap = @{
    map_name = "ONLINE_MAP_PS1"
    address = "127.0.0.1"
    port = 9000
    current_players = 5
    max_players = 50
    opened_stamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
    status = "open"
    closed_stamp = $null
}

$id = New-OnlineMap $newOnlineMap
if ($id) {
    Get-OnlineMapById $id
    Set-OnlineMap $id @{ current_players = 10; status = "full" }
    Get-OnlineMapById $id
    Remove-OnlineMap $id
    Get-OnlineMapById $id
}
Get-OnlineMaps
