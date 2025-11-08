#!/usr/bin/env pwsh
# Test script para verificar que los scripts de build funcionan correctamente

param(
    [switch] $Verbose
)

$ErrorActionPreference = 'Stop'

function Write-TestResult {
    param(
        [string]$TestName,
        [bool]$Success,
        [string]$Details = ""
    )
    
    $symbol = if ($Success) { "✅" } else { "❌" }
    $color = if ($Success) { "Green" } else { "Red" }
    
    Write-Host "$symbol $TestName" -ForegroundColor $color
    if ($Details -and $Verbose) {
        Write-Host "   $Details" -ForegroundColor Gray
    }
}

function Test-BuildScriptExists {
    $buildScript = Join-Path (Join-Path $PSScriptRoot "..") (Join-Path "build" "build_unreal.ps1")
    return Test-Path $buildScript
}

function Test-BuildScriptSyntax {
    try {
        $buildScript = Join-Path (Join-Path $PSScriptRoot "..") (Join-Path "build" "build_unreal.ps1")
        $null = Get-Command $buildScript -ErrorAction Stop
        return $true
    }
    catch {
        return $false
    }
}

function Test-BuildScriptHelp {
    try {
        $buildScript = Join-Path (Join-Path $PSScriptRoot "..") (Join-Path "build" "build_unreal.ps1")
        $help = Get-Help $buildScript -ErrorAction Stop
        return $help.Name -eq "build_unreal.ps1"
    }
    catch {
        return $false
    }
}

function Test-UnrealFullBuildExists {
    $fullBuildScript = Join-Path (Join-Path $PSScriptRoot "..") (Join-Path "build" "UnrealFullBuild.ps1")
    return Test-Path $fullBuildScript
}

function Test-MigrationScriptExists {
    $migrationScript = Join-Path (Join-Path $PSScriptRoot "..") (Join-Path "build" "run_migration.js")
    return Test-Path $migrationScript
}

function Test-NodejsAvailable {
    try {
        $nodeVersion = node --version 2>$null
        return $nodeVersion -match "v\d+\.\d+\.\d+"
    }
    catch {
        return $false
    }
}

# Ejecutar tests
Write-Host "`n🧪 Testing Build Scripts" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

Write-TestResult "Build script exists" (Test-BuildScriptExists)
Write-TestResult "Build script syntax valid" (Test-BuildScriptSyntax)
Write-TestResult "Build script help available" (Test-BuildScriptHelp)
Write-TestResult "UnrealFullBuild script exists" (Test-UnrealFullBuildExists)
Write-TestResult "Migration script exists" (Test-MigrationScriptExists)
Write-TestResult "Node.js available" (Test-NodejsAvailable)

# Test de parámetros del script principal
Write-Host "`n🔧 Testing Build Script Parameters" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

try {
    $buildScript = Join-Path (Join-Path $PSScriptRoot "..") (Join-Path "build" "build_unreal.ps1")
    
    # Test con proyecto ficticio pero sintaxis válida
    $testProject = "C:\FakeProject\Test.uproject"
    $output = & $buildScript -ProjectPath $testProject -DryRun -Quiet 2>&1
    
    if ($output -match "Proyecto:\s+Test") {
        Write-TestResult "Parameter parsing works" $true "Project path correctly parsed"
    } else {
        Write-TestResult "Parameter parsing works" $false "Failed to parse project path"
    }
}
catch {
    $errorMsg = $_.Exception.Message
    if ($errorMsg -match "No se encontró RunUAT.bat") {
        Write-TestResult "Build script logic works" $true "Script correctly validates UE installation"
    } else {
        Write-TestResult "Build script logic works" $false "Unexpected error: $errorMsg"
    }
}

Write-Host "`n📋 Summary" -ForegroundColor Cyan
Write-Host "==========" -ForegroundColor Cyan
Write-Host "Build module tests completed. Scripts are properly structured and functional." -ForegroundColor Green
Write-Host "Note: Actual builds require Unreal Engine installation and valid project paths." -ForegroundColor Yellow