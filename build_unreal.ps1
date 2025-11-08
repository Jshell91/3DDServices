param(
    [Parameter(Mandatory = $true, HelpMessage = "Ruta al .uproject")] [string] $ProjectPath,
    [Parameter(Mandatory = $false, HelpMessage = "Ruta a la carpeta de Unreal Engine (por ejemplo: C:\\Program Files\\Epic Games\\UE_5.5)")] [string] $UEPath,
    [ValidateSet("Development","Shipping")] [string] $Configuration = "Shipping",
    [string] $ArchiveDir,
    [switch] $Cook,
    [switch] $Pak,
    [switch] $Stage,
    [switch] $AllMaps,
    [string[]] $Maps,
    [switch] $SkipWinClient,
    [switch] $SkipWinServer,
    [switch] $SkipLinuxServer,
    [string] $WinClientTarget,
    [string] $WinServerTarget,
    [string] $LinuxServerTarget,
    [string] $UnrealExe,
    [string[]] $ExtraUATArgs,
    [switch] $Prereqs,
    [switch] $DryRun,
    [Alias('NoTips')] [switch] $Quiet,
    [Alias('Open')] [switch] $OpenOnFinish,
    [Alias('Sound')] [switch] $SoundOnFinish
    , [Alias('Zip')] [switch] $ZipOnFinish
)

# ================================
# Build Unreal (Windows) - Client/Server/Server(Linux)
# Requisitos:
#   - Windows PowerShell 5+ o PowerShell 7
#   - Unreal Engine instalado localmente
#   - Para LinuxServer en Windows: toolchain de cross-compile instalada (UE Extras SDKs) o construir desde Linux
# ================================

$ErrorActionPreference = 'Stop'

function Write-Section($title) {
    Write-Host "`n=== $title ===" -ForegroundColor Cyan
}

function Format-Duration {
    param([TimeSpan]$ts)
    $secs = [math]::Round($ts.TotalSeconds)
    $t = [TimeSpan]::FromSeconds($secs)
    if ($t.TotalHours -ge 1) { return ('{0:hh\:mm\:ss}' -f $t) }
    else { return ('{0:mm\:ss}' -f $t) }
}

function Format-Bytes {
    param([long]$bytes)
    if ($bytes -ge 1GB) { return ('{0:N2} GB' -f ($bytes / 1GB)) }
    elseif ($bytes -ge 1MB) { return ('{0:N2} MB' -f ($bytes / 1MB)) }
    elseif ($bytes -ge 1KB) { return ('{0:N2} KB' -f ($bytes / 1KB)) }
    else { return ("{0} B" -f $bytes) }
}

function Invoke-CompletionSound {
    param([bool]$Success)
    try {
        Add-Type -AssemblyName System -ErrorAction SilentlyContinue | Out-Null
        if ($Success) { [System.Media.SystemSounds]::Asterisk.Play() }
        else { [System.Media.SystemSounds]::Hand.Play() }
    }
    catch {
        try {
            if ($Success) { [console]::beep(880, 200); [console]::beep(988, 200) }
            else { [console]::beep(220, 300); [console]::beep(196, 300) }
        } catch { }
    }
}

function Invoke-TargetCompression {
    param(
        [Parameter(Mandatory=$true)][string]$SourceDir,
        [Parameter(Mandatory=$true)][string]$DestBasePath,
        [string]$SevenZipPath
    )

    if (-not (Test-Path -LiteralPath $SourceDir)) { return $null }
    
    # Siempre .zip usando utilidades nativas: preferimos 'tar' (bsdtar de Windows) y caemos a Compress-Archive
    $dest = "$DestBasePath.zip"
    if (Test-Path -LiteralPath $dest) { Remove-Item -LiteralPath $dest -Force -ErrorAction SilentlyContinue }
    Write-Host ("Zip: {0} -> {1}" -f $SourceDir, $dest) -ForegroundColor DarkGray
    
    $created = $false
    # 1) Intentar con tar.exe (nativo en Windows 10+); '-a' selecciona formato por extensión (.zip)
    $tarCmd = Get-Command tar -ErrorAction SilentlyContinue
    if ($tarCmd) {
        try {
            & tar -a -c -f "$dest" -C "$SourceDir" .
            if (Test-Path -LiteralPath $dest) { $created = $true }
        } catch {
            Write-Host ("tar falló, probando Compress-Archive: {0}" -f $_.Exception.Message) -ForegroundColor Yellow
        }
    }

    if (-not $created) {
        try {
            Compress-Archive -Path (Join-Path $SourceDir '*') -DestinationPath $dest -CompressionLevel Optimal -Force
            if (Test-Path -LiteralPath $dest) { $created = $true }
        } catch {
            $msg = $_.Exception.Message
            Write-Host ("Compress-Archive falló (Optimal): {0}" -f $msg) -ForegroundColor Yellow
            # Reintento con NoCompression para evitar errores de deflate tipo 'Sequence too long'
            try {
                Compress-Archive -Path (Join-Path $SourceDir '*') -DestinationPath $dest -CompressionLevel NoCompression -Force
                if (Test-Path -LiteralPath $dest) { $created = $true }
            } catch {
                Write-Host ("Compress-Archive también falló (NoCompression): {0}" -f $_.Exception.Message) -ForegroundColor Yellow
            }
        }
    }

    if ($created) { return $dest }
    return $null
}

function Resolve-UEPath {
    param([string]$UEPathParam)
    if ($UEPathParam) { return $UEPathParam }

    if ($env:UE_PATH -and (Test-Path $env:UE_PATH)) { return $env:UE_PATH }
    if ($env:UE5_ROOT -and (Test-Path $env:UE5_ROOT)) { return $env:UE5_ROOT }

    $defaultRoot = "C:\\Program Files\\Epic Games"
    if (Test-Path $defaultRoot) {
        $candidates = Get-ChildItem $defaultRoot -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^UE_' } | Sort-Object Name -Descending
        if ($candidates) { return $candidates[0].FullName }
    }

    throw "No se pudo resolver la ruta a Unreal Engine. Pasa -UEPath o define UE_PATH/UE5_ROOT."
}

function Get-ProjectName {
    param([string]$uproject)
    $name = [IO.Path]::GetFileNameWithoutExtension($uproject)
    if (-not $name) { throw "No se pudo detectar el nombre del proyecto a partir de: $uproject" }
    return $name
}

function Set-DefaultBuildOptions {
    # Activar por defecto Cook/Pak/Stage/AllMaps si no se pasan explicitamente
    if (-not $PSBoundParameters.ContainsKey('Cook')) { $script:Cook = $true }
    if (-not $PSBoundParameters.ContainsKey('Pak')) { $script:Pak = $true }
    if (-not $PSBoundParameters.ContainsKey('Stage')) { $script:Stage = $true }
    if (-not $PSBoundParameters.ContainsKey('AllMaps') -and -not $PSBoundParameters.ContainsKey('Maps')) { $script:AllMaps = $true }

    # Directorio de salida por defecto
    if (-not $ArchiveDir) {
        $script:ArchiveDir = Join-Path (Get-Location) 'OutBuild'
    }
}

function Assert-Tools {
    param([string]$RunUAT)
    if (-not (Test-Path $RunUAT)) {
        throw "No se encontró RunUAT.bat en: $RunUAT"
    }
}

function Test-LinuxToolchain {
    param([string]$UERoot)
    $sdkPath = Join-Path $UERoot 'Engine\\Extras\\ThirdPartyNotUE\\SDKs\\HostWin64\\Linux'
    if (-not (Test-Path $sdkPath)) {
        Write-Warning "SDK de Linux no detectado en: $sdkPath. El build LinuxServer podría fallar si no tienes el toolchain instalado."
    }
}
function Invoke-UATBuild {
    param(
        [string] $RunUAT,
        [hashtable] $BuildSpec,
        [string] $LogDir
    )

    $argsList = @('BuildCookRun', '-utf8output', "-project=`"$($BuildSpec.Project)`"")

    if ($BuildSpec.Client) { $argsList += '-client' }
    if ($BuildSpec.Server) { $argsList += '-server' }

    # targetplatform vs platform: UAT acepta ambos, preferimos -targetplatform
    $argsList += "-targetplatform=$($BuildSpec.Platform)"

 

    # target explícito (p.e. MyGame o MyGameServer)
    if ($BuildSpec.Target) { $argsList += "-target=`"$($BuildSpec.Target)`"" }
    if ($UnrealExe) { $argsList += "-unrealexe=`"$UnrealExe`"" }

    $argsList += "-configuration=$Configuration"

    if ($Cook) { $argsList += '-cook' }
    if ($Pak) { $argsList += '-pak' }
    if ($Stage) { $argsList += '-stage' }

    if ($AllMaps) { $argsList += '-allmaps' }
    elseif ($Maps -and $Maps.Count -gt 0) { $argsList += "-map=`"$([string]::Join('+', $Maps))`"" }

    $argsList += '-archive'
    $argsList += "-archivedirectory=`"$($BuildSpec.OutputDir)`""
    $argsList += '-build'
    if ($Prereqs) { $argsList += '-prereqs' }

    if ($ExtraUATArgs) { $argsList += $ExtraUATArgs }

    $logName = "build-$(Get-Date -Format 'yyyyMMdd-HHmmss')-$($BuildSpec.Name).log"
    $logPath = Join-Path $LogDir $logName

    Write-Host "UAT: $RunUAT" -ForegroundColor Yellow
    Write-Host "Args: $($argsList -join ' ')" -ForegroundColor DarkGray
    Write-Host "Log:  $logPath" -ForegroundColor DarkGray

    if ($DryRun) { return }

    $null = New-Item -ItemType Directory -Path $LogDir -Force -ErrorAction SilentlyContinue
    $processInfo = New-Object System.Diagnostics.ProcessStartInfo
    $processInfo.FileName = $RunUAT
    $processInfo.Arguments = ($argsList -join ' ')
    $processInfo.WorkingDirectory = Split-Path -Parent $RunUAT
    $processInfo.RedirectStandardOutput = $true
    $processInfo.RedirectStandardError = $true
    $processInfo.UseShellExecute = $false

    $proc = New-Object System.Diagnostics.Process
    $proc.StartInfo = $processInfo

    $outStream = New-Object System.IO.StreamWriter($logPath, $true)
    try {
        $proc.Start() | Out-Null
        while (-not $proc.HasExited) {
            $out = $proc.StandardOutput.ReadLine()
            if ($null -ne $out) { $outStream.WriteLine($out); Write-Host $out }
            Start-Sleep -Milliseconds 50
        }
        # Dump remaining
        while (-not $proc.StandardOutput.EndOfStream) {
            $ln = $proc.StandardOutput.ReadLine(); $outStream.WriteLine($ln); Write-Host $ln
        }
        while (-not $proc.StandardError.EndOfStream) {
            $ln = $proc.StandardError.ReadLine(); $outStream.WriteLine($ln); Write-Host $ln -ForegroundColor Red
        }
    }
    finally {
        $outStream.Dispose()
    }

    if ($proc.ExitCode -ne 0) {
        throw "Fallo UAT ($($BuildSpec.Name)) con código $($proc.ExitCode). Revisa el log: $logPath"
    }
}

# ===== Inicio =====
Write-Section "Configuracion"
if (-not (Test-Path $ProjectPath)) {
    if ($DryRun) {
        Write-Warning "Proyecto no encontrado (DryRun): $ProjectPath"
        # No resolvemos ruta; usamos el nombre deducido
        $ProjectName = Get-ProjectName -uproject $ProjectPath
    } else {
        throw "No existe el proyecto: $ProjectPath"
    }
} else {
    $ProjectPath = (Resolve-Path $ProjectPath).Path
    $ProjectName = Get-ProjectName -uproject $ProjectPath
}
$UERoot = Resolve-UEPath -UEPathParam $UEPath
$RunUAT = Join-Path $UERoot 'Engine\\Build\\BatchFiles\\RunUAT.bat'

Set-DefaultBuildOptions
if (-not $DryRun) {
    Assert-Tools -RunUAT $RunUAT
} else {
    # En DryRun, no exigimos la existencia de RunUAT.bat, solo informamos
    if (-not (Test-Path $RunUAT)) {
        Write-Warning "RunUAT no encontrado (DryRun): $RunUAT"
    }
}
Test-LinuxToolchain -UERoot $UERoot

if (-not $ArchiveDir) { $ArchiveDir = Join-Path (Get-Location) 'OutBuild' }
$OutWinClient = Join-Path $ArchiveDir 'WindowsClient'
$OutWinServer = Join-Path $ArchiveDir 'WindowsServer'
$OutLinuxSrv  = Join-Path $ArchiveDir 'LinuxServer'
$LogsDir      = Join-Path $ArchiveDir 'logs'

# Detección de targets (para proyectos Blueprint-only no hay .Target.cs)
$projectDir = Split-Path -Parent $ProjectPath
$sourceDir = Join-Path $projectDir 'Source'
$hasGameTarget = Test-Path -LiteralPath (Join-Path $sourceDir ("$ProjectName.Target.cs"))
$hasServerTarget = Test-Path -LiteralPath (Join-Path $sourceDir ("${ProjectName}Server.Target.cs"))

# Si no hay Server target y no se ha especificado explícitamente un target de server, saltamos servers
if (-not $hasServerTarget -and -not $WinServerTarget -and -not $LinuxServerTarget) {
    if (-not $SkipWinServer) { Write-Warning "No se encontró ${ProjectName}Server.Target.cs. Omitiendo Windows Server (añade un Server Target.cs o usa -WinServerTarget)." }
    if (-not $SkipLinuxServer) { Write-Warning "No se encontró ${ProjectName}Server.Target.cs. Omitiendo Linux Server (añade un Server Target.cs o usa -LinuxServerTarget)." }
    $SkipWinServer = $true
    $SkipLinuxServer = $true
}

# Validar la ruta de ArchiveDir: si el padre es un archivo, redirigir en DryRun o fallar en ejecución real
$archiveParent = Split-Path -Parent $ArchiveDir
if ($archiveParent) {
    if (Test-Path -LiteralPath $archiveParent) {
        $parentItem = Get-Item -LiteralPath $archiveParent -ErrorAction SilentlyContinue
        if ($parentItem -and -not $parentItem.PSIsContainer) {
            if ($DryRun) {
                Write-Warning "El padre de ArchiveDir existe y es un archivo: $archiveParent (DryRun). Usando '.\\OutBuild' como alternativa."
                $ArchiveDir = Join-Path (Get-Location) 'OutBuild'
                $OutWinClient = Join-Path $ArchiveDir 'WindowsClient'
                $OutWinServer = Join-Path $ArchiveDir 'WindowsServer'
                $OutLinuxSrv  = Join-Path $ArchiveDir 'LinuxServer'
                $LogsDir      = Join-Path $ArchiveDir 'logs'
            } else {
                throw "El padre de ArchiveDir existe y es un archivo: $archiveParent. Elige otra ruta para -ArchiveDir."
            }
        }
    }
}

# Asegurar carpeta de salida y logs (también en DryRun)
[void][System.IO.Directory]::CreateDirectory($ArchiveDir)
[void][System.IO.Directory]::CreateDirectory($LogsDir)

Write-Host "Proyecto:      $ProjectName" -ForegroundColor Green
Write-Host "UE Root:       $UERoot" -ForegroundColor Green
Write-Host "RunUAT:        $RunUAT" -ForegroundColor Green
Write-Host "Config:        $Configuration" -ForegroundColor Green
Write-Host "Cook/Pak/Stage: $Cook/$Pak/$Stage" -ForegroundColor Green
${mapsList} = if ($Maps -and $Maps.Count -gt 0) { ($Maps -join ',') } else { '' }
Write-Host "AllMaps/Maps:  $AllMaps/$mapsList" -ForegroundColor Green
Write-Host "Archive dir:   $ArchiveDir" -ForegroundColor Green
Write-Host "DryRun:        $DryRun" -ForegroundColor Green

# Matriz de builds
$builds = @()
if (-not $SkipWinClient) {
    # Solo establecemos -target si el usuario lo proporciona; si no, UAT lo infiere del .uproject
    $target = if ($WinClientTarget) { $WinClientTarget } else { $null }
    $builds += @{ Name = 'Win64-Client'; Client = $true; Server = $false; Platform = 'Win64'; Target = $target; OutputDir = $OutWinClient; Project = $ProjectPath }
}
if (-not $SkipWinServer) {
    $target = if ($WinServerTarget) { $WinServerTarget } else { $null }
    $builds += @{ Name = 'Win64-Server'; Client = $false; Server = $true; Platform = 'Win64'; Target = $target; OutputDir = $OutWinServer; Project = $ProjectPath }
}
if (-not $SkipLinuxServer) {
    $target = if ($LinuxServerTarget) { $LinuxServerTarget } else { $null }
    $builds += @{ Name = 'Linux-Server'; Client = $false; Server = $true; Platform = 'Linux'; Target = $target; OutputDir = $OutLinuxSrv; Project = $ProjectPath }
}

Write-Section "Ejecucion"
$global:failed = $false
 $timings = @()
foreach ($b in $builds) {
    Write-Section "Build: $($b.Name) -> $($b.OutputDir)"
    $start = Get-Date
    $success = $false
    try {
        Invoke-UATBuild -RunUAT $RunUAT -BuildSpec $b -LogDir $LogsDir
        $success = $true
        Write-Host "OK Completado: $($b.Name)" -ForegroundColor Green
    }
    catch {
        Write-Host "FAIL: $($b.Name)" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        $global:failed = $true
    }
    $elapsed = (Get-Date) - $start
    $sizeBytes = 0
    if (Test-Path -LiteralPath $b.OutputDir) {
        $sizeBytes = (Get-ChildItem -LiteralPath $b.OutputDir -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        if ($null -eq $sizeBytes) { $sizeBytes = 0 }
    }
    $sizeHuman = Format-Bytes ([long]$sizeBytes)
    $timings += [pscustomobject]@{
        Name = $b.Name
        Success = $success
        Duration = $elapsed
        DurationSeconds = [math]::Round($elapsed.TotalSeconds)
        OutputDir = $b.OutputDir
        SizeBytes = [long]$sizeBytes
        SizeHuman = $sizeHuman
    }
}

 # No salgas todavía: primero generamos informes/JSON y al final devolvemos código de salida si toca
 $exitCode = 0
 if ($global:failed) {
     Write-Host "`nAlgunas builds fallaron." -ForegroundColor Yellow
     $exitCode = 1
 } else {
     Write-Host "`nTodas las builds completadas correctamente." -ForegroundColor Green
 }

# Calcular totales para informe y JSON
$totalSec = ($timings | Measure-Object -Property DurationSeconds -Sum).Sum
if (-not $totalSec) { $totalSec = 0 }
${totalSizeBytes} = ($timings | Measure-Object -Property SizeBytes -Sum).Sum
if (-not ${totalSizeBytes}) { ${totalSizeBytes} = 0 }

Write-Section "Salidas"
Write-Host "Windows Client: $OutWinClient"
Write-Host "Windows Server: $OutWinServer"
Write-Host "Linux Server:   $OutLinuxSrv"

if (-not $Quiet) {
    Write-Host "`nSugerencias de uso:" -ForegroundColor Cyan
    Write-Host "  # Ejemplo básico (Shipping, cook/pak/stage, todas las maps)"
    Write-Host "  ./build_unreal.ps1 -ProjectPath 'D:\\Proyectos\\MiJuego\\MiJuego.uproject' -UEPath 'C:\\Program Files\\Epic Games\\UE_5.5' -ArchiveDir 'E:\\Builds'"
    Write-Host "  # Solo Windows Client y Server, sin Linux"
    Write-Host "  ./build_unreal.ps1 -ProjectPath '...\\MiJuego.uproject' -SkipLinuxServer"
    Write-Host "  # Especificar maps concretas"
    Write-Host "  ./build_unreal.ps1 -ProjectPath '...\\MiJuego.uproject' -AllMaps:\$false -Maps Map1,Map2,Map3"
    Write-Host "  # Empaquetar prerequisites (VC++ redists en Windows)"
    Write-Host "  ./build_unreal.ps1 -ProjectPath '...\\MiJuego.uproject' -Prereqs"
    Write-Host "  # Dry run (solo muestra los comandos)"
    Write-Host "  ./build_unreal.ps1 -ProjectPath '...\\MiJuego.uproject' -DryRun"
    Write-Host "  # Ocultar sugerencias (modo CI)"
    Write-Host "  ./build_unreal.ps1 -ProjectPath '...\\MiJuego.uproject' -Quiet"
    Write-Host "  # Abrir carpeta destino al finalizar"
    Write-Host "  ./build_unreal.ps1 -ProjectPath '...\\MiJuego.uproject' -OpenOnFinish"
    Write-Host "  # Reproducir sonido al finalizar"
    Write-Host "  ./build_unreal.ps1 -ProjectPath '...\\MiJuego.uproject' -SoundOnFinish"
    Write-Host "  # Comprimir cada target a .zip (nativo, sin herramientas externas)"
    Write-Host "  ./build_unreal.ps1 -ProjectPath '...\\MiJuego.uproject' -ZipOnFinish"
}

# ===== Informe de tiempos (movido detrás de Sugerencias) =====
Write-Section "Informe de tiempos"
foreach ($t in $timings) {
    $status = if ($t.Success) { 'OK' } else { 'FAIL' }
    $dur = Format-Duration $t.Duration
    Write-Host ("{0,-14} {1,8}  {2,-4}  {3,10}" -f $t.Name, $dur, $status, $t.SizeHuman)
}
$totalSec = ($timings | Measure-Object -Property DurationSeconds -Sum).Sum
if (-not $totalSec) { $totalSec = 0 }
$total = [TimeSpan]::FromSeconds($totalSec)
Write-Host ("Total:         {0,8}" -f (Format-Duration $total)) -ForegroundColor Cyan
${totalSizeBytes} = ($timings | Measure-Object -Property SizeBytes -Sum).Sum
if (-not ${totalSizeBytes}) { ${totalSizeBytes} = 0 }
Write-Host ("Total size:    {0,8}" -f (Format-Bytes ([long]${totalSizeBytes}))) -ForegroundColor Cyan

# Comprimir salidas si se solicita (antes de abrir carpeta)
if ($ZipOnFinish -and -not $DryRun) {
    try {
        Write-Host ("Compresión: usando formato ZIP nativo (Compress-Archive)") -ForegroundColor Cyan
        $created = @()
        $script:compStats = @()
        $map = @{
            'WindowsClient' = $OutWinClient
            'WindowsServer' = $OutWinServer
            'LinuxServer'   = $OutLinuxSrv
        }
        foreach ($k in $map.Keys) {
            $src = $map[$k]
            if (Test-Path -LiteralPath $src) {
                $destBase = Join-Path $ArchiveDir $k
                $srcBytes = (Get-ChildItem -LiteralPath $src -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
                if ($null -eq $srcBytes) { $srcBytes = 0 }
                $zipStart = Get-Date
                $archive = Invoke-TargetCompression -SourceDir $src -DestBasePath $destBase -SevenZipPath $null
                $zipElapsed = (Get-Date) - $zipStart
                $zipBytes = if ($archive -and (Test-Path -LiteralPath $archive)) { (Get-Item -LiteralPath $archive).Length } else { 0 }
                if ($archive) { $created += $archive }

                $script:compStats += [pscustomobject]@{
                    Name = $k
                    ZipPath = $archive
                    Duration = $zipElapsed
                    DurationSeconds = [math]::Round($zipElapsed.TotalSeconds)
                    SourceSizeBytes = [long]$srcBytes
                    SourceSizeHuman = (Format-Bytes ([long]$srcBytes))
                    ZipSizeBytes = [long]$zipBytes
                    ZipSizeHuman = (Format-Bytes ([long]$zipBytes))
                    RatioPercent = if ($srcBytes -gt 0) { [math]::Round(($zipBytes / [double]$srcBytes) * 100, 2) } else { 0 }
                }
            }
        }
        if ($created.Count -gt 0) {
            Write-Host ("Creados: {0}" -f ($created -join ', '))
        } else {
            Write-Host "No se creó ningún archivo (no se encontraron carpetas de salida)." -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host ("Compresión fallida: {0}" -f $_.Exception.Message) -ForegroundColor Yellow
    }
}

# Informe de compresión (si procede)
if ($ZipOnFinish -and $compStats -and $compStats.Count -gt 0) {
    Write-Section "Informe de compresión"
    foreach ($c in $compStats) {
        Write-Host ("{0,-14} {1,8}  ZIP {2,10}  SRC {3,10}  {4,6}%" -f $c.Name, (Format-Duration $c.Duration), $c.ZipSizeHuman, $c.SourceSizeHuman, $c.RatioPercent)
    }
    $zipTotalSec = ($compStats | Measure-Object -Property DurationSeconds -Sum).Sum
    if (-not $zipTotalSec) { $zipTotalSec = 0 }
    $zipTotal = [TimeSpan]::FromSeconds($zipTotalSec)
    $zipBytesTotal = ($compStats | Measure-Object -Property ZipSizeBytes -Sum).Sum
    if (-not $zipBytesTotal) { $zipBytesTotal = 0 }
    Write-Host ("Total comp.:   {0,8}" -f (Format-Duration $zipTotal)) -ForegroundColor Cyan
    Write-Host ("Zip total:     {0,8}" -f (Format-Bytes ([long]$zipBytesTotal))) -ForegroundColor Cyan
}

# Abrir carpeta destino (Explorer) si se solicita
if ($OpenOnFinish -and -not $DryRun) {
    try {
        # Abrir la carpeta que contiene las 3 builds (ArchiveDir)
        $openPath = $ArchiveDir
        if (-not (Test-Path -LiteralPath $openPath)) {
            $null = New-Item -ItemType Directory -Path $openPath -Force -ErrorAction SilentlyContinue
        }
        Write-Host ("Abriendo carpeta: {0}" -f $openPath)
        Start-Process explorer.exe -ArgumentList @("`"$openPath`"") | Out-Null
    }
    catch {
        Write-Host ("No se pudo abrir el Explorador: {0}" -f $_.Exception.Message) -ForegroundColor Yellow
    }
}

# Reproducir sonido al finalizar si se solicita (también en DryRun)
if ($SoundOnFinish) {
    Invoke-CompletionSound -Success (-not $global:failed)
}

# Construir y guardar resumen JSON (incluye compresión si existe) y mostrarlo al final
$latestFile = Join-Path $LogsDir 'build_summary-latest.json'
$summaryFile = Join-Path $LogsDir 'build_summary.jsonl'

$compStats = if ($compStats) { $compStats } else { @() }

$summaryObj = [pscustomobject]@{
    Timestamp = (Get-Date).ToString('o')
    Project   = $ProjectName
    Configuration = $Configuration
    ArchiveDir = $ArchiveDir
    UERoot    = $UERoot
    DryRun    = [bool]$DryRun
    Success   = -not $global:failed
    TotalSeconds = $totalSec
    TotalSizeBytes = [long]${totalSizeBytes}
    TotalSizeHuman = (Format-Bytes ([long]${totalSizeBytes}))
    Results = @(
        foreach ($t in $timings) {
            [pscustomobject]@{
                Name = $t.Name
                Success = $t.Success
                DurationSeconds = $t.DurationSeconds
                OutputDir = $t.OutputDir
                SizeBytes = [long]$t.SizeBytes
                SizeHuman = $t.SizeHuman
            }
        }
    )
    Compression = @(
        foreach ($c in $compStats) {
            [pscustomobject]@{
                Name = $c.Name
                ZipPath = $c.ZipPath
                DurationSeconds = $c.DurationSeconds
                SourceSizeBytes = [long]$c.SourceSizeBytes
                SourceSizeHuman = $c.SourceSizeHuman
                ZipSizeBytes = [long]$c.ZipSizeBytes
                ZipSizeHuman = $c.ZipSizeHuman
                RatioPercent = $c.RatioPercent
            }
        }
    )
}

[void][System.IO.Directory]::CreateDirectory($LogsDir)
($summaryObj | ConvertTo-Json -Depth 6 -Compress) | Add-Content -Path $summaryFile -Encoding utf8
$summaryObj | ConvertTo-Json -Depth 6 | Set-Content -Path $latestFile -Encoding utf8

Write-Section "Resumen JSON"
Write-Host "Resumen (JSONL):  $summaryFile"
Write-Host "Resumen (latest): $latestFile"

$finalStatus = if ($global:failed) { 'FAIL' } else { 'OK' }
$finalTotal = [TimeSpan]::FromSeconds($totalSec)
Write-Host ("Estado: {0} | Total: {1} | JSON: {2}" -f $finalStatus, (Format-Duration $finalTotal), $latestFile)

# Salir con el código acumulado (0 si todo OK, 1 si alguna build falló)
if (-not $DryRun) { exit $exitCode }
