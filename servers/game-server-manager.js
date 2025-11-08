#!/usr/bin/env node
// Game Server Manager API - Concept Demo
// Gestiona servidores Unreal dedicados via API REST

const express = require('express');
const cors = require('cors');
const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3001;

// Configuración de servidores
const SERVER_CONFIG = {
    basePort: 8080,
    maxServers: 10,
    executable: '/home/jota/LinuxServer/VR3DDSOCIALWORLDServer.sh',
    logDir: '/home/jota/LinuxServer/logs',
    maps: {
        8080: '01_MAINWORLD',
        8081: 'ART_EXHIBITIONSARTLOBBY',
        8082: 'ART_EXHIBITIONS_AIArtists',
        8083: 'ART_EXHIBITIONS_STRANGEWORLDS_',
        8085: 'ART_EXHIBITIONS_SHEisAI',
        8086: 'ART_Halloween2025_MULTIPLAYER',
        8087: 'ART_JULIENVALLETakaBYJULES',
        8090: 'SKYNOVAbyNOVA',
        8091: 'MALL_DOWNTOWNCITYMALL'
    }
};

app.use(cors());
app.use(express.json());

// ================================
// HEALTH CHECK FUNCTIONS
// ================================

async function checkPortStatus(port) {
    return new Promise((resolve) => {
        exec(`ss -lntu | grep :${port}`, (error, stdout) => {
            resolve(!error && stdout.includes(`:${port}`));
        });
    });
}

async function getServerProcessInfo(port) {
    return new Promise((resolve) => {
        exec(`pgrep -fl ${SERVER_CONFIG.maps[port] || 'Unreal'} | head -1`, (error, stdout) => {
            if (error || !stdout.trim()) {
                resolve(null);
            } else {
                const parts = stdout.trim().split(' ');
                resolve({
                    pid: parts[0],
                    command: parts.slice(1).join(' ')
                });
            }
        });
    });
}

async function getServerResources(pid) {
    if (!pid) return null;
    
    return new Promise((resolve) => {
        exec(`ps -p ${pid} -o pid,pcpu,pmem,vsz,rss --no-headers`, (error, stdout) => {
            if (error || !stdout.trim()) {
                resolve(null);
            } else {
                const parts = stdout.trim().split(/\s+/);
                resolve({
                    cpu: parseFloat(parts[1]) || 0,
                    memory: parseFloat(parts[2]) || 0,
                    vsz: parseInt(parts[3]) || 0,
                    rss: parseInt(parts[4]) || 0
                });
            }
        });
    });
}

// ================================
// API ENDPOINTS
// ================================

// Estado general de todos los servidores
app.get('/servers/status', async (req, res) => {
    try {
        const servers = {};
        
        for (const [port, mapName] of Object.entries(SERVER_CONFIG.maps)) {
            const portNum = parseInt(port);
            const isRunning = await checkPortStatus(portNum);
            const process = await getServerProcessInfo(portNum);
            const resources = await getServerResources(process?.pid);
            
            servers[port] = {
                port: portNum,
                map: mapName,
                status: isRunning ? 'running' : 'stopped',
                process: process,
                resources: resources,
                lastChecked: new Date().toISOString()
            };
        }
        
        res.json({
            ok: true,
            servers: servers,
            summary: {
                total: Object.keys(servers).length,
                running: Object.values(servers).filter(s => s.status === 'running').length,
                stopped: Object.values(servers).filter(s => s.status === 'stopped').length
            }
        });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

// Health check específico de un servidor
app.get('/servers/:port/health', async (req, res) => {
    try {
        const port = parseInt(req.params.port);
        const mapName = SERVER_CONFIG.maps[port];
        
        if (!mapName) {
            return res.status(404).json({ ok: false, error: 'Server port not configured' });
        }
        
        const isRunning = await checkPortStatus(port);
        const process = await getServerProcessInfo(port);
        const resources = await getServerResources(process?.pid);
        
        // Leer últimas líneas del log
        let recentLogs = [];
        try {
            const logFile = `${SERVER_CONFIG.logDir}/server-${port}.log`;
            const logContent = await fs.readFile(logFile, 'utf8');
            recentLogs = logContent.split('\n').slice(-10).filter(line => line.trim());
        } catch (logError) {
            // Log file doesn't exist or not readable
        }
        
        res.json({
            ok: true,
            server: {
                port: port,
                map: mapName,
                status: isRunning ? 'running' : 'stopped',
                process: process,
                resources: resources,
                recentLogs: recentLogs,
                healthScore: calculateHealthScore(isRunning, resources),
                lastChecked: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

// Iniciar servidor
app.post('/servers/:port/start', async (req, res) => {
    try {
        const port = parseInt(req.params.port);
        const mapName = SERVER_CONFIG.maps[port];
        
        if (!mapName) {
            return res.status(404).json({ ok: false, error: 'Server port not configured' });
        }
        
        // Verificar si ya está corriendo
        const isRunning = await checkPortStatus(port);
        if (isRunning) {
            return res.status(400).json({ ok: false, error: 'Server is already running' });
        }
        
        // Iniciar servidor en screen session
        const sessionName = `unreal-server-${port}`;
        const logFile = `${SERVER_CONFIG.logDir}/server-${port}.log`;
        
        const command = `screen -dmS "${sessionName}" bash -c "${SERVER_CONFIG.executable} ${mapName} -port=${port} 2>&1 | tee -a ${logFile}; exec bash"`;
        
        exec(command, (error) => {
            if (error) {
                console.error(`Error starting server ${port}:`, error);
            }
        });
        
        // Esperar un momento y verificar
        await new Promise(resolve => setTimeout(resolve, 2000));
        const startedSuccessfully = await checkPortStatus(port);
        
        res.json({
            ok: true,
            message: `Server ${mapName} start command sent`,
            port: port,
            map: mapName,
            started: startedSuccessfully,
            sessionName: sessionName
        });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

// Parar servidor
app.post('/servers/:port/stop', async (req, res) => {
    try {
        const port = parseInt(req.params.port);
        const mapName = SERVER_CONFIG.maps[port];
        
        if (!mapName) {
            return res.status(404).json({ ok: false, error: 'Server port not configured' });
        }
        
        const sessionName = `unreal-server-${port}`;
        
        // Terminar session de screen
        exec(`screen -S "${sessionName}" -X quit`, (error) => {
            if (error) {
                console.error(`Error stopping server ${port}:`, error);
            }
        });
        
        // También matar procesos por si acaso
        exec(`pkill -f "${mapName}"`, (error) => {
            // Silently handle error
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        const stoppedSuccessfully = !(await checkPortStatus(port));
        
        res.json({
            ok: true,
            message: `Server ${mapName} stop command sent`,
            port: port,
            map: mapName,
            stopped: stoppedSuccessfully
        });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

// Reiniciar servidor
app.post('/servers/:port/restart', async (req, res) => {
    try {
        const port = parseInt(req.params.port);
        
        // Parar primero
        await new Promise((resolve) => {
            exec(`screen -S "unreal-server-${port}" -X quit; pkill -f "${SERVER_CONFIG.maps[port]}"`, () => {
                setTimeout(resolve, 2000);
            });
        });
        
        // Luego iniciar
        const mapName = SERVER_CONFIG.maps[port];
        const sessionName = `unreal-server-${port}`;
        const logFile = `${SERVER_CONFIG.logDir}/server-${port}.log`;
        
        const command = `screen -dmS "${sessionName}" bash -c "${SERVER_CONFIG.executable} ${mapName} -port=${port} 2>&1 | tee -a ${logFile}; exec bash"`;
        
        exec(command);
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        const isRunning = await checkPortStatus(port);
        
        res.json({
            ok: true,
            message: `Server ${mapName} restarted`,
            port: port,
            map: mapName,
            running: isRunning
        });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

// Logs en tiempo real (últimas líneas)
app.get('/servers/:port/logs', async (req, res) => {
    try {
        const port = parseInt(req.params.port);
        const lines = parseInt(req.query.lines) || 50;
        const logFile = `${SERVER_CONFIG.logDir}/server-${port}.log`;
        
        const logs = await fs.readFile(logFile, 'utf8');
        const recentLines = logs.split('\n').slice(-lines).filter(line => line.trim());
        
        res.json({
            ok: true,
            port: port,
            lines: recentLines.length,
            logs: recentLines
        });
    } catch (error) {
        res.status(404).json({ ok: false, error: 'Log file not found or not readable' });
    }
});

// Health score calculation
function calculateHealthScore(isRunning, resources) {
    if (!isRunning) return 0;
    if (!resources) return isRunning ? 50 : 0;
    
    let score = 100;
    if (resources.cpu > 80) score -= 20;
    if (resources.memory > 90) score -= 30;
    
    return Math.max(0, score);
}

// ================================
// SERVER STARTUP
// ================================

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎮 Game Server Manager API running on port ${PORT}`);
    console.log(`🔗 Endpoints:`);
    console.log(`   GET  /servers/status`);
    console.log(`   GET  /servers/:port/health`);
    console.log(`   POST /servers/:port/start`);
    console.log(`   POST /servers/:port/stop`);
    console.log(`   POST /servers/:port/restart`);
    console.log(`   GET  /servers/:port/logs`);
});