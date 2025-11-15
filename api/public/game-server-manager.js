// Dashboard integration for Game Server Manager
// Add this to your existing dashboard.js

class GameServerManager {
    constructor(apiUrl = '/api/dashboard') {
        this.apiUrl = apiUrl;
        this.servers = new Map();
        this.updateInterval = null;
    }

    async initialize() {
        await this.loadServers();
        this.startAutoRefresh();
        this.renderServerPanel();
    }

    async loadServers() {
        try {
            const response = await fetch(`${this.apiUrl}/gsm-data`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            
            if (data.ok) {
                // Clear existing servers and update with new data
                this.servers.clear();
                data.servers.forEach(server => {
                    this.servers.set(server.port.toString(), {
                        ...server,
                        map: server.name || `Port ${server.port}`
                    });
                });
                this.updateServerPanel();
            } else {
                this.showError(data.error || 'Failed to load server status');
            }
        } catch (error) {
            console.error('Error loading servers:', error);
            this.showError('Could not connect to Game Server Manager');
        }
    }

    renderServerPanel() {
        const container = document.getElementById('game-servers-container') || this.createServerContainer();
        
        container.innerHTML = `
            <div class="server-panel">
                <h3>🎮 Unreal Dedicated Servers</h3>
                <div class="server-summary">
                    <span class="summary-item">
                        <span class="dot green"></span>
                        <span id="running-count">0</span> Running
                    </span>
                    <span class="summary-item">
                        <span class="dot red"></span>
                        <span id="stopped-count">0</span> Stopped
                    </span>
                    <button id="refresh-servers" class="btn btn-sm">🔄 Refresh</button>
                </div>
                <div id="servers-grid" class="servers-grid">
                    <!-- Servers will be rendered here -->
                </div>
            </div>
        `;

        document.getElementById('refresh-servers').addEventListener('click', () => this.loadServers());
    }

    updateServerPanel() {
        const serversGrid = document.getElementById('servers-grid');
        const runningCount = document.getElementById('running-count');
        const stoppedCount = document.getElementById('stopped-count');

        if (!serversGrid) return;

        let running = 0;
        let stopped = 0;

        const serverCards = Array.from(this.servers.values()).map(server => {
            if (server.status === 'running') running++;
            else stopped++;

            const healthColor = this.getHealthColor(server);
            const cpuUsage = server.resources?.cpu || 0;
            const memUsage = server.resources?.memory || 0;

            return `
                <div class="server-card ${server.status}" data-port="${server.port}">
                    <div class="server-header">
                        <div class="server-status ${server.status}">
                            <span class="status-dot ${server.status}"></span>
                            <strong>Port ${server.port}</strong>
                        </div>
                        <div class="server-actions">
                            ${server.status === 'running' 
                                ? `<button onclick="gameManager.stopServer(${server.port})" class="btn btn-sm btn-danger">⏹️</button>
                                   <button onclick="gameManager.restartServer(${server.port})" class="btn btn-sm btn-warning">🔄</button>`
                                : `<button onclick="gameManager.startServer(${server.port})" class="btn btn-sm btn-success">▶️</button>`
                            }
                            <button onclick="gameManager.showLogs(${server.port})" class="btn btn-sm btn-info">📋</button>
                        </div>
                    </div>
                    <div class="server-info">
                        <div class="map-name">${server.map}</div>
                        ${server.status === 'running' ? `
                            <div class="resources">
                                <div class="resource-bar">
                                    <label>CPU: ${cpuUsage.toFixed(1)}%</label>
                                    <div class="bar"><div class="fill cpu" style="width: ${Math.min(cpuUsage, 100)}%"></div></div>
                                </div>
                                <div class="resource-bar">
                                    <label>MEM: ${memUsage.toFixed(1)}%</label>
                                    <div class="bar"><div class="fill memory" style="width: ${Math.min(memUsage, 100)}%"></div></div>
                                </div>
                            </div>
                            <div class="health-score" style="color: ${healthColor}">
                                Health: ${server.healthScore || 0}%
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });

        serversGrid.innerHTML = serverCards.join('');
        runningCount.textContent = running;
        stoppedCount.textContent = stopped;
    }

    async startServer(port) {
        try {
            const response = await fetch(`${this.apiUrl}/gsm/servers/${port}/start`, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            
            if (data.ok) {
                this.showSuccess(`Starting server on port ${port}`);
                // Reload immediately since cache is invalidated automatically
                setTimeout(() => this.loadServers(), 1000);
            } else {
                this.showError(data.error || 'Failed to start server');
            }
        } catch (error) {
            this.showError('Failed to start server: ' + error.message);
        }
    }

    async stopServer(port) {
        if (!confirm(`Stop server on port ${port}?`)) return;
        
        try {
            const response = await fetch(`${this.apiUrl}/gsm/servers/${port}/stop`, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            
            if (data.ok) {
                this.showSuccess(`Stopping server on port ${port}`);
                // Reload immediately since cache is invalidated automatically
                setTimeout(() => this.loadServers(), 1000);
            } else {
                this.showError(data.error || 'Failed to stop server');
            }
        } catch (error) {
            this.showError('Failed to stop server: ' + error.message);
        }
    }

    async restartServer(port) {
        if (!confirm(`Restart server on port ${port}?`)) return;
        
        try {
            const response = await fetch(`${this.apiUrl}/gsm/servers/${port}/restart`, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            
            if (data.ok) {
                this.showSuccess(`Restarting server on port ${port}`);
                // Reload immediately since cache is invalidated automatically
                setTimeout(() => this.loadServers(), 1000);
            } else {
                this.showError(data.error || 'Failed to restart server');
            }
        } catch (error) {
            this.showError('Failed to restart server: ' + error.message);
        }
    }

    async showLogs(port) {
        try {
            // Note: Log endpoint not implemented in proxy yet
            // For now, show a placeholder message
            this.openLogModal(port, [`Logs for server ${port} not available yet`, 'Feature coming soon...']);
        } catch (error) {
            this.showError('Failed to load logs');
        }
    }

    openLogModal(port, logs) {
        const modal = document.createElement('div');
        modal.className = 'log-modal';
        modal.innerHTML = `
            <div class="log-modal-content">
                <div class="log-header">
                    <h4>Server Logs - Port ${port}</h4>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="btn btn-sm">✖️</button>
                </div>
                <pre class="log-content">${logs.join('\n')}</pre>
            </div>
        `;
        document.body.appendChild(modal);
    }

    getHealthColor(server) {
        const score = server.healthScore || 0;
        if (score >= 80) return '#28a745';
        if (score >= 60) return '#ffc107';
        return '#dc3545';
    }

    createServerContainer() {
        const container = document.createElement('div');
        container.id = 'game-servers-container';
        container.className = 'dashboard-section';
        
        // Insert after maps section or at end
        const mapsSection = document.querySelector('.maps-section');
        if (mapsSection) {
            mapsSection.parentNode.insertBefore(container, mapsSection.nextSibling);
        } else {
            document.querySelector('.dashboard-content').appendChild(container);
        }
        
        return container;
    }

    startAutoRefresh() {
        this.updateInterval = setInterval(() => {
            this.loadServers();
        }, 30000); // Refresh every 30 seconds
    }

    showSuccess(message) {
        // Integrate with your existing notification system
        console.log('✅', message);
    }

    showError(message) {
        // Integrate with your existing notification system
        console.error('❌', message);
    }
}

// CSS for the server manager
const serverManagerCSS = `
    .server-panel {
        background: white;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .server-summary {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 20px;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 6px;
    }

    .summary-item {
        display: flex;
        align-items: center;
        gap: 5px;
    }

    .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
    }
    
    .dot.green { background: #28a745; }
    .dot.red { background: #dc3545; }

    .servers-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 15px;
    }

    .server-card {
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        padding: 15px;
        background: #fafafa;
    }

    .server-card.running {
        border-left: 4px solid #28a745;
        background: #f8fff8;
    }

    .server-card.stopped {
        border-left: 4px solid #dc3545;
        background: #fff8f8;
    }

    .server-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
    }

    .server-status {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .status-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
    }

    .status-dot.running { background: #28a745; }
    .status-dot.stopped { background: #dc3545; }

    .server-actions {
        display: flex;
        gap: 5px;
    }

    .map-name {
        font-size: 12px;
        color: #666;
        margin-bottom: 10px;
    }

    .resource-bar {
        margin-bottom: 5px;
    }

    .resource-bar label {
        font-size: 11px;
        color: #666;
        display: block;
        margin-bottom: 2px;
    }

    .bar {
        height: 6px;
        background: #e0e0e0;
        border-radius: 3px;
        overflow: hidden;
    }

    .fill {
        height: 100%;
        transition: width 0.3s ease;
    }

    .fill.cpu { background: #17a2b8; }
    .fill.memory { background: #ffc107; }

    .health-score {
        font-size: 12px;
        font-weight: bold;
        margin-top: 8px;
    }

    .log-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .log-modal-content {
        background: white;
        border-radius: 8px;
        width: 80%;
        max-width: 800px;
        max-height: 80%;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .log-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        border-bottom: 1px solid #e0e0e0;
    }

    .log-content {
        padding: 20px;
        overflow-y: auto;
        flex: 1;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        background: #f8f9fa;
        margin: 0;
    }
`;

// Add CSS to page
const style = document.createElement('style');
style.textContent = serverManagerCSS;
document.head.appendChild(style);

// Initialize when dashboard loads
let gameManager;
document.addEventListener('DOMContentLoaded', () => {
    gameManager = new GameServerManager();
    gameManager.initialize();
});