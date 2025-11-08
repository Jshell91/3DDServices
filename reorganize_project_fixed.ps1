# Script para reorganizar el proyecto 3DDServices
# Organiza archivos en carpetas lógicas por función

param(
    [switch]$DryRun,
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

Write-Host "🏗️  Reorganizando proyecto 3DDServices..." -ForegroundColor Cyan
Write-Host "📁 Estructura: api/ + build/ + servers/ + sql/ + test/ + docs/" -ForegroundColor Green

if ($DryRun) {
    Write-Host "⚠️  MODO DRY-RUN: Solo mostrando cambios, no ejecutando" -ForegroundColor Yellow
}

# Función para mover archivos con confirmación
function Move-FileWithConfirm {
    param([string]$Source, [string]$Destination)
    
    if (-not (Test-Path $Source)) {
        Write-Host "⏭️  Saltando: $Source (no existe)" -ForegroundColor DarkGray
        return
    }
    
    $destDir = Split-Path $Destination -Parent
    if (-not (Test-Path $destDir)) {
        if ($DryRun) {
            Write-Host "📁 [DRY] Crear directorio: $destDir" -ForegroundColor Cyan
        } else {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
            Write-Host "📁 Directorio creado: $destDir" -ForegroundColor Green
        }
    }
    
    if ($DryRun) {
        Write-Host "📄 [DRY] Mover: $Source → $Destination" -ForegroundColor Cyan
    } else {
        Move-Item -Path $Source -Destination $Destination -Force
        Write-Host "📄 Movido: $Source → $Destination" -ForegroundColor Green
    }
}

try {
    Write-Host "`n🗄️  === MÓDULO API (3DD Services) ===" -ForegroundColor Yellow
    
    # API core files
    Move-FileWithConfirm "index.js" "api/index.js"
    Move-FileWithConfirm "postgreService.js" "api/postgreService.js"
    Move-FileWithConfirm "odinService.js" "api/odinService.js"
    Move-FileWithConfirm "config.js" "api/config.js"
    Move-FileWithConfirm "package.json" "api/package.json"
    Move-FileWithConfirm "nodemon.json" "api/nodemon.json"
    Move-FileWithConfirm "ecosystem.config.js" "api/ecosystem.config.js"
    Move-FileWithConfirm "server-standalone.js" "api/server-standalone.js"
    Move-FileWithConfirm "package-standalone.json" "api/package-standalone.json"
    
    # Public folder (dashboard)
    if (Test-Path "public") {
        Move-FileWithConfirm "public" "api/public"
    }
    
    Write-Host "`n🔨 === MÓDULO BUILD (Scripts de Compilación) ===" -ForegroundColor Yellow
    
    # Build scripts
    Move-FileWithConfirm "build_unreal.ps1" "build/build_unreal.ps1"
    Move-FileWithConfirm "UnrealFullBuild.ps1" "build/UnrealFullBuild.ps1"
    Move-FileWithConfirm "UnrealFullBuild" "build/UnrealFullBuild"
    Move-FileWithConfirm "run_migration.js" "build/run_migration.js"
    
    Write-Host "`n🎮 === MÓDULO SERVERS (Gestión de Servidores) ===" -ForegroundColor Yellow
    
    # Server management scripts
    Move-FileWithConfirm "manage_unreal_servers.sh" "servers/manage_unreal_servers.sh"
    Move-FileWithConfirm "unreal_healthcheck.sh" "servers/unreal_healthcheck.sh"
    Move-FileWithConfirm "start_all_servers.sh" "servers/start_all_servers.sh"
    Move-FileWithConfirm "start-production.sh" "servers/start-production.sh"
    Move-FileWithConfirm "start-production.ps1" "servers/start-production.ps1"
    Move-FileWithConfirm "run_server.ps1" "servers/run_server.ps1"
    Move-FileWithConfirm "diagnose.sh" "servers/diagnose.sh"
    Move-FileWithConfirm "diagnose.ps1" "servers/diagnose.ps1"
    
    Write-Host "`n📊 === MÓDULO SQL (Base de Datos) ===" -ForegroundColor Yellow
    
    # SQL organization
    if (Test-Path "sql") {
        # Schema files
        Move-FileWithConfirm "sql/maps_table.sql" "sql/schema/maps_table.sql"
        Move-FileWithConfirm "sql/alter_maps_add_max_players.sql" "sql/schema/alter_maps_add_max_players.sql"
        
        # Migration files  
        Move-FileWithConfirm "sql/migration_display_order.sql" "sql/migrations/migration_display_order.sql"
        Move-FileWithConfirm "sql/add_display_order_column.sql" "sql/migrations/add_display_order_column.sql"
        Move-FileWithConfirm "sql/fix_display_order_trigger.sql" "sql/migrations/fix_display_order_trigger.sql"
        
        # Data files
        Move-FileWithConfirm "sql/insert_artwork_votes.sql" "sql/data/insert_artwork_votes.sql"
        Move-FileWithConfirm "sql/import_maps.sql" "sql/data/import_maps.sql"
        Move-FileWithConfirm "sql/MapPorts.json" "sql/data/MapPorts.json"
    }
    
    Write-Host "`n🧪 === MÓDULO TEST (Pruebas) ===" -ForegroundColor Yellow
    
    # Test reorganization
    if (Test-Path "test") {
        # API tests
        Move-FileWithConfirm "test/test_artwork_likes.http" "test/api/test_artwork_likes.http"
        Move-FileWithConfirm "test/test_map_code_exists.http" "test/api/test_map_code_exists.http"
        Move-FileWithConfirm "test/test_display_order.http" "test/api/test_display_order.http"
        Move-FileWithConfirm "test/quick_test.http" "test/api/quick_test.http"
        
        # Server tests
        Move-FileWithConfirm "test/test_maps.ps1" "test/servers/test_maps.ps1"
        Move-FileWithConfirm "test/test_odin.ps1" "test/servers/test_odin.ps1"
        Move-FileWithConfirm "test/test_online_maps.ps1" "test/servers/test_online_maps.ps1"
        
        # Manual tests
        Move-FileWithConfirm "test/MANUAL_TESTING_CHECKLIST.md" "test/manual/MANUAL_TESTING_CHECKLIST.md"
        Move-FileWithConfirm "test/start-production.sh" "test/manual/start-production.sh"
        Move-FileWithConfirm "test/start-production.ps1" "test/manual/start-production.ps1"
        
        # Scripts utilitarios
        Move-FileWithConfirm "test/insert_art_exhibitions_map.ps1" "test/utilities/insert_art_exhibitions_map.ps1"
        Move-FileWithConfirm "test/modify_artwork_likes.ps1" "test/utilities/modify_artwork_likes.ps1"
        Move-FileWithConfirm "test/test_artwork_likes.ps1" "test/utilities/test_artwork_likes.ps1"
        Move-FileWithConfirm "test/test_display_order.ps1" "test/utilities/test_display_order.ps1"
    }
    
    Write-Host "`n📝 === MÓDULO DOCS (Documentación) ===" -ForegroundColor Yellow
    
    # Documentation
    Move-FileWithConfirm "API_DOCUMENTATION.md" "docs/API_DOCUMENTATION.md"
    Move-FileWithConfirm "API_VERSION.md" "docs/API_VERSION.md"
    Move-FileWithConfirm "DEPLOY.md" "docs/DEPLOY.md"
    Move-FileWithConfirm "PROJECT_IDEAS.md" "docs/PROJECT_IDEAS.md"
    Move-FileWithConfirm "PM2_COMMANDS.md" "docs/PM2_COMMANDS.md"
    Move-FileWithConfirm "README.md" "docs/README.md"
    Move-FileWithConfirm "CHANGELOG.md" "docs/CHANGELOG.md"
    
    # SSH notes ya están en docs/
    
    Write-Host "`n📋 === CREAR ESTRUCTURA DE LOGS ===" -ForegroundColor Yellow
    
    # Create logs structure
    if ($DryRun) {
        Write-Host "📁 [DRY] Crear: logs/api/" -ForegroundColor Cyan
        Write-Host "📁 [DRY] Crear: logs/servers/" -ForegroundColor Cyan
        Write-Host "📁 [DRY] Crear: logs/builds/" -ForegroundColor Cyan
    } else {
        New-Item -ItemType Directory -Path "logs/api" -Force | Out-Null
        New-Item -ItemType Directory -Path "logs/servers" -Force | Out-Null
        New-Item -ItemType Directory -Path "logs/builds" -Force | Out-Null
        Write-Host "📁 Estructura de logs creada" -ForegroundColor Green
    }
    
    # Move existing logs if any
    if (Test-Path "logs" -PathType Container) {
        Get-ChildItem "logs" -Filter "*.log" -ErrorAction SilentlyContinue | ForEach-Object {
            if ($_.Name -match "(server|unreal)") {
                Move-FileWithConfirm $_.FullName "logs/servers/$($_.Name)"
            } elseif ($_.Name -match "(build|compile)") {
                Move-FileWithConfirm $_.FullName "logs/builds/$($_.Name)"
            } else {
                Move-FileWithConfirm $_.FullName "logs/api/$($_.Name)"
            }
        }
    }
    
    Write-Host "`n✅ === REORGANIZACIÓN COMPLETADA ===" -ForegroundColor Green
    Write-Host "📊 Nueva estructura:" -ForegroundColor Cyan
    Write-Host "   📁 api/      - Backend, API, dashboard" -ForegroundColor White
    Write-Host "   📁 build/    - Scripts de compilación Unreal" -ForegroundColor White
    Write-Host "   📁 servers/  - Gestión servidores dedicados" -ForegroundColor White
    Write-Host "   📁 sql/      - Scripts base de datos" -ForegroundColor White
    Write-Host "   📁 test/     - Pruebas organizadas" -ForegroundColor White
    Write-Host "   📁 docs/     - Documentación" -ForegroundColor White
    Write-Host "   📁 logs/     - Logs por módulo" -ForegroundColor White
    
    if (-not $DryRun) {
        Write-Host "`n🔄 Próximos pasos recomendados:" -ForegroundColor Yellow
        Write-Host "1. Actualizar scripts para usar nuevas rutas" -ForegroundColor White
        Write-Host "2. Verificar que todo funciona correctamente" -ForegroundColor White
        Write-Host "3. Actualizar documentación con nueva estructura" -ForegroundColor White
        Write-Host "4. Commit de los cambios" -ForegroundColor White
    }
    
} catch {
    Write-Host "❌ Error durante la reorganización: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

if ($DryRun) {
    Write-Host "`n💡 Para ejecutar los cambios reales, ejecuta sin -DryRun:" -ForegroundColor Yellow
    Write-Host "   ./reorganize_project_fixed.ps1" -ForegroundColor White
}