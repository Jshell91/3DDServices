#!/usr/bin/env node
// Game Server Manager API - Phase 1: Health Monitoring Only
// Simplified version focused on monitoring Unreal dedicated servers

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Cargar variables de entorno
require('dotenv').config();

// Cargar configuración de servidores PM2
const serverConfigPath = path.join(__dirname, 'server-config.json');
let PM2_SERVER_CONFIG = null;

try {
    const configData = require('fs').readFileSync(serverConfigPath, 'utf8');
    PM2_SERVER_CONFIG = JSON.parse(configData);
    console.log('✅ PM2 server configuration loaded');
} catch (error) {
    console.warn('⚠️  PM2 config not found, using legacy mode');
}

const app = express();
const PORT = process.env.GSM_PORT || 3001;

// Configuración de seguridad
const SECURITY_CONFIG = {
    // API Key para autenticación (desde .env)
    apiKey: process.env.GSM_API_KEY || 'gsm_dev_key_2025_change_me',
    
    // IP Whitelist (desde .env o array por defecto)
    allowedIPs: process.env.GSM_ALLOWED_IPS ? 
        process.env.GSM_ALLOWED_IPS.split(',').map(ip => ip.trim()) : [
        '127.0.0.1',           // Localhost
        '::1',                 // IPv6 localhost  
        '157.230.112.247',     // Servidor API principal
        '217.154.124.154',     // Servidor de juegos (self)
        '92.191.152.245',      // IP pública del desarrollador
    ],
    
    // Endpoints que NO requieren autenticación
    publicEndpoints: [
        '/health'              // Health check siempre público
    ]
};

// Configuración de servidores (simplificada para monitoring)
const SERVER_CONFIG = {
    basePort: 8080,
    servers: {
        8080: { name: '01_MAINWORLD', type: 'main' },
        8081: { name: 'ART_EXHIBITIONSARTLOBBY', type: 'exhibition' },
        8082: { name: 'ART_EXHIBITIONS_AIArtists', type: 'exhibition' },
        8083: { name: 'ART_EXHIBITIONS_STRANGEWORLDS_', type: 'exhibition' },
        8084: { name: 'ART_EXHIBITIONS_4Deya', type: 'exhibition' },
        8086: { name: 'ART_Halloween2025_MULTIPLAYER', type: 'seasonal' },
        8087: { name: 'ART_JULIENVALLETakaBYJULES', type: 'artist' },
        8090: { name: 'SKYNOVAbyNOVA', type: 'artist' },
        8091: { name: 'MALL_DOWNTOWNCITYMALL', type: 'social' }
    },
    logDir: './logs',
    checkInterval: 30000 // 30 segundos
};

// Cache para métricas del sistema
let systemMetricsCache = null;
let systemMetricsLastCheck = 0;
const SYSTEM_METRICS_CACHE_DURATION = 300000; // 300 segundos (5 minutos)

app.use(cors());
app.use(express.json());

// ================================
// SECURITY MIDDLEWARE
// ================================

// Middleware de seguridad: IP Whitelist + API Key
app.use((req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                     (req.connection.socket ? req.connection.socket.remoteAddress : null);
    
    // Obtener IP real (considerando proxies)
    const realIP = req.headers['x-forwarded-for']?.split(',')[0] || 
                   req.headers['x-real-ip'] || 
                   clientIP;
    
    console.log(`🔒 Security check: ${realIP} → ${req.method} ${req.path}`);
    
    // Verificar si es un endpoint público
    const isPublicEndpoint = SECURITY_CONFIG.publicEndpoints.some(endpoint => 
        req.path === endpoint || req.path.startsWith(endpoint)
    );
    
    if (isPublicEndpoint) {
        console.log(`✅ Public endpoint access allowed: ${req.path}`);
        return next();
    }
    
    // Verificar IP Whitelist
    const isIPAllowed = SECURITY_CONFIG.allowedIPs.some(allowedIP => {
        // Normalizar IPs para comparación
        const normalizedRealIP = realIP.replace('::ffff:', '');
        const normalizedAllowedIP = allowedIP.replace('::ffff:', '');
        return normalizedRealIP === normalizedAllowedIP;
    });
    
    if (!isIPAllowed) {
        console.log(`❌ IP not in whitelist: ${realIP}`);
        return res.status(403).json({
            ok: false,
            error: 'Access forbidden: IP not authorized',
            ip: realIP,
            timestamp: new Date().toISOString()
        });
    }
    
    // Verificar API Key
    const providedKey = req.headers['x-api-key'] || 
                       req.headers['authorization']?.replace('Bearer ', '') ||
                       req.query.apikey;
    
    if (!providedKey) {
        console.log(`❌ No API key provided from ${realIP}`);
        return res.status(401).json({
            ok: false,
            error: 'Authentication required: API key missing',
            help: 'Provide API key via header "X-API-Key" or query parameter "apikey"',
            timestamp: new Date().toISOString()
        });
    }
    
    if (providedKey !== SECURITY_CONFIG.apiKey) {
        console.log(`❌ Invalid API key from ${realIP}: ${providedKey}`);
        return res.status(401).json({
            ok: false,
            error: 'Authentication failed: Invalid API key',
            timestamp: new Date().toISOString()
        });
    }
    
    console.log(`✅ Security check passed: ${realIP}`);
    next();
});

// Cache para evitar checks muy frecuentes
let cachedStatus = null;
let lastCheck = 0;
const CACHE_DURATION = 300000; // 300 segundos (5 minutos)

// ================================
// MONITORING FUNCTIONS
// ================================

// Get PM2 logs for an application
async function getPM2Logs(pm2AppName, lines = 50) {
    try {
        const logResult = await execPM2Command(`pm2 logs ${pm2AppName} --lines ${lines} --nostream`);
        return logResult.stdout.split('\n').filter(line => line.trim());
    } catch (error) {
        console.log(`❌ Error getting PM2 logs for ${pm2AppName}:`, error.message);
        return [];
    }
}

// Get PM2 process information
async function getPM2ProcessInfo(pm2AppName) {
    try {
        const statusResult = await execPM2Command(`pm2 jlist`);
        const processes = JSON.parse(statusResult.stdout);
        const appProcess = processes.find(p => p.name === pm2AppName);
        
        if (appProcess) {
            return {
                pid: appProcess.pid,
                startTime: new Date(appProcess.pm2_env.created_at).toISOString(),
                status: appProcess.pm2_env.status,
                restarts: appProcess.pm2_env.restart_time,
                uptime: appProcess.pm2_env.pm_uptime,
                cpu: appProcess.monit?.cpu || 0,
                memory: appProcess.monit?.memory || 0,
                pm2_managed: true,
                pm2_id: appProcess.pm2_env.pm_id,
                pm2_name: pm2AppName
            };
        }
        return null;
    } catch (error) {
        console.log(`❌ Error getting PM2 info for ${pm2AppName}:`, error.message);
        return null;
    }
}

// Enhanced server status check with PM2 awareness
async function checkServerStatus(port) {
    const pm2AppName = getPM2AppName(port);
    
    // Check port availability
    const portActive = await checkPortStatus(port);
    
    // Get PM2 status if available
    let pm2Status = null;
    if (pm2AppName) {
        try {
            pm2Status = await getPM2ProcessInfo(pm2AppName);
        } catch (error) {
            console.log(`⚠️ PM2 status check failed for ${pm2AppName}`);
        }
    }
    
    return {
        port: port,
        port_active: portActive,
        pm2_managed: !!pm2Status,
        pm2_status: pm2Status?.status || 'unknown',
        pm2_name: pm2AppName,
        process_info: pm2Status
    };
}

async function checkPortStatus(port) {
    return new Promise((resolve) => {
        // Usar ss (más moderno) o netstat como fallback
        exec(`ss -lntu 2>/dev/null | grep :${port} || netstat -lntu 2>/dev/null | grep :${port}`, (error, stdout) => {
            resolve(!error && stdout.includes(`:${port}`));
        });
    });
}

async function getProcessInfo(port) {
    // Intentar obtener info desde PM2 primero
    const pm2AppName = getPM2AppName(port);
    if (pm2AppName) {
        try {
            const pm2Info = await getPM2ProcessInfo(pm2AppName);
            if (pm2Info) {
                return pm2Info;
            }
        } catch (error) {
            console.log(`⚠️ PM2 process info failed for ${pm2AppName}, falling back to legacy`);
        }
    }
    
    // Fallback al método legacy (pgrep)
    return new Promise((resolve) => {
        const serverName = SERVER_CONFIG.servers[port]?.name || 'Unreal';
        exec(`pgrep -fl "${serverName}" | head -1`, (error, stdout) => {
            if (error || !stdout.trim()) {
                resolve(null);
            } else {
                const parts = stdout.trim().split(' ');
                resolve({
                    pid: parseInt(parts[0]),
                    startTime: new Date().toISOString(), // Simplificado por ahora
                    pm2_managed: false
                });
            }
        });
    });
}

async function getSystemResources(pid) {
    if (!pid) return null;
    
    return new Promise((resolve) => {
        exec(`ps -p ${pid} -o pid,pcpu,pmem,vsz,rss,etime --no-headers 2>/dev/null`, (error, stdout) => {
            if (error || !stdout.trim()) {
                console.log(`❌ PS Error for PID ${pid}:`, error?.message || 'No output');
                resolve(null);
            } else {
                const parts = stdout.trim().split(/\s+/);
                console.log(`📊 PS Output for PID ${pid}:`, stdout.trim());
                console.log(`📊 Parsed parts:`, parts);
                
                const resources = {
                    cpu: parseFloat(parts[1]) || 0,
                    memory: parseFloat(parts[2]) || 0,
                    vszKB: parseInt(parts[3]) || 0,
                    rssKB: parseInt(parts[4]) || 0,
                    uptime: parts[5] || '0:00'
                };
                
                console.log(`📊 Final resources for PID ${pid}:`, resources);
                resolve(resources);
            }
        });
    });
}

async function getRecentLogs(port, lines = 10) {
    // Intentar obtener logs de PM2 primero
    const pm2AppName = getPM2AppName(port);
    if (pm2AppName) {
        try {
            const pm2Logs = await getPM2Logs(pm2AppName, lines);
            if (pm2Logs.length > 0) {
                return pm2Logs;
            }
        } catch (error) {
            console.log(`⚠️ PM2 logs failed for ${pm2AppName}, falling back to legacy`);
        }
    }
    
    // Fallback a logs legacy
    try {
        const logFile = path.join(SERVER_CONFIG.logDir, `server-${port}.log`);
        const exists = await fs.access(logFile).then(() => true).catch(() => false);
        
        if (!exists) return [];
        
        return new Promise((resolve) => {
            exec(`tail -n ${lines} "${logFile}" 2>/dev/null`, (error, stdout) => {
                if (error) resolve([]);
                else resolve(stdout.trim().split('\n').filter(line => line.trim()));
            });
        });
    } catch (error) {
        return [];
    }
}

async function getSystemMetrics() {
    const now = Date.now();
    
    // Usar cache si es reciente
    if (systemMetricsCache && (now - systemMetricsLastCheck) < SYSTEM_METRICS_CACHE_DURATION) {
        return systemMetricsCache;
    }

    try {
        const [cpuInfo, memoryInfo, diskInfo, loadInfo, uptimeInfo] = await Promise.all([
            // CPU usage promedio del último minuto
            new Promise((resolve) => {
                exec(`top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}'`, (error, stdout) => {
                    resolve(error ? 0 : parseFloat(stdout.trim()) || 0);
                });
            }),
            
            // Información de memoria
            new Promise((resolve) => {
                exec(`free -m | awk 'NR==2{printf "%.1f %.1f %.1f", $3*100/$2, $3, $2}'`, (error, stdout) => {
                    if (error) resolve({ percent: 0, used: 0, total: 0 });
                    const parts = stdout.trim().split(' ');
                    resolve({
                        percent: parseFloat(parts[0]) || 0,
                        usedMB: parseFloat(parts[1]) || 0,
                        totalMB: parseFloat(parts[2]) || 0
                    });
                });
            }),
            
            // Uso de disco del sistema
            new Promise((resolve) => {
                exec(`df -h / | awk 'NR==2 {print $5}' | sed 's/%//'`, (error, stdout) => {
                    resolve(error ? 0 : parseFloat(stdout.trim()) || 0);
                });
            }),
            
            // Load average
            new Promise((resolve) => {
                exec(`uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//'`, (error, stdout) => {
                    resolve(error ? 0 : parseFloat(stdout.trim()) || 0);
                });
            }),
            
            // Uptime del sistema
            new Promise((resolve) => {
                exec(`uptime -p`, (error, stdout) => {
                    resolve(error ? 'unknown' : stdout.trim());
                });
            })
        ]);

        systemMetricsCache = {
            cpu: cpuInfo,
            memory: memoryInfo,
            disk: diskInfo,
            loadAverage: loadInfo,
            uptime: uptimeInfo,
            timestamp: new Date().toISOString()
        };
        
        systemMetricsLastCheck = now;
        console.log(`🖥️ System Metrics:`, systemMetricsCache);
        
        return systemMetricsCache;
        
    } catch (error) {
        console.error('Error getting system metrics:', error);
        return {
            cpu: 0,
            memory: { percent: 0, usedMB: 0, totalMB: 0 },
            disk: 0,
            loadAverage: 0,
            uptime: 'unknown',
            timestamp: new Date().toISOString()
        };
    }
}

function calculateHealthScore(isRunning, resources, hasRecentLogs) {
    if (!isRunning) return 0;
    
    let score = 100;
    
    if (resources) {
        // Penalizar alta CPU
        if (resources.cpu > 90) score -= 30;
        else if (resources.cpu > 70) score -= 15;
        
        // Penalizar alta memoria
        if (resources.memory > 95) score -= 25;
        else if (resources.memory > 80) score -= 10;
        
        // Bonus por bajo uso de recursos
        if (resources.cpu < 30 && resources.memory < 50) score += 5;
    }
    
    // Penalizar si no tiene logs recientes
    if (!hasRecentLogs) score -= 10;
    
    return Math.max(0, Math.min(100, score));
}

async function checkAllServers() {
    const now = Date.now();
    
    // Usar cache si es reciente
    if (cachedStatus && (now - lastCheck) < CACHE_DURATION) {
        return cachedStatus;
    }

    const servers = {};
    const summary = { total: 0, running: 0, stopped: 0, healthy: 0, warning: 0, critical: 0 };
    
    // Obtener métricas del sistema
    const systemMetrics = await getSystemMetrics();
    
    for (const [port, config] of Object.entries(SERVER_CONFIG.servers)) {
        const portNum = parseInt(port);
        summary.total++;        try {
            const [serverStatus, logs] = await Promise.all([
                checkServerStatus(portNum),
                getRecentLogs(portNum, 5)
            ]);
            
            const isRunning = serverStatus.port_active;
            const process = serverStatus.process_info;
            
            // Si PM2 está gestionando, usar sus métricas, sino usar legacy
            let resources = null;
            if (process && process.pm2_managed) {
                resources = {
                    cpu: process.cpu,
                    memory: Math.round((process.memory / 1024 / 1024) * 100) / 100, // MB
                    pid: process.pid
                };
            } else if (process?.pid) {
                resources = await getSystemResources(process.pid);
            }
            
            const healthScore = calculateHealthScore(isRunning, resources, logs.length > 0);
            
            let status = 'stopped';
            let healthLevel = 'critical';
            
            if (isRunning) {
                summary.running++;
                status = 'running';
                
                if (healthScore >= 80) healthLevel = 'healthy';
                else if (healthScore >= 60) healthLevel = 'warning';
                else healthLevel = 'critical';
                
                summary[healthLevel]++;
            } else {
                summary.stopped++;
            }
            
            servers[port] = {
                port: portNum,
                name: config.name,
                type: config.type,
                status: status,
                healthScore: healthScore,
                healthLevel: healthLevel,
                process: process,
                resources: resources,
                hasLogs: logs.length > 0,
                logCount: logs.length,
                pm2_managed: serverStatus.pm2_managed,
                pm2_status: serverStatus.pm2_status,
                pm2_name: serverStatus.pm2_name,
                lastChecked: new Date().toISOString()
            };
            
        } catch (error) {
            console.error(`Error checking server ${port}:`, error.message);
            servers[port] = {
                port: portNum,
                name: config.name,
                type: config.type,
                status: 'error',
                healthScore: 0,
                healthLevel: 'critical',
                error: error.message,
                lastChecked: new Date().toISOString()
            };
            summary.critical++;
        }
    }
    
    cachedStatus = { 
        servers, 
        summary, 
        systemMetrics,
        lastUpdate: new Date().toISOString() 
    };
    lastCheck = now;
    
    return cachedStatus;
}

// ================================
// API ENDPOINTS - PHASE 1 (READ-ONLY)
// ================================

// Health check del propio servicio
app.get('/health', (req, res) => {
    res.json({
        ok: true,
        service: 'Game Server Manager',
        version: '1.0.0-phase1',
        phase: 'Health Monitoring Only',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Estado general de todos los servidores
app.get('/servers/status', async (req, res) => {
    try {
        const status = await checkAllServers();
        res.json({ ok: true, ...status });
    } catch (error) {
        console.error('Error getting server status:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
});

// Health check específico de un servidor
app.get('/servers/:port/health', async (req, res) => {
    try {
        const port = parseInt(req.params.port);
        const config = SERVER_CONFIG.servers[port];
        
        if (!config) {
            return res.status(404).json({ ok: false, error: 'Server port not configured' });
        }
        
        const [serverStatus, logs] = await Promise.all([
            checkServerStatus(port),
            getRecentLogs(port, 20)
        ]);
        
        const isRunning = serverStatus.port_active;
        const process = serverStatus.process_info;
        
        // Si PM2 está gestionando, usar sus métricas
        let resources = null;
        if (process && process.pm2_managed) {
            resources = {
                cpu: process.cpu,
                memory: Math.round((process.memory / 1024 / 1024) * 100) / 100, // MB
                pid: process.pid
            };
        } else if (process?.pid) {
            resources = await getSystemResources(process.pid);
        }
        
        const healthScore = calculateHealthScore(isRunning, resources, logs.length > 0);
        
        let status = 'stopped';
        let healthLevel = 'critical';
        
        if (isRunning) {
            status = 'running';
            if (healthScore >= 80) healthLevel = 'healthy';
            else if (healthScore >= 60) healthLevel = 'warning';
            else healthLevel = 'critical';
        }
        
        res.json({
            ok: true,
            server: {
                port: port,
                name: config.name,
                type: config.type,
                status: status,
                healthScore: healthScore,
                healthLevel: healthLevel,
                process: process,
                resources: resources,
                recentLogs: logs.slice(-5), // Solo últimas 5 líneas
                logCount: logs.length,
                pm2_managed: serverStatus.pm2_managed,
                pm2_status: serverStatus.pm2_status,
                pm2_name: serverStatus.pm2_name,
                recommendations: generateRecommendations(isRunning, resources, healthScore),
                lastChecked: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error(`Error getting health for port ${req.params.port}:`, error);
        res.status(500).json({ ok: false, error: error.message });
    }
});

// Logs de un servidor (solo lectura)
app.get('/servers/:port/logs', async (req, res) => {
    try {
        const port = parseInt(req.params.port);
        const lines = Math.min(parseInt(req.query.lines) || 50, 500); // Max 500 líneas
        
        if (!SERVER_CONFIG.servers[port]) {
            return res.status(404).json({ ok: false, error: 'Server port not configured' });
        }
        
        const logs = await getRecentLogs(port, lines);
        
        res.json({
            ok: true,
            port: port,
            serverName: SERVER_CONFIG.servers[port].name,
            lines: logs.length,
            logs: logs,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

// Endpoint para métricas del sistema
app.get('/system/metrics', async (req, res) => {
    try {
        const metrics = await getSystemMetrics();
        res.json({
            ok: true,
            system: metrics
        });
    } catch (error) {
        console.error('Error getting system metrics:', error);
        res.status(500).json({ 
            ok: false, 
            error: 'Failed to get system metrics',
            details: error.message 
        });
    }
});

// Resumen para dashboard
app.get('/dashboard/summary', async (req, res) => {
    try {
        const forceRefresh = req.query.refresh === 'true';
        
        // Si se solicita refresh, invalidar cache
        if (forceRefresh) {
            cachedStatus = null;
            lastCheck = 0;
            console.log(`🔄 Dashboard summary: Force refresh requested`);
        }
        
        const status = await checkAllServers();
        
        // Crear resumen optimizado para dashboard
        const dashboardData = {
            summary: status.summary,
            servers: Object.values(status.servers).map(server => ({
                port: server.port,
                name: server.name,
                type: server.type,
                status: server.status,
                healthLevel: server.healthLevel,
                healthScore: server.healthScore,
                cpu: server.resources?.cpu || 0,
                memory: server.resources?.memory || 0,
                uptime: server.resources?.uptime || '0:00',
                pm2_managed: server.pm2_managed,
                pm2_status: server.pm2_status,
                pm2_name: server.pm2_name
            })),
            alerts: generateAlerts(status.servers),
            systemMetrics: status.systemMetrics,
            lastUpdate: status.lastUpdate,
            cacheStatus: {
                wasCached: !forceRefresh && cachedStatus !== null,
                cacheAge: Date.now() - lastCheck
            }
        };
        
        res.json({ ok: true, ...dashboardData });
    } catch (error) {
        console.error('Error getting dashboard summary:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
});

// Endpoint para forzar actualización del cache
app.post('/cache/invalidate', async (req, res) => {
    try {
        console.log(`🔄 Cache invalidation requested by ${req.ip}`);
        
        // Invalidar ambos caches
        cachedStatus = null;
        lastCheck = 0;
        systemMetricsCache = null;
        systemMetricsLastCheck = 0;
        
        // Obtener estado fresco
        const freshStatus = await checkAllServers();
        
        res.json({
            ok: true,
            message: 'Cache invalidated successfully',
            serversChecked: Object.keys(freshStatus.servers).length,
            lastUpdate: freshStatus.lastUpdate,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error invalidating cache:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
});

// ================================
// HELPER FUNCTIONS
// ================================

function generateRecommendations(isRunning, resources, healthScore) {
    const recommendations = [];
    
    if (!isRunning) {
        recommendations.push({
            level: 'critical',
            message: 'Server is not running',
            action: 'Check if server process crashed or was stopped'
        });
        return recommendations;
    }
    
    if (resources) {
        if (resources.cpu > 90) {
            recommendations.push({
                level: 'warning',
                message: 'High CPU usage',
                action: 'Monitor server performance and consider optimization'
            });
        }
        
        if (resources.memory > 90) {
            recommendations.push({
                level: 'critical',
                message: 'High memory usage',
                action: 'Server may need restart or memory optimization'
            });
        }
        
        if (healthScore < 60) {
            recommendations.push({
                level: 'warning',
                message: 'Low health score',
                action: 'Check server logs for errors and monitor performance'
            });
        }
    }
    
    if (recommendations.length === 0) {
        recommendations.push({
            level: 'info',
            message: 'Server running normally',
            action: 'No action required'
        });
    }
    
    return recommendations;
}

function generateAlerts(servers) {
    const alerts = [];
    
    Object.values(servers).forEach(server => {
        if (server.status === 'stopped') {
            alerts.push({
                level: 'critical',
                server: server.name,
                port: server.port,
                message: `Server ${server.name} is not running`
            });
        } else if (server.healthLevel === 'critical') {
            alerts.push({
                level: 'critical',
                server: server.name,
                port: server.port,
                message: `Server ${server.name} has critical health issues`
            });
        } else if (server.healthLevel === 'warning') {
            alerts.push({
                level: 'warning',
                server: server.name,
                port: server.port,
                message: `Server ${server.name} needs attention`
            });
        }
    });
    
    return alerts;
}

// ================================
// PM2 CONTROL FUNCTIONS
// ================================

// Execute PM2 command and return promise
function execPM2Command(command) {
    return new Promise((resolve, reject) => {
        exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
            if (error) {
                console.error(`PM2 Command Error: ${error.message}`);
                reject({ error: error.message, stderr });
                return;
            }
            
            console.log(`PM2 Command Output: ${stdout}`);
            resolve({ stdout, stderr });
        });
    });
}

// Get PM2 app name by port
function getPM2AppName(port) {
    if (PM2_SERVER_CONFIG && PM2_SERVER_CONFIG.servers[port]) {
        return PM2_SERVER_CONFIG.servers[port].pm2_name;
    }
    return null;
}

// Check if PM2 is available
async function checkPM2Available() {
    try {
        await execPM2Command('pm2 --version');
        return true;
    } catch (error) {
        console.error('PM2 not available:', error);
        return false;
    }
}

// Execute control action via PM2
async function executeServerControl(port, action) {
    const pm2AppName = getPM2AppName(port);
    
    if (!pm2AppName) {
        throw new Error(`No PM2 configuration found for port ${port}`);
    }
    
    const pm2Available = await checkPM2Available();
    if (!pm2Available) {
        throw new Error('PM2 is not available on this system');
    }
    
    let command;
    switch (action) {
        case 'start':
            // Start specific app from ecosystem config (use full path)
            command = `pm2 start ~/scripts/ecosystem.config.js --only ${pm2AppName}`;
            break;
        case 'stop':
            command = `pm2 stop ${pm2AppName}`;
            break;
        case 'restart':
            command = `pm2 restart ${pm2AppName}`;
            break;
        default:
            throw new Error(`Unsupported action: ${action}`);
    }
    
    console.log(`🔧 Executing PM2 command: ${command}`);
    const result = await execPM2Command(command);
    
    // Wait a moment for PM2 to process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get status after action
    const statusResult = await execPM2Command(`pm2 jlist`);
    const processes = JSON.parse(statusResult.stdout);
    const appStatus = processes.find(p => p.name === pm2AppName);
    
    return {
        command,
        output: result.stdout,
        pm2_status: appStatus ? appStatus.pm2_env.status : 'unknown',
        pid: appStatus ? appStatus.pid : null
    };
}

// ================================
// CONTROL ENDPOINTS - PHASE 2
// ================================

// Control endpoint for server actions (start/stop/restart)
app.post('/servers/:port/control', async (req, res) => {
    try {
        const port = parseInt(req.params.port, 10);
        const action = req.body.action || req.query.action;
        
        // Validate inputs
        if (!port || port < 1000 || port > 65535) {
            return res.status(400).json({ 
                ok: false, 
                error: 'Invalid port number' 
            });
        }
        
        if (!['start', 'stop', 'restart'].includes(action)) {
            return res.status(400).json({ 
                ok: false, 
                error: 'Invalid action. Must be: start, stop, or restart' 
            });
        }
        
        // Check if server exists in our config
        const serverExists = SERVER_CONFIG.servers[port] !== undefined;
        if (!serverExists) {
            return res.status(404).json({ 
                ok: false, 
                error: `Server on port ${port} not found in configuration` 
            });
        }
        
        console.log(`🎮 CONTROL ACTION: ${action} requested for port ${port} by ${req.ip}`);
        
        // Execute real PM2 control action
        try {
            const pm2Result = await executeServerControl(port, action);
            
            // Invalidar cache después de operaciones de control para forzar actualización
            cachedStatus = null;
            lastCheck = 0;
            
            const result = {
                ok: true,
                action: action,
                port: port,
                server_name: SERVER_CONFIG.servers[port]?.name || 'unknown',
                pm2_app: getPM2AppName(port),
                pm2_status: pm2Result.pm2_status,
                pid: pm2Result.pid,
                message: `Action '${action}' executed successfully for server on port ${port}`,
                timestamp: new Date().toISOString(),
                execution_details: {
                    command: pm2Result.command,
                    output: pm2Result.output
                }
            };
            
            console.log(`✅ CONTROL RESULT: ${JSON.stringify(result, null, 2)}`);
            console.log(`🔄 Cache invalidated - next status check will be fresh`);
            
            // Return success response
            res.json(result);
            
        } catch (pm2Error) {
            console.error(`❌ PM2 Control Error:`, pm2Error);
            
            // Fallback to simulation mode if PM2 fails
            const result = {
                ok: false,
                action: action,
                port: port,
                error: pm2Error.message,
                fallback_simulation: true,
                message: `PM2 control failed, falling back to simulation for port ${port}`,
                timestamp: new Date().toISOString()
            };
            
            res.status(500).json(result);
        }
        
    } catch (error) {
        console.error('❌ Control endpoint error:', error);
        res.status(500).json({ 
            ok: false, 
            error: 'Internal server error during control operation' 
        });
    }
});

// ================================
// SERVER STARTUP
// ================================

app.listen(PORT, async () => {
    console.log(`🎮 Game Server Manager API - Phase 2 (Health Monitoring + PM2 Control)`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Monitoring ${Object.keys(SERVER_CONFIG.servers).length} Unreal servers`);
    
    // Check PM2 availability
    const pm2Available = await checkPM2Available();
    console.log(`🔧 PM2 Integration: ${pm2Available ? '✅ Available' : '❌ Not Available (legacy mode)'}`);
    
    if (PM2_SERVER_CONFIG) {
        console.log(`⚙️  PM2 Configuration: ${Object.keys(PM2_SERVER_CONFIG.servers).length} servers configured`);
        console.log(`📁 PM2 Ecosystem: ${PM2_SERVER_CONFIG.config.ecosystem_file}`);
    } else {
        console.log(`⚠️  PM2 Configuration: Not found (server-config.json)`);
    }
    
    console.log(``);
    console.log(`� Security Configuration:`);
    console.log(`   🔑 API Key required: ${SECURITY_CONFIG.apiKey === 'gsm_dev_key_2025_change_me' ? '⚠️  CHANGE DEFAULT KEY!' : '✅ Custom key set'}`);
    console.log(`   🌐 IP Whitelist: ${SECURITY_CONFIG.allowedIPs.length} authorized IPs`);
    console.log(`   📋 Allowed IPs: ${SECURITY_CONFIG.allowedIPs.join(', ')}`);
    console.log(`   🚪 Public endpoints: ${SECURITY_CONFIG.publicEndpoints.join(', ')}`);
    console.log(``);
    console.log(`�🔗 Endpoints (🔒 = Auth Required):`);
    console.log(`   GET  /health                    - API health check`);
    console.log(`   GET  /servers/status      🔒    - All servers status`);
    console.log(`   GET  /servers/:port/health🔒    - Specific server health`);
    console.log(`   GET  /servers/:port/logs  🔒    - Server logs (read-only)`);
    console.log(`   GET  /system/metrics      🔒    - System-wide metrics (CPU, RAM, Disk)`);
    console.log(`   GET  /dashboard/summary   🔒    - Dashboard optimized data`);
    console.log(`   POST /servers/:port/control🔒   - Server control (start/stop/restart)`);
    console.log(``);
    console.log(`🔑 Authentication Methods:`);
    console.log(`   Header: X-API-Key: ${SECURITY_CONFIG.apiKey}`);
    console.log(`   Query:  ?apikey=${SECURITY_CONFIG.apiKey}`);
    console.log(`   Bearer: Authorization: Bearer ${SECURITY_CONFIG.apiKey}`);
    console.log(``);
    console.log(`⏱️  Cache duration: ${CACHE_DURATION/1000}s`);
    console.log(`📋 Log directory: ${SERVER_CONFIG.logDir}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Game Server Manager...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down...');
    process.exit(0);
});