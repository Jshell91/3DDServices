param(
  [string] $UEPath = "E:\\UnrealEngineSC553\\UnrealEngine",
  [string] $ProjectPath = "E:\\p3DDSW_UE55\\p3DDSW_UE55.uproject",
  [string] $ArchiveDir = "E:\\p3DDSW_UE55\\OutPut",
  [ValidateSet("Development","Shipping")] [string] $Configuration = "Development",
  [switch] $VerifySdk,
  [switch] $DryRun,
  [Alias('ZipOnFinish')] [switch] $Zip,
  [Alias('SoundOnFinish')] [switch] $Sound,
  [switch] $ClientOnly,
  [switch] $SkipWinServer,
  [switch] $SkipLinuxServer
)

$ErrorActionPreference = 'Stop'

function Get-RunUAT([string]$UERoot) {
  return Join-Path $UERoot 'Engine\\Build\\BatchFiles\\RunUAT.bat'
}

Write-Host "UEPath:      $UEPath"
Write-Host "ProjectPath: $ProjectPath"
Write-Host "ArchiveDir:  $ArchiveDir"
Write-Host "Config:      $Configuration"
Write-Host "VerifySdk:   $VerifySdk"
Write-Host "DryRun:      $DryRun"
Write-Host "Zip:         $Zip"
Write-Host "Sound:       $Sound"
Write-Host "ClientOnly:  $ClientOnly"
Write-Host "SkipWinServer: $SkipWinServer"
Write-Host "SkipLinuxServer: $SkipLinuxServer"

# Paso opcional: VerifySdk (equivalente a tu Turnkey -command=VerifySdk)
if ($VerifySdk) {
  $uat = Get-RunUAT -UERoot $UEPath
  if (-not (Test-Path $uat)) { throw "No se encontró RunUAT.bat en $uat" }
  $verifyArgsLinux = @(
    '-ScriptsForProject', "$ProjectPath",
    'Turnkey', '-command=VerifySdk',
    '-platform=Linux', '-UpdateIfNeeded', '-EditorIO', '-EditorIOPort=63856'
  )
  Write-Host "→ Verificando SDKs con Turnkey..." -ForegroundColor Cyan
  if (-not $DryRun) {
    & cmd.exe /c "\"$uat\" $($verifyArgsLinux -join ' ')" | Write-Host
    $verifyArgsWin = @(
      '-ScriptsForProject', "$ProjectPath",
      'Turnkey', '-command=VerifySdk',
      '-platform=Win64', '-UpdateIfNeeded', '-EditorIO', '-EditorIOPort=63856'
    )
    & cmd.exe /c "\"$uat\" $($verifyArgsWin -join ' ')" | Write-Host
  }
}

# Flags extra que usas en tu fichero original
$extra = @('-nocompileeditor','-skipbuildeditor','-iostore','-compressed','-package')

# Construcción dinámica de argumentos para build_unreal.ps1
$cmd = @(
  '-ProjectPath', $ProjectPath,
  '-UEPath', $UEPath,
  '-ArchiveDir', $ArchiveDir,
  '-Configuration', $Configuration,
  '-UnrealExe', (Join-Path $UEPath 'Engine\\Binaries\\Win64\\UnrealEditor-Cmd.exe'),
  '-Prereqs',
  '-ExtraUATArgs', ($extra -join ' ')
)

# Decidir qué targets incluir
if ($ClientOnly) {
  # Solo cliente: saltar servidores
  $cmd += '-SkipWinServer'
  $cmd += '-SkipLinuxServer'
  $cmd += '-WinClientTarget'; $cmd += 'VR3DDSOCIALWORLDClient'
}
else {
  # Cliente siempre (a menos que se añada un SkipWinClient futuro)
  $cmd += '-WinClientTarget'; $cmd += 'VR3DDSOCIALWORLDClient'

  if ($SkipWinServer) {
    $cmd += '-SkipWinServer'
  } else {
    $cmd += '-WinServerTarget'; $cmd += 'VR3DDSOCIALWORLDServer'
  }
  if ($SkipLinuxServer) {
    $cmd += '-SkipLinuxServer'
  } else {
    $cmd += '-LinuxServerTarget'; $cmd += 'VR3DDSOCIALWORLDServer'
  }
}
if ($DryRun) { $cmd += "-DryRun" }
if ($Zip) { $cmd += "-ZipOnFinish" }
if ($Sound) { $cmd += "-SoundOnFinish" }

Write-Host "→ Ejecutando build_unreal.ps1 con tus opciones..." -ForegroundColor Cyan
$scriptPath = Join-Path $PSScriptRoot 'build_unreal.ps1'
if (-not (Test-Path $scriptPath)) { throw "No se encuentra build_unreal.ps1 en $PSScriptRoot" }

# Ejecuta las 3 builds (por defecto el script genera WinClient, WinServer y LinuxServer)
& powershell -ExecutionPolicy Bypass -File $scriptPath @cmd
