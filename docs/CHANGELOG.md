# Changelog

All notable changes to this project will be documented in this file.

## [4.1.0] - 2025-12-25

### ✨ NEW FEATURE: Drag & Drop Map Reordering
- **Interactive Drag & Drop**: Intuitive map reordering in admin dashboard using SortableJS
- **Visual Drag Handle**: Icon-based drag handle (⋮⋮) for clear interaction affordance
- **Optimized Updates**: Only affected maps are updated (not all), reducing server load
- **Toast Notifications**: User feedback with success/error messages that auto-dismiss
- **Loading State**: Visual feedback (opacity reduction + disabled interaction) during save
- **Row Highlighting**: Affected rows highlighted in green for 2 seconds post-reorder
- **Anti-spam Protection**: Prevents multiple simultaneous updates while saving

### 🔧 Improvements
- **Rate Limiting Enhancement**: Increased from 100 to 300 requests per 15 minutes
- **Admin Route Exemption**: `/admin` and `/dashboard` routes excluded from rate limiting
- **Sequential API Calls**: 50ms delay between requests to prevent server overload
- **New Endpoint**: `/admin/api/visits-by-date` for querying visit analytics by date

### 📊 Performance
- **Reduced API Calls**: Sequential updates instead of parallel (prevents rate limiting)
- **Optimized Database Updates**: Only changed rows are updated during reorder operations
- **Smooth Animations**: 150ms animation on drag with visual ghost element

### 🛠️ Technical Details
- **Frontend**: SortableJS 1.15.0 library integration
- **Backend**: Admin authentication required for map updates
- **Database**: Uses existing `display_order` column in `maps` table
- **Session-based Auth**: Uses admin session cookies (no API key needed for drag & drop)

### 📝 Documentation
- Updated dashboard features list
- Added drag & drop usage instructions to README
- New analytics endpoint documentation

## [4.0.0] - 2025-11-09

### 🎮 NEW MAJOR FEATURE: Game Server Manager
- **Real-time Server Monitoring**: Complete health monitoring for 8 Unreal dedicated servers
- **Ubuntu System Metrics**: CPU, Memory, Disk, Load Average, and Uptime tracking
- **Dashboard Integration**: New "Game Servers" tab in admin panel
- **Security Implementation**: 
  - API Key authentication with .env configuration
  - IP Whitelist for authorized access only
  - Dual-layer security (API Key + IP validation)
- **Smart Caching**: 5-minute intervals to optimize server resources
- **Production Architecture**: 
  - Backend API running on 217.154.124.154:3001
  - Frontend integrated in existing dashboard
  - Screen session management for background processes

### 🚀 Added
- **Game Server Monitor API**: Complete Node.js service with Express
- **System Metrics Collection**: Real-time Ubuntu server statistics
- **Frontend Integration**: JavaScript module for dashboard connectivity
- **Environment Variables**: Secure .env configuration system
- **Comprehensive Documentation**:
  - `GAME_SERVER_MANAGER.md` - Complete system documentation
  - `GSM_QUICK_REFERENCE.md` - Essential commands and troubleshooting
  - `GSM_DEPLOYMENT_GUIDE.md` - Installation and configuration guide

### 🔧 Architecture
- **Multi-server Setup**: API server (157.230.112.247) + Game server (217.154.124.154)
- **Monitored Ports**: 8080-8091 covering all Unreal server instances
- **Health Scoring**: Intelligent health assessment based on multiple metrics
- **Auto-retry Logic**: Automatic reconnection and error handling
- **Screen Session Management**: Background service with persistent monitoring

### 🛡️ Security
- **API Key Protection**: `GSM_PROD_2025_9kL3mN8pQ7vR2xZ5wA4tY6uI1oE0`
- **IP Whitelist**: Authorized IPs only (localhost, API server, game server, developer)
- **Public Endpoints**: Only `/health` accessible without authentication
- **Multiple Auth Methods**: Header, Query parameter, and Bearer token support

### 📊 Monitoring Capabilities
- **Server Status**: Running/Stopped state for each Unreal server
- **Performance Metrics**: Individual CPU and memory usage per server
- **System Overview**: Overall Ubuntu server performance
- **Health Levels**: Healthy/Warning/Critical status classification
- **Uptime Tracking**: Individual server and system uptime
- **Alert System**: Automatic problem detection and reporting

### 🎯 Status
- **Phase 1**: ✅ **COMPLETE** - Health Monitoring Operational
- **Phase 2**: 🔄 **PLANNED** - Server Control Operations (Start/Stop/Restart)

---

## [3.1.0] - 2025-09-06

### 🚀 Added
- **Enhanced Map Creation Modal**: Complete form with all required fields
- **Three-Field Map System**: 
  - `name`: Display name for the map
  - `map`: Internal map identifier (usually same as name)
  - `name_in_game`: Name as it appears in the game
- **Improved Field Validation**: Both frontend and backend validation
- **Production Logging**: Conditional logs (development vs production)
- **Enhanced Security**: Updated admin password requirements

### 🔧 Fixed
- **Map Value Field**: Now properly populates and saves in edit modal
- **Field Synchronization**: All three map fields correctly handled
- **Authentication Flow**: Resolved 401 errors with proper middleware ordering
- **Static File Serving**: Corrected path configuration for dashboard files

### 🛠️ Changed
- **Admin Password**: Enhanced with special characters for production
- **Session Secret**: Updated for production security
- **Log Levels**: Reduced verbosity in production environment
- **Code Cleanup**: Removed debug functions and temporary code

### 📝 Documentation
- **README.md**: Updated with new field descriptions
- **CHANGELOG.md**: Created comprehensive change tracking
- **API Documentation**: Enhanced field descriptions

## [3.0.0] - 2025-08-23

### 🚀 Added
- **Odin Voice Chat Integration**: POST endpoint with JSON body
- **API Key Authentication**: Enhanced security for Odin endpoints
- **Map Management Dashboard**: Complete CRUD operations
- **Display Order System**: Automatic ordering and management

### 🔧 Fixed
- **Odin Token Generation**: Migrated from GET to POST with validation
- **Error Handling**: Comprehensive error responses
- **Database Connections**: Stable PostgreSQL integration

## [2.0.0] - 2025-07-25

### 🚀 Added
- **Admin Dashboard**: Complete management interface
- **Authentication System**: Session-based admin login
- **Maps Management**: Full CRUD operations with display ordering
- **Online Maps Tracking**: Real-time session management

## [1.0.0] - 2025-06-01

### 🚀 Initial Release
- **Core API**: REST endpoints for maps, players, likes
- **PostgreSQL Integration**: Database connectivity and operations
- **Basic Security**: Helmet, CORS, rate limiting
- **Health Monitoring**: Basic server health checks
