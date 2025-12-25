# Project Improvement Ideas

## ✅ Implemented (November 2025)
- **🎮 Game Server Manager Phase 1**: Real-time monitoring of Unreal dedicated servers
  - Health monitoring for 8 servers (ports 8080-8091)
  - Ubuntu system metrics (CPU, Memory, Disk, Uptime)
  - Dashboard integration with security (API Key + IP Whitelist)
  - Environment variables configuration (.env)
  - Complete documentation and deployment guides

## 🔄 In Progress / Planned

### Game Server Manager Phase 2 (High Priority)
- **Server Control Operations**: Remote start/stop/restart of Unreal servers ✅ **Implemented (Nov 2025)**
- **Advanced Analytics**: Historical metrics, performance graphs, trend analysis
- **Smart Alerts**: Email/Slack/webhook notifications for server issues
- **Auto-recovery**: Automatic restart of failed servers
- **Configuration Management**: Dynamic server configuration updates
- **Performance Optimization**: Auto-scaling based on player count

### Game Server Manager - Pending Features (Next Sprint)
- **🪵 Server Logs Viewer**: 
  - Add proxy endpoint `/api/dashboard/gsm/servers/:port/logs` in api/index.js
  - Enable real-time log viewing from dashboard (currently shows placeholder)
  - Support log filtering, search, and tail functionality
  
- **🔄 Manual Refresh Controls**:
  - Add `refreshData()` function for manual dashboard refresh
  - Implement `clearCache()` for forced cache invalidation
  - Add refresh button with loading states
  
- **📊 Individual Server Health**:
  - `getServerHealth(port)` for detailed server diagnostics
  - Enhanced health metrics and recommendations
  - Server-specific performance insights
  
- **🖥️ System Metrics Integration**:
  - `getSystemMetrics()` for real-time Ubuntu server stats
  - CPU/Memory/Disk usage trends and alerts
  - Integration with dashboard system metrics panel

## 💡 Future Ideas

1. Web admin panel for stats, likes, users, and logs.
2. Notifications/webhooks for events (email, Discord, Slack).
3. User authentication system (OAuth, JWT).
4. Activity history and analytics (graphs, daily likes, active users).
5. Automated tests and CI/CD integration.
6. Interactive API documentation (Swagger/OpenAPI).
7. Internationalization (multi-language support).
8. ~~Monitoring and alerts (Prometheus, Grafana, cloud services).~~ ✅ **Implemented with GSM**
9. Advanced security audit and access control.
10. Containerized deployment (Docker, Kubernetes, cloud).

11. Build output housekeeping (ideas, not yet implemented):
	- Add `-Clean` switch to remove previous outputs (WindowsClient/WindowsServer/LinuxServer) before a new build.
	- Add `-PurgeOlderThan <days>` or `-KeepLast <N>` to automatically prune old builds and save disk space.
	- Optional archive rotation strategy with size cap for `ArchiveDir`.
