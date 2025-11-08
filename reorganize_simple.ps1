param([switch]$DryRun)

$ErrorActionPreference = 'Stop'

Write-Host "Reorganizando proyecto 3DDServices..." -ForegroundColor Cyan
if ($DryRun) {
    Write-Host "MODO DRY-RUN: Solo mostrando cambios" -ForegroundColor Yellow
}

function Move-FileWithConfirm {
    param([string]$Source, [string]$Destination)
    
    if (-not (Test-Path $Source)) {
        Write-Host "Saltando: $Source (no existe)" -ForegroundColor DarkGray
        return
    }
    
    $destDir = Split-Path $Destination -Parent
    if (-not (Test-Path $destDir)) {
        if ($DryRun) {
            Write-Host "[DRY] Crear directorio: $destDir" -ForegroundColor Cyan
        } else {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
            Write-Host "Directorio creado: $destDir" -ForegroundColor Green
        }
    }
    
    if ($DryRun) {
        Write-Host "[DRY] Mover: $Source -> $Destination" -ForegroundColor Cyan
    } else {
        Move-Item -Path $Source -Destination $Destination -Force
        Write-Host "Movido: $Source -> $Destination" -ForegroundColor Green
    }
}

try {
    Write-Host "`n=== MODULO API ===" -ForegroundColor Yellow
    Move-FileWithConfirm "index.js" "api/index.js"
    Move-FileWithConfirm "postgreService.js" "api/postgreService.js"
    Move-FileWithConfirm "odinService.js" "api/odinService.js"
    Move-FileWithConfirm "config.js" "api/config.js"
    Move-FileWithConfirm "package.json" "api/package.json"
    Move-FileWithConfirm "nodemon.json" "api/nodemon.json"
    Move-FileWithConfirm "ecosystem.config.js" "api/ecosystem.config.js"
    Move-FileWithConfirm "server-standalone.js" "api/server-standalone.js"
    Move-FileWithConfirm "package-standalone.json" "api/package-standalone.json"
    
    if (Test-Path "public") {
        Move-FileWithConfirm "public" "api/public"
    }
    
    Write-Host "`n=== MODULO BUILD ===" -ForegroundColor Yellow
    Move-FileWithConfirm "build_unreal.ps1" "build/build_unreal.ps1"
    Move-FileWithConfirm "UnrealFullBuild.ps1" "build/UnrealFullBuild.ps1"
    Move-FileWithConfirm "UnrealFullBuild" "build/UnrealFullBuild"
    Move-FileWithConfirm "run_migration.js" "build/run_migration.js"
    
    Write-Host "`n=== MODULO SERVERS ===" -ForegroundColor Yellow
    Move-FileWithConfirm "manage_unreal_servers.sh" "servers/manage_unreal_servers.sh"
    Move-FileWithConfirm "unreal_healthcheck.sh" "servers/unreal_healthcheck.sh"
    Move-FileWithConfirm "start_all_servers.sh" "servers/start_all_servers.sh"
    Move-FileWithConfirm "start-production.sh" "servers/start-production.sh"
    Move-FileWithConfirm "start-production.ps1" "servers/start-production.ps1"
    Move-FileWithConfirm "run_server.ps1" "servers/run_server.ps1"
    Move-FileWithConfirm "diagnose.sh" "servers/diagnose.sh"
    Move-FileWithConfirm "diagnose.ps1" "servers/diagnose.ps1"
    
    Write-Host "`n=== MODULO DOCS ===" -ForegroundColor Yellow
    Move-FileWithConfirm "API_DOCUMENTATION.md" "docs/API_DOCUMENTATION.md"
    Move-FileWithConfirm "API_VERSION.md" "docs/API_VERSION.md"
    Move-FileWithConfirm "DEPLOY.md" "docs/DEPLOY.md"
    Move-FileWithConfirm "PROJECT_IDEAS.md" "docs/PROJECT_IDEAS.md"
    Move-FileWithConfirm "PM2_COMMANDS.md" "docs/PM2_COMMANDS.md"
    Move-FileWithConfirm "README.md" "docs/README.md"
    Move-FileWithConfirm "CHANGELOG.md" "docs/CHANGELOG.md"
    
    Write-Host "`n=== CREAR ESTRUCTURA LOGS ===" -ForegroundColor Yellow
    if ($DryRun) {
        Write-Host "[DRY] Crear: logs/api/" -ForegroundColor Cyan
        Write-Host "[DRY] Crear: logs/servers/" -ForegroundColor Cyan
        Write-Host "[DRY] Crear: logs/builds/" -ForegroundColor Cyan
    } else {
        New-Item -ItemType Directory -Path "logs/api" -Force | Out-Null
        New-Item -ItemType Directory -Path "logs/servers" -Force | Out-Null
        New-Item -ItemType Directory -Path "logs/builds" -Force | Out-Null
        Write-Host "Estructura de logs creada" -ForegroundColor Green
    }
    
    Write-Host "`n=== REORGANIZACION COMPLETADA ===" -ForegroundColor Green
    Write-Host "Nueva estructura:" -ForegroundColor Cyan
    Write-Host "  api/      - Backend, API, dashboard" -ForegroundColor White
    Write-Host "  build/    - Scripts de compilacion Unreal" -ForegroundColor White
    Write-Host "  servers/  - Gestion servidores dedicados" -ForegroundColor White
    Write-Host "  sql/      - Scripts base de datos" -ForegroundColor White
    Write-Host "  test/     - Pruebas organizadas" -ForegroundColor White
    Write-Host "  docs/     - Documentacion" -ForegroundColor White
    Write-Host "  logs/     - Logs por modulo" -ForegroundColor White
    
} catch {
    Write-Host "Error durante la reorganizacion: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

if ($DryRun) {
    Write-Host "`nPara ejecutar los cambios reales:" -ForegroundColor Yellow
    Write-Host "  ./reorganize_simple.ps1" -ForegroundColor White
}