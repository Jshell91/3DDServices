// Game Server Monitor Integration - Phase 1
// Simple health monitoring integration for existing dashboard

class GameServerMonitor {
    constructor(apiUrl = 'http://217.154.124.154:3001') {
        this.apiUrl = apiUrl;
        this.isConnected = false;
        this.servers = new Map();
        this.updateInterval = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.isVisible = false;
    }

    async initialize() {
        console.log('🎮 Initializing Game Server Monitor...');
        
        // Try to connect to the monitoring service
        if (await this.testConnection()) {
            this.renderMonitorPanel();
            await this.loadServerData();
            this.startAutoRefresh();
            console.log('✅ Game Server Monitor initialized successfully');
        } else {
            this.renderOfflinePanel();
            console.log('⚠️ Game Server Monitor service not available');
        }
    }

    async testConnection() {
        try {
            const response = await fetch(`${this.apiUrl}/health`, { 
                signal: AbortSignal.timeout(5000) 
            });
            const data = await response.json();
            this.isConnected = data.ok;
            return this.isConnected;
        } catch (error) {
            console.log('Game Server Monitor service not reachable:', error.message);
            this.isConnected = false;
            return false;
        }
    }

    async loadServerData() {
        if (!this.isConnected) return;

        try {
            const response = await fetch(`${this.apiUrl}/dashboard/summary`);
            const data = await response.json();
            
            if (data.ok) {
                this.updateServerData(data);
                this.retryCount = 0; // Reset retry count on success
            } else {
                throw new Error(data.error || 'Failed to load server data');
            }
        } catch (error) {
            console.error('Error loading server data:', error);
            this.handleConnectionError();
        }
    }

    updateServerData(data) {
        // Update servers map
        data.servers.forEach(server => {
            this.servers.set(server.port, server);
        });

        // Update UI
        this.updateMonitorPanel(data);
    }

    renderMonitorPanel() {
        const container = this.getOrCreateContainer();
        
        container.innerHTML = `
            <div class="server-monitor-panel">
                <div class="monitor-header">
                    <h3>🎮 Game Servers</h3>
                    <div class="connection-status connected">
                        <span class="status-dot"></span>
                        <span>Monitoring Active</span>
                    </div>
                </div>
                
                <div class="monitor-summary">
                    <div class="summary-card">
                        <div class="summary-number" id="total-servers">-</div>
                        <div class="summary-label">Total Servers</div>
                    </div>
                    <div class="summary-card running">
                        <div class="summary-number" id="running-servers">-</div>
                        <div class="summary-label">Running</div>
                    </div>
                    <div class="summary-card stopped">
                        <div class="summary-number" id="stopped-servers">-</div>
                        <div class="summary-label">Stopped</div>
                    </div>
                    <div class="summary-card healthy">
                        <div class="summary-number" id="healthy-servers">-</div>
                        <div class="summary-label">Healthy</div>
                    </div>
                </div>

                <div id="server-alerts" class="server-alerts"></div>

                <div class="servers-grid" id="servers-grid">
                    <div class="loading">Loading server data...</div>
                </div>

                <div class="monitor-footer">
                    <small>Last update: <span id="last-update">-</span></small>
                    <button onclick="gameMonitor.refreshData()" class="btn btn-sm">🔄 Refresh</button>
                </div>
            </div>
        `;
    }

    renderOfflinePanel() {
        const container = this.getOrCreateContainer();
        
        container.innerHTML = `
            <div class="server-monitor-panel offline">
                <div class="monitor-header">
                    <h3>🎮 Game Servers</h3>
                    <div class="connection-status disconnected">
                        <span class="status-dot"></span>
                        <span>Monitoring Offline</span>
                    </div>
                </div>
                
                <div class="offline-message">
                    <p>⚠️ Game Server Monitor service is not available</p>
                    <p>Server status monitoring is currently offline.</p>
                    <button onclick="gameMonitor.reconnect()" class="btn">🔄 Try Reconnect</button>
                </div>
            </div>
        `;
    }

    updateMonitorPanel(data) {
        // Update summary numbers
        document.getElementById('total-servers').textContent = data.summary.total;
        document.getElementById('running-servers').textContent = data.summary.running;
        document.getElementById('stopped-servers').textContent = data.summary.stopped;
        document.getElementById('healthy-servers').textContent = data.summary.healthy;

        // Update alerts
        this.updateAlerts(data.alerts);

        // Update servers grid
        this.updateServersGrid(data.servers);

        // Update timestamp
        const lastUpdate = new Date(data.lastUpdate);
        document.getElementById('last-update').textContent = lastUpdate.toLocaleTimeString();
    }

    updateAlerts(alerts) {
        const alertsContainer = document.getElementById('server-alerts');
        
        if (!alerts || alerts.length === 0) {
            alertsContainer.innerHTML = '';
            return;
        }

        const alertsHTML = alerts.map(alert => `
            <div class="alert alert-${alert.level}">
                <span class="alert-icon">${alert.level === 'critical' ? '🚨' : '⚠️'}</span>
                <span class="alert-message">${alert.message}</span>
                <span class="alert-server">Port ${alert.port}</span>
            </div>
        `).join('');

        alertsContainer.innerHTML = `
            <div class="alerts-header">Alerts</div>
            ${alertsHTML}
        `;
    }

    updateServersGrid(servers) {
        const grid = document.getElementById('servers-grid');
        
        if (!servers || servers.length === 0) {
            grid.innerHTML = '<div class="no-data">No server data available</div>';
            return;
        }

        const serverCards = servers.map(server => {
            const healthColor = this.getHealthColor(server.healthLevel);
            const statusIcon = server.status === 'running' ? '🟢' : '🔴';
            
            return `
                <div class="server-card ${server.status} ${server.healthLevel}" data-port="${server.port}">
                    <div class="server-card-header">
                        <div class="server-status">
                            ${statusIcon} Port ${server.port}
                        </div>
                        <div class="server-type">${server.type}</div>
                    </div>
                    
                    <div class="server-name">${server.name}</div>
                    
                    ${server.status === 'running' ? `
                        <div class="server-metrics">
                            <div class="metric">
                                <span class="metric-label">CPU</span>
                                <div class="metric-bar">
                                    <div class="metric-fill cpu" style="width: ${Math.min(server.cpu, 100)}%"></div>
                                </div>
                                <span class="metric-value">${server.cpu.toFixed(1)}%</span>
                            </div>
                            
                            <div class="metric">
                                <span class="metric-label">MEM</span>
                                <div class="metric-bar">
                                    <div class="metric-fill memory" style="width: ${Math.min(server.memory, 100)}%"></div>
                                </div>
                                <span class="metric-value">${server.memory.toFixed(1)}%</span>
                            </div>
                            
                            <div class="server-health" style="color: ${healthColor}">
                                Health: ${server.healthScore}%
                            </div>
                            
                            <div class="server-uptime">
                                Uptime: ${server.uptime}
                            </div>
                        </div>
                    ` : `
                        <div class="server-offline">
                            <span>Server not running</span>
                        </div>
                    `}
                </div>
            `;
        }).join('');

        grid.innerHTML = serverCards;
    }

    getHealthColor(healthLevel) {
        switch (healthLevel) {
            case 'healthy': return '#28a745';
            case 'warning': return '#ffc107';
            case 'critical': return '#dc3545';
            default: return '#6c757d';
        }
    }

    getOrCreateContainer() {
        // Use the existing container in the dashboard tab
        let container = document.getElementById('game-server-monitor');
        
        if (!container) {
            // Fallback: create container if not found
            container = document.createElement('div');
            container.id = 'game-server-monitor';
            container.className = 'dashboard-section';
            document.body.appendChild(container);
        }
        
        return container;
    }

    startAutoRefresh() {
        // Refresh every 30 seconds, but only if the tab is visible
        this.updateInterval = setInterval(() => {
            if (this.isTabVisible()) {
                this.loadServerData();
            }
        }, 30000);
    }

    isTabVisible() {
        const gameServersTab = document.getElementById('game-servers');
        return gameServersTab && gameServersTab.classList.contains('active');
    }

    stopAutoRefresh() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    async refreshData() {
        const refreshBtn = document.querySelector('.monitor-footer button');
        if (refreshBtn) {
            refreshBtn.textContent = '🔄 Refreshing...';
            refreshBtn.disabled = true;
        }

        await this.loadServerData();

        if (refreshBtn) {
            refreshBtn.textContent = '🔄 Refresh';
            refreshBtn.disabled = false;
        }
    }

    async reconnect() {
        this.retryCount++;
        console.log(`Attempting to reconnect (${this.retryCount}/${this.maxRetries})...`);
        
        if (await this.testConnection()) {
            this.renderMonitorPanel();
            await this.loadServerData();
            this.startAutoRefresh();
        } else if (this.retryCount < this.maxRetries) {
            setTimeout(() => this.reconnect(), 5000);
        }
    }

    handleConnectionError() {
        this.isConnected = false;
        this.stopAutoRefresh();
        
        if (this.retryCount < this.maxRetries) {
            setTimeout(() => this.reconnect(), 10000);
        } else {
            this.renderOfflinePanel();
        }
    }

    destroy() {
        this.stopAutoRefresh();
        const container = document.getElementById('game-server-monitor');
        if (container) {
            container.remove();
        }
    }
}

// CSS Styles for the monitor
const monitorCSS = `
    .server-monitor-panel {
        background: white;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border: 1px solid #e0e0e0;
    }

    .server-monitor-panel.offline {
        background: #fff8f8;
        border-color: #f8d7da;
    }

    .monitor-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 1px solid #e0e0e0;
        padding-bottom: 10px;
    }

    .monitor-header h3 {
        margin: 0;
        color: #333;
    }

    .connection-status {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9em;
        padding: 4px 12px;
        border-radius: 15px;
    }

    .connection-status.connected {
        background: #d4edda;
        color: #155724;
    }

    .connection-status.disconnected {
        background: #f8d7da;
        color: #721c24;
    }

    .connection-status .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
    }

    .connection-status.connected .status-dot {
        background: #28a745;
    }

    .connection-status.disconnected .status-dot {
        background: #dc3545;
    }

    .monitor-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 15px;
        margin-bottom: 20px;
    }

    .summary-card {
        text-align: center;
        padding: 15px;
        border-radius: 6px;
        border: 1px solid #e0e0e0;
        background: #f8f9fa;
    }

    .summary-card.running {
        border-color: #28a745;
        background: #d4edda;
    }

    .summary-card.stopped {
        border-color: #dc3545;
        background: #f8d7da;
    }

    .summary-card.healthy {
        border-color: #17a2b8;
        background: #d1ecf1;
    }

    .summary-number {
        font-size: 2em;
        font-weight: bold;
        color: #333;
        line-height: 1;
    }

    .summary-label {
        font-size: 0.9em;
        color: #666;
        margin-top: 5px;
    }

    .server-alerts {
        margin-bottom: 20px;
    }

    .alerts-header {
        font-weight: bold;
        margin-bottom: 10px;
        color: #333;
    }

    .alert {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        margin-bottom: 5px;
        border-radius: 4px;
        font-size: 0.9em;
    }

    .alert-critical {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }

    .alert-warning {
        background: #fff3cd;
        color: #856404;
        border: 1px solid #ffeaa7;
    }

    .alert-message {
        flex: 1;
    }

    .alert-server {
        font-weight: bold;
        font-size: 0.8em;
    }

    .servers-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 15px;
        margin-bottom: 20px;
    }

    .server-card {
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        padding: 15px;
        background: #fafafa;
    }

    .server-card.running.healthy {
        border-left: 4px solid #28a745;
        background: #f8fff8;
    }

    .server-card.running.warning {
        border-left: 4px solid #ffc107;
        background: #fffef8;
    }

    .server-card.running.critical {
        border-left: 4px solid #dc3545;
        background: #fff8f8;
    }

    .server-card.stopped {
        border-left: 4px solid #6c757d;
        background: #f8f9fa;
    }

    .server-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }

    .server-status {
        font-weight: bold;
        font-size: 0.9em;
    }

    .server-type {
        font-size: 0.8em;
        color: #666;
        background: #e9ecef;
        padding: 2px 8px;
        border-radius: 10px;
    }

    .server-name {
        font-size: 0.85em;
        color: #333;
        margin-bottom: 10px;
        font-weight: 500;
    }

    .server-metrics .metric {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
    }

    .metric-label {
        font-size: 0.8em;
        color: #666;
        width: 30px;
    }

    .metric-bar {
        flex: 1;
        height: 6px;
        background: #e0e0e0;
        border-radius: 3px;
        overflow: hidden;
    }

    .metric-fill {
        height: 100%;
        transition: width 0.3s ease;
    }

    .metric-fill.cpu {
        background: linear-gradient(90deg, #28a745 0%, #ffc107 70%, #dc3545 100%);
    }

    .metric-fill.memory {
        background: linear-gradient(90deg, #17a2b8 0%, #ffc107 70%, #dc3545 100%);
    }

    .metric-value {
        font-size: 0.8em;
        color: #333;
        width: 40px;
        text-align: right;
    }

    .server-health {
        font-size: 0.85em;
        font-weight: bold;
        margin: 8px 0 4px 0;
    }

    .server-uptime {
        font-size: 0.8em;
        color: #666;
    }

    .server-offline {
        text-align: center;
        color: #666;
        font-style: italic;
        padding: 20px 0;
    }

    .monitor-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 15px;
        border-top: 1px solid #e0e0e0;
        font-size: 0.9em;
        color: #666;
    }

    .offline-message {
        text-align: center;
        padding: 40px 20px;
        color: #666;
    }

    .offline-message p {
        margin-bottom: 10px;
    }

    .loading, .no-data {
        text-align: center;
        color: #666;
        font-style: italic;
        padding: 40px 20px;
    }

    .btn {
        background: #007bff;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9em;
    }

    .btn:hover {
        background: #0056b3;
    }

    .btn:disabled {
        background: #6c757d;
        cursor: not-allowed;
    }

    .btn-sm {
        padding: 4px 8px;
        font-size: 0.8em;
    }
`;

// Add CSS to page
if (!document.getElementById('game-monitor-styles')) {
    const style = document.createElement('style');
    style.id = 'game-monitor-styles';
    style.textContent = monitorCSS;
    document.head.appendChild(style);
}

// Global instance
let gameMonitor;

// Initialize when DOM is ready
function initializeGameMonitor() {
    if (!gameMonitor) {
        gameMonitor = new GameServerMonitor();
        gameMonitor.initialize();
        
        // Add tab activation listener
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            if (button.getAttribute('data-tab') === 'game-servers') {
                button.addEventListener('click', () => {
                    // Load data when tab becomes active
                    setTimeout(() => {
                        if (gameMonitor && gameMonitor.isConnected) {
                            gameMonitor.loadServerData();
                        }
                    }, 100);
                });
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGameMonitor);
} else {
    // DOM already loaded
    initializeGameMonitor();
}