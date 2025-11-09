# 3DDServices

A comprehensive Node.js web service for managing game analytics, maps, online sessions, and player interactions with PostgreSQL database integration. Now includes **Game Server Manager** for real-time monitoring of Unreal dedicated servers.

## 🚀 Main Features
- **REST API** with Express.js
- **Admin Dashboard** with authentication and maps management
- **🎮 Game Server Manager** - Real-time monitoring of Unreal dedicated servers *(New Nov 2025)*
- **Display Order Management** with drag & drop reordering
- **Real-time Online Maps** management
- **Player Analytics** and level tracking
- **Artwork Likes** system
- **Odin4Players Voice/Text Chat** integration
- **Security** with Helmet, CORS, and API Key authentication
- **PostgreSQL** database integration
- **Development tools** with auto-restart (nodemon)

## 📋 Table of Contents
1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Usage](#usage)
4. [🎮 Game Server Manager](#game-server-manager)
5. [Admin Dashboard](#admin-dashboard)
6. [API Endpoints](#api-endpoints)
7. [Database Schema](#database-schema)
8. [Development](#development)

## 🛠️ Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jshell91/3DDServices.git
   cd 3DDServices
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   Create a `.env` file with your configuration:
   ```env
   # API Key for authentication
   API_KEY=your-secure-api-key-here
   
   # Admin panel configuration
   ADMIN_PASSWORD=your-admin-password
   SESSION_SECRET=your-session-secret-key
   
   # PostgreSQL configuration
   PGHOST=your-postgres-host
   PGUSER=your-postgres-user
   PGPASSWORD=your-postgres-password
   PGDATABASE=your-postgres-database
   PGPORT=5432
   
   # Odin4Players configuration
   ODIN_ACCESS_KEY=your-odin-access-key
   ```

## ⚙️ Configuration

### Environment Variables
- `API_KEY`: Secure key for API authentication
- `ADMIN_PASSWORD`: Password for admin dashboard access
- `SESSION_SECRET`: Secret key for session management
- `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `PGPORT`: PostgreSQL connection details
- `ODIN_ACCESS_KEY`: Access key for Odin4Players voice/text chat integration

## 🚀 Usage

### Production
```bash
npm start
```

### Development (with auto-restart)
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## � Game Server Manager

**NEW November 2025**: Real-time monitoring system for Unreal dedicated servers.

### Features
- ✅ **8 Unreal Servers Monitored** - Real-time health tracking
- ✅ **Ubuntu System Metrics** - CPU, Memory, Disk, Uptime monitoring  
- ✅ **Security Layer** - API Key + IP Whitelist authentication
- ✅ **Dashboard Integration** - "Game Servers" tab in admin panel
- ✅ **Smart Caching** - 5-minute intervals for optimal performance
- ✅ **Environment Variables** - Secure configuration with .env

### Architecture
```
Dashboard (157.230.112.247:3000) ←→ Game Monitor API (217.154.124.154:3001)
                                        ↓
                              8x Unreal Servers (8080-8091)
```

### Monitored Servers
| Port | Server Name | Type |
|------|-------------|------|
| 8080 | 01_MAINWORLD | Main World |
| 8081 | ART_EXHIBITIONSARTLOBBY | Exhibition |
| 8082 | ART_EXHIBITIONS_AIArtists | Exhibition |
| 8083 | ART_EXHIBITIONS_STRANGEWORLDS_ | Exhibition |
| 8086 | ART_Halloween2025_MULTIPLAYER | Seasonal |
| 8087 | ART_JULIENVALLETakaBYJULES | Artist |
| 8090 | SKYNOVAbyNOVA | Artist |
| 8091 | MALL_DOWNTOWNCITYMALL | Social |

### Quick Access
- **📋 Full Documentation**: [`docs/GAME_SERVER_MANAGER.md`](docs/GAME_SERVER_MANAGER.md)
- **⚡ Quick Reference**: [`docs/GSM_QUICK_REFERENCE.md`](docs/GSM_QUICK_REFERENCE.md)  
- **🚀 Deployment Guide**: [`docs/GSM_DEPLOYMENT_GUIDE.md`](docs/GSM_DEPLOYMENT_GUIDE.md)

### Access the Monitor
1. Open dashboard: `http://localhost:3000` (or production URL)
2. Go to **"Game Servers"** tab
3. View real-time server status and system metrics

**Status**: ✅ **Phase 1 Complete** - Health Monitoring Operational

## �🎛️ Admin Dashboard

Access the admin dashboard at `http://localhost:3000/admin` or `http://localhost:3000/dashboard/login.html`

### Dashboard Features
- **📊 Statistics Overview**: Total visits, likes, maps, and online maps
- **👥 Players Tab**: View players by level with real-time data
- **❤️ Artwork Likes Tab**: Monitor artwork popularity
- **🗺️ Maps Tab**: Complete map management with display order control
- **🌐 Online Maps Tab**: View all online map sessions with status tracking
- **🟢 Open Maps Tab**: Filter to show only currently open maps
- **✏️ Map Editor**: Full modal editor for all map properties

### Maps Management Features
- **Display Order Control**: Manual input fields and full modal editing
- **Auto-increment Logic**: Automatic handling of duplicate orders
- **Real-time Updates**: Changes saved automatically
- **Comprehensive Editing**: All map properties in single modal

### Map Editor Fields
- **Display Order**: Controls map ordering (auto-handles duplicates)
- **Name*** (required): Display name of the map
- **Map Value*** (required): Internal map identifier (usually same as Name)
- **Game Name*** (required): Name as shown in-game
- **Code Map**: Optional code identifier
- **Max Players*** (required): Maximum players supported
- **Single Player**: Yes/No toggle
- **Online**: Yes/No toggle
- **Visible in Map Select**: Show in map selection
- **Views**: View count
- **Sponsor**: Sponsor name
- **Image URL**: Map thumbnail URL

### New Features (September 2025)
- **✨ Enhanced Map Creation**: Complete modal with all required fields
- **✨ Three-Field System**: `name`, `map`, and `name_in_game` for better data organization
- **✨ Improved Validation**: Frontend and backend validation for all required fields
- **✨ Production Ready**: Optimized logging and security configurations
- **✨ Updated Authentication**: Enhanced admin password security

## 🔌 API Endpoints



sudo -i -u 3ddAnalytics
