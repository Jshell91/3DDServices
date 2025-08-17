# 3DDServices

A comprehensive Node.js web service for managing game analytics, maps, online sessions, and player interactions with PostgreSQL database integration.

## 🚀 Main Features
- **REST API** with Express.js
- **Admin Dashboard** with authentication and maps management
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
4. [Admin Dashboard](#admin-dashboard)
5. [API Endpoints](#api-endpoints)
6. [Database Schema](#database-schema)
7. [Development](#development)

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

## 🎛️ Admin Dashboard

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
- **Game Name*** (required): Name as shown in-game
- **Code Map**: Optional code identifier
- **Max Players*** (required): Maximum players supported
- **Single Player**: Yes/No toggle
- **Online**: Yes/No toggle
- **Visible in Map Select**: Show in map selection
- **Views**: View count
- **Sponsor**: Sponsor name
- **Image URL**: Map thumbnail URL

## 🔌 API Endpoints



sudo -i -u 3ddAnalytics
