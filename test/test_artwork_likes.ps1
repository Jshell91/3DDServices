# test_artwork_likes.ps1
$apiKey = "08b9bfdf65f54e49b0b286790786f263b18d3cefcda345b59f6295ee9a746ec2"
$baseUrl = "http://localhost:3000"

function Post-Like($artwork_id, $user_id) {
    Write-Host "POST /artwork/like ($artwork_id, $user_id)"
    $body = @{ artwork_id = $artwork_id; user_id = $user_id } | ConvertTo-Json
    $headers = @{ "Content-Type" = "application/json"; "x-api-key" = $apiKey }
    $response = Invoke-WebRequest -Uri "$baseUrl/artwork/like" -Method POST -Headers $headers -Body $body
    $response.Content | Write-Output
    Write-Host ""
}

function Get-Likes($artwork_id) {
    Write-Host "GET /artwork/likes/$artwork_id"
    $headers = @{ "x-api-key" = $apiKey }
    $response = Invoke-WebRequest -Uri "$baseUrl/artwork/likes/$artwork_id" -Headers $headers
    $response.Content | Write-Output
    Write-Host ""
}

function Get-HasLiked($artwork_id, $user_id) {
    Write-Host "GET /artwork/has-liked/$artwork_id/$user_id"
    $headers = @{ "x-api-key" = $apiKey }
    $response = Invoke-WebRequest -Uri "$baseUrl/artwork/has-liked/$artwork_id/$user_id" -Headers $headers
    $response.Content | Write-Output
    Write-Host ""
}

function Get-CountLikes() {
    Write-Host "GET /artwork/count-likes"
    $headers = @{ "x-api-key" = $apiKey }
    $response = Invoke-WebRequest -Uri "$baseUrl/artwork/count-likes" -Headers $headers
    $response.Content | Write-Output
    Write-Host ""
}

# Inserciones
Post-Like "obra_test_1" "usuario_test_1"
Post-Like "obra_test_1" "usuario_test_1" # Duplicado, debe fallar
Post-Like "obra_test_1" "usuario_test_2"
Post-Like "obra_test_2" "usuario_test_1"
Post-Like "obra_test_2" "usuario_test_2"
Post-Like "obra_test_3" "usuario_test_1"
Post-Like "obra_test_3" "usuario_test_3"
Post-Like "obra_test_4" "usuario_test_2"
Post-Like "obra_test_4" "usuario_test_4"
Post-Like "obra_test_5" "usuario_test_5"
Post-Like "obra_test_5" "usuario_test_1"
Post-Like "obra_test_6" "usuario_test_6"
Post-Like "obra_test_6" "usuario_test_2"

# Consultas
Get-Likes "obra_test_1"
Get-Likes "obra_test_2"
Get-HasLiked "obra_test_1" "usuario_test_1"
Get-HasLiked "obra_test_2" "usuario_test_2"
Get-HasLiked "obra_test_2" "usuario_test_3"
Get-CountLikes
