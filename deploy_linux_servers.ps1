param(
    [string]$SSHHost = "217.154.124.154",
    [string]$SSHUser = "jota",
    [string]$RemotePath = "/unreal-servers/LinuxServer",
    [string]$LocalBuildPath = "J:\builds\LinuxServer.zip",
    [string]$SSHKeyPath = $null,  # Si tienes clave privada, ej: "C:\path\to\key.pem"
    [switch]$DryRun,
    [switch]$NoBackup
)

$ErrorActionPreference = 'Stop'

# Colores
$InfoColor = 'Cyan'
$WarnColor = 'Yellow'
$ErrorColor = 'Red'
$SuccessColor = 'Green'

function Write-Info { Write-Host "[INFO] $args" -ForegroundColor $InfoColor }
function Write-Warn { Write-Host "[WARN] $args" -ForegroundColor $WarnColor }
function Write-Error { Write-Host "[ERROR] $args" -ForegroundColor $ErrorColor }
function Write-Success { Write-Host "[OK] $args" -ForegroundColor $SuccessColor }

# Verificar que existe el ZIP
if (-not (Test-Path $LocalBuildPath)) {
    Write-Error "No se encontro: $LocalBuildPath"
    exit 1
}

$zipSize = [math]::Round((Get-Item $LocalBuildPath).Length / 1MB, 2)
Write-Info "Build ZIP encontrado: $zipSize MB"

# Preparar comando SSH
$sshCmd = if ($SSHKeyPath) {
    "ssh -i `"$SSHKeyPath`" -o StrictHostKeyChecking=no $SSHUser@$SSHHost"
} else {
    "ssh -o StrictHostKeyChecking=no $SSHUser@$SSHHost"
}

$scpCmd = if ($SSHKeyPath) {
    "scp -i `"$SSHKeyPath`" -o StrictHostKeyChecking=no"
} else {
    "scp -o StrictHostKeyChecking=no"
}

Write-Info "Conectando a $SSHHost como $SSHUser..."

# 1. Verificar conectividad SSH
try {
    $version = & powershell -c "$sshCmd 'uname -a'" 2>&1
    Write-Success "Conexion SSH establecida"
    Write-Host "  Sistema: $version" -ForegroundColor Gray
} catch {
    Write-Error "No se puede conectar por SSH: $_"
    exit 1
}

# 2. Verificar estado actual de PM2
Write-Info "Estado actual de PM2..."
& powershell -c "$sshCmd 'pm2 list'" 2>&1 | Select-Object -First 20

# 3. Crear backup de binarios actuales
if (-not $NoBackup) {
    Write-Info "Creando backup de binarios actuales..."
    if ($DryRun) {
        Write-Warn "[DRY RUN] tar -czf /unreal-servers/backup-LinuxServer-$(Get-Date -Format 'yyyyMMdd-HHmmss').tar.gz $RemotePath"
    } else {
        $backupName = "backup-LinuxServer-$(Get-Date -Format 'yyyyMMdd-HHmmss').tar.gz"
        & powershell -c "$sshCmd 'tar -czf /unreal-servers/$backupName $RemotePath 2>/dev/null && echo Backup creado: /unreal-servers/$backupName'" 2>&1
        Write-Success "Backup creado"
    }
}

# 4. Subir ZIP al servidor
Write-Info "Subiendo build a servidor (esto puede tardar...)..."
$remoteZip = "$RemotePath/LinuxServer-deploy.zip"

if ($DryRun) {
    Write-Warn "[DRY RUN] $scpCmd `"$LocalBuildPath`" $SSHUser@${SSHHost}:${remoteZip}"
} else {
    & powershell -c "$scpCmd `"$LocalBuildPath`" $SSHUser@${SSHHost}:${remoteZip}" 2>&1
    Write-Success "Build subido a $remoteZip"
}

# 5. Verificar jugadores activos y mostrar advertencia
Write-Warn "Verificando servidores activos..."
$serverStatus = & powershell -c "$sshCmd 'pm2 list'" 2>&1
if ($serverStatus -match "online") {
    Write-Warn "ADVERTENCIA: Hay servidores activos (probablemente con jugadores)"
    Write-Warn "El deployment desconectara a cualquier jugador conectado"
    Read-Host "Presiona ENTER para continuar o CTRL+C para cancelar"
}

# 6. Detener servidores
Write-Info "Deteniendo servidores de juego..."
if ($DryRun) {
    Write-Warn "[DRY RUN] pm2 stop all"
    Write-Warn "[DRY RUN] pm2 delete all"
} else {
    & powershell -c "$sshCmd 'pm2 stop all && sleep 2 && pm2 delete all'" 2>&1
    Write-Success "Servidores detenidos"
}

# 7. Extraer ZIP sobre los binarios existentes
Write-Info "Extrayendo nueva build..."
if ($DryRun) {
    Write-Warn "[DRY RUN] cd $RemotePath && unzip -o LinuxServer-deploy.zip"
} else {
    & powershell -c "$sshCmd 'cd $RemotePath && unzip -q -o LinuxServer-deploy.zip && echo Binarios actualizados'" 2>&1
    Write-Success "Binarios actualizados"
}

# 8. Limpiar ZIP
Write-Info "Limpiando archivos temporales..."
if ($DryRun) {
    Write-Warn "[DRY RUN] rm $remoteZip"
} else {
    & powershell -c "$sshCmd 'rm $remoteZip'" 2>&1
}

# 9. Verificar permisos en VR3DDSOCIALWORLDServer.sh
Write-Info "Verificando permisos de ejecucion..."
if ($DryRun) {
    Write-Warn "[DRY RUN] chmod +x $RemotePath/VR3DDSOCIALWORLDServer.sh"
} else {
    & powershell -c "$sshCmd 'chmod +x $RemotePath/VR3DDSOCIALWORLDServer.sh && chmod +x $RemotePath/p3DDSW_UE55/Binaries/Linux/VR3DDSOCIALWORLDServer-Linux-Shipping'" 2>&1
    Write-Success "Permisos configurados"
}

# 10. Reiniciar ecosystem.config.js con PM2
Write-Info "Reiniciando servidores con PM2..."
if ($DryRun) {
    Write-Warn "[DRY RUN] cd ~/scripts && pm2 start ecosystem.config.js"
} else {
    & powershell -c "$sshCmd 'cd ~/scripts && pm2 start ecosystem.config.js'" 2>&1
    Write-Success "Servidores reiniciados"
}

# 11. Esperar un poco y verificar estado
Write-Info "Esperando que los servidores se estabilicen..."
Start-Sleep -Seconds 5

Write-Info "Estado final de PM2..."
& powershell -c "$sshCmd 'pm2 list'" 2>&1 | Select-Object -First 30

Write-Success "Deployment completado"
Write-Info "Los servidores Linux deberian estar corriendo ahora"
Write-Info "Puedes verificar logs con: pm2 logs"
