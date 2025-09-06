# Changelog

All notable changes to this project will be documented in this file.

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
