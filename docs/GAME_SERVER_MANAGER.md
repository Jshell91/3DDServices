# Game Server Manager - Documentación Completa

## 📋 Índice
1. [Resumen General](#resumen-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Configuración de Seguridad](#configuración-de-seguridad)
4. [Instalación y Despliegue](#instalación-y-despliegue)
5. [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
6. [Operación y Mantenimiento](#operación-y-mantenimiento)
7. [API Reference](#api-reference)
8. [Troubleshooting](#troubleshooting)
9. [Roadmap Phase 2](#roadmap-phase-2)

---

## 🎮 Resumen General

El **Game Server Manager (GSM)** es un sistema de monitoreo en tiempo real para servidores dedicados de Unreal Engine. Implementado en **Phase 1: Health Monitoring**, proporciona supervisión completa del estado de los servidores y métricas del sistema.

### Características Principales
- ✅ Monitoreo de 8 servidores Unreal dedicados
- ✅ Métricas del sistema Ubuntu (CPU, RAM, Disco, Uptime)
- ✅ Dashboard web integrado con actualización automática
- ✅ Seguridad de doble capa (API Key + IP Whitelist)
- ✅ Configuración mediante variables de entorno
- ✅ Alertas automáticas por problemas de salud
- ✅ Caché inteligente (5 minutos) para optimizar recursos

---

## 🏗️ Arquitectura del Sistema

### Componentes del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                     ARQUITECTURA GSM                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🖥️ Servidor API (157.230.112.247:3000)                    │
│  ├── Dashboard Web Interface                               │
│  ├── Frontend JavaScript (game-server-monitor.js)         │
│  └── Integración con GSM API                              │
│                                                             │
│  🎮 Servidor de Juegos (217.154.124.154)                   │
│  ├── Game Server Manager API (:3001)                      │
│  ├── 8x Servidores Unreal (puertos 8080-8091)             │
│  ├── Monitoreo del Sistema Ubuntu                         │
│  └── Logs y Métricas                                      │
│                                                             │
│  🔒 Seguridad                                               │
│  ├── API Key Authentication                               │
│  ├── IP Whitelist                                         │
│  └── Variables de Entorno (.env)                          │
└─────────────────────────────────────────────────────────────┘
```

### Servidores Monitoreados

| Puerto | Nombre del Servidor | Tipo | Estado |
|--------|-------------------|------|--------|
| 8080 | 01_MAINWORLD | main | 🟢 Monitoreado |
| 8081 | ART_EXHIBITIONSARTLOBBY | exhibition | 🟢 Monitoreado |
| 8082 | ART_EXHIBITIONS_AIArtists | exhibition | 🟢 Monitoreado |
| 8083 | ART_EXHIBITIONS_STRANGEWORLDS_ | exhibition | 🟢 Monitoreado |
| 8086 | ART_Halloween2025_MULTIPLAYER | seasonal | 🟢 Monitoreado |
| 8087 | ART_JULIENVALLETakaBYJULES | artist | 🟢 Monitoreado |
| 8090 | SKYNOVAbyNOVA | artist | 🟢 Monitoreado |
| 8091 | MALL_DOWNTOWNCITYMALL | social | 🟢 Monitoreado |

---

## 🔒 Configuración de Seguridad

### Autenticación por API Key
```bash
# Métodos de autenticación soportados:
Header: X-API-Key: GSM_PROD_2025_9kL3mN8pQ7vR2xZ5wA4tY6uI1oE0
Query:  ?apikey=GSM_PROD_2025_9kL3mN8pQ7vR2xZ5wA4tY6uI1oE0
Bearer: Authorization: Bearer GSM_PROD_2025_9kL3mN8pQ7vR2xZ5wA4tY6uI1oE0
```

### IP Whitelist Autorizada
- `127.0.0.1` - Localhost
- `::1` - IPv6 localhost
- `157.230.112.247` - Servidor API principal
- `217.154.124.154` - Servidor de juegos (self)
- `92.191.152.245` - IP del desarrollador

### Endpoints Públicos (Sin Autenticación)
- `GET /health` - Health check del API

---

## 🚀 Instalación y Despliegue

### Requisitos Previos
```bash
# En el servidor de juegos (217.154.124.154)
node >= 18.x
npm >= 8.x
screen
curl
jq (opcional, para testing)
```

### Estructura de Archivos
```
~/ServerMonitor/
├── game-server-monitor.js          # Backend API
├── .env                           # Variables de entorno (NO commitear)
├── .env.example                   # Template de configuración
├── package.json                   # Dependencias Node.js
└── logs/                          # Directorio de logs
```

### Instalación Paso a Paso

#### 1. Preparar el entorno
```bash
ssh jota@217.154.124.154
cd ~/ServerMonitor
npm install express cors dotenv
```

#### 2. Configurar variables de entorno
```bash
cp .env.example .env
nano .env  # Editar con configuración específica
```

#### 3. Desplegar el servicio
```bash
# Copiar archivos desde desarrollo
scp E:/3DDServices/servers/game-server-monitor.js jota@217.154.124.154:~/ServerMonitor/
scp E:/3DDServices/servers/.env jota@217.154.124.154:~/ServerMonitor/

# Lanzar con screen
ssh jota@217.154.124.154
cd ~/ServerMonitor
screen -S monitor-api -dm node game-server-monitor.js
```

#### 4. Verificar instalación
```bash
screen -list
netstat -tlnp | grep :3001
curl -s http://localhost:3001/health | jq .
```

---

## ⚙️ Configuración de Variables de Entorno

### Archivo .env (Producción)
```bash
# API Configuration
GSM_PORT=3001
GSM_API_KEY=GSM_PROD_2025_9kL3mN8pQ7vR2xZ5wA4tY6uI1oE0

# Security Configuration
GSM_ALLOWED_IPS=127.0.0.1,::1,157.230.112.247,217.154.124.154,92.191.152.245

# Monitoring Configuration  
GSM_CHECK_INTERVAL=30000      # 30 segundos entre checks
GSM_CACHE_DURATION=300000     # 5 minutos de caché

# Logging
GSM_LOG_LEVEL=info
GSM_LOG_DIR=./logs
```

### Variables Disponibles

| Variable | Descripción | Valor por Defecto | Ejemplo |
|----------|-------------|-------------------|---------|
| `GSM_PORT` | Puerto del API | `3001` | `3001` |
| `GSM_API_KEY` | Clave de autenticación | `gsm_dev_key_2025_change_me` | `GSM_PROD_2025_xyz` |
| `GSM_ALLOWED_IPS` | IPs autorizadas (separadas por comas) | Lista hardcodeada | `1.1.1.1,2.2.2.2` |
| `GSM_CHECK_INTERVAL` | Intervalo de verificación (ms) | `30000` | `30000` |
| `GSM_CACHE_DURATION` | Duración del caché (ms) | `300000` | `300000` |
| `GSM_LOG_LEVEL` | Nivel de logging | `info` | `debug`, `info`, `error` |
| `GSM_LOG_DIR` | Directorio de logs | `./logs` | `/var/log/gsm` |

---

## 🔧 Operación y Mantenimiento

### Comandos de Screen
```bash
# Listar sesiones
screen -list

# Conectar a la sesión del monitor
screen -r monitor-api

# Salir sin cerrar (desde dentro de screen)
Ctrl+A, luego D

# Matar sesión
screen -S monitor-api -X quit
```

### Reiniciar el Servicio
```bash
ssh jota@217.154.124.154
screen -S monitor-api -X quit
cd ~/ServerMonitor
screen -S monitor-api -dm node game-server-monitor.js
```

### Verificación de Estado
```bash
# Estado del servicio
netstat -tlnp | grep :3001

# Health check
curl -s http://localhost:3001/health | jq .

# Test con autenticación
curl -s -H "X-API-Key: GSM_PROD_2025_9kL3mN8pQ7vR2xZ5wA4tY6uI1oE0" \
  http://localhost:3001/dashboard/summary | jq .ok
```

### Monitoreo de Logs
```bash
# Ver logs del sistema
journalctl -f -u your_service_name

# Ver logs del screen
screen -r monitor-api  # Luego Ctrl+A, D para salir
```

### Actualización del Frontend
```bash
# Copiar archivo actualizado al servidor del dashboard
scp E:/3DDServices/api/public/game-server-monitor.js \
  root@157.230.112.247:/path/to/dashboard/public/

# Limpiar caché del navegador: Ctrl+Shift+R
```

---

## 📡 API Reference

### Endpoints Disponibles

#### `GET /health` (Público)
**Descripción**: Health check del servicio  
**Autenticación**: No requerida  
**Response**:
```json
{
  "ok": true,
  "service": "Game Server Manager",
  "version": "1.0.0-phase1",
  "phase": "Health Monitoring Only",
  "uptime": 1234.567,
  "timestamp": "2025-11-09T00:00:00.000Z"
}
```

#### `GET /servers/status` (Protegido)
**Descripción**: Estado de todos los servidores  
**Autenticación**: API Key requerida  
**Headers**: `X-API-Key: GSM_PROD_2025_9kL3mN8pQ7vR2xZ5wA4tY6uI1oE0`  
**Response**:
```json
{
  "ok": true,
  "servers": [
    {
      "port": 8080,
      "name": "01_MAINWORLD",
      "type": "main",
      "status": "running",
      "pid": 12345,
      "cpu": 15.2,
      "memory": 45.8,
      "uptime": "2d 4h 30m",
      "healthLevel": "healthy",
      "healthScore": 95
    }
  ],
  "summary": {
    "total": 8,
    "running": 7,
    "stopped": 1,
    "healthy": 6
  }
}
```

#### `GET /servers/:port/health` (Protegido)
**Descripción**: Estado específico de un servidor  
**Parámetros**: `:port` - Puerto del servidor (ej: 8080)  
**Response**:
```json
{
  "ok": true,
  "server": {
    "port": 8080,
    "name": "01_MAINWORLD",
    "status": "running",
    "healthLevel": "healthy",
    "metrics": { /* ... */ }
  }
}
```

#### `GET /servers/:port/logs` (Protegido)
**Descripción**: Logs recientes de un servidor  
**Parámetros**: `:port` - Puerto del servidor  
**Query**: `?lines=100` - Número de líneas (default: 50)  
**Response**:
```json
{
  "ok": true,
  "logs": [
    "2025-11-09 00:00:00 [INFO] Server started",
    "2025-11-09 00:00:01 [INFO] Listening on port 8080"
  ],
  "totalLines": 150
}
```

#### `GET /system/metrics` (Protegido)
**Descripción**: Métricas del sistema Ubuntu  
**Response**:
```json
{
  "ok": true,
  "systemMetrics": {
    "cpu": 12.5,
    "loadAverage": 0.85,
    "memory": {
      "percent": 67.2,
      "usedMB": 5432,
      "totalMB": 8192
    },
    "disk": 6,
    "uptime": "15 days, 4:30"
  },
  "timestamp": "2025-11-09T00:00:00.000Z"
}
```

#### `GET /dashboard/summary` (Protegido)
**Descripción**: Datos optimizados para el dashboard  
**Response**: Combina todos los datos anteriores en un formato optimizado

### Códigos de Error

| Código | Descripción | Causa |
|--------|-------------|-------|
| `401` | Unauthorized | API Key inválida o faltante |
| `403` | Forbidden | IP no autorizada |
| `404` | Not Found | Endpoint o servidor no encontrado |
| `500` | Internal Server Error | Error interno del servidor |

---

## 🔍 Troubleshooting

### Problemas Comunes

#### 1. "Authentication required: API key missing"
**Síntomas**: Error 401 en el dashboard  
**Causas**:
- Frontend usando API key antigua
- Caché del navegador
- API key no sincronizada

**Soluciones**:
```bash
# Verificar API key del backend
ssh jota@217.154.124.154 "grep GSM_API_KEY ~/ServerMonitor/.env"

# Limpiar caché del navegador
Ctrl+Shift+R

# Verificar en consola del navegador
console.log('API Key:', gameMonitor.apiKey);
```

#### 2. "Connection refused" o "ERR_CONNECTION_REFUSED"
**Síntomas**: No puede conectar al puerto 3001  
**Causas**:
- Servicio no corriendo
- Puerto bloqueado por firewall
- Screen session terminada

**Soluciones**:
```bash
# Verificar servicio
netstat -tlnp | grep :3001

# Verificar screen
screen -list

# Reiniciar servicio
screen -S monitor-api -X quit
cd ~/ServerMonitor && screen -S monitor-api -dm node game-server-monitor.js
```

#### 3. "Forbidden: IP not allowed"
**Síntomas**: Error 403  
**Causas**:
- IP no está en whitelist
- IP pública cambió
- Configuración de .env incorrecta

**Soluciones**:
```bash
# Verificar IP actual
curl ipinfo.io/ip

# Actualizar .env
echo "GSM_ALLOWED_IPS=127.0.0.1,::1,157.230.112.247,217.154.124.154,TU_IP_AQUI" >> ~/ServerMonitor/.env

# Reiniciar servicio
```

#### 4. Datos desactualizados en el dashboard
**Síntomas**: Métricas no se actualizan  
**Causas**:
- Caché del sistema (5 minutos)
- Error en el backend
- Tab no visible (optimización)

**Soluciones**:
- Esperar 5 minutos o usar botón "Refresh"
- Verificar logs del backend
- Asegurar que la tab "Game Servers" esté activa

### Logs y Debugging

#### Habilitar modo debug
```bash
# En .env
GSM_LOG_LEVEL=debug

# Reiniciar servicio
screen -S monitor-api -X quit
cd ~/ServerMonitor && screen -S monitor-api -dm node game-server-monitor.js
```

#### Ver logs del frontend
```javascript
// En la consola del navegador (F12)
// Los logs aparecen con emojis:
// 🔑 Sending request with API Key: ...
// 🌐 Request URL: ...
// 📡 Response status: ...
// 📊 Response data: ...
```

#### Verificación manual completa
```bash
# 1. Health check
curl -s http://217.154.124.154:3001/health

# 2. Test sin auth (debe fallar)
curl -s http://217.154.124.154:3001/dashboard/summary

# 3. Test con auth (debe funcionar)
curl -s -H "X-API-Key: GSM_PROD_2025_9kL3mN8pQ7vR2xZ5wA4tY6uI1oE0" \
  http://217.154.124.154:3001/dashboard/summary | jq .ok
```

---

## 🚀 Roadmap Phase 2

### Funcionalidades Planificadas
- 🎯 **Control de Servidores**: Start/Stop/Restart remotos
- 📊 **Métricas Avanzadas**: Históricas, gráficos, tendencias  
- 🚨 **Alertas Inteligentes**: Email, Slack, webhooks
- 📱 **API Completa**: CRUD operations, configuración dinámica
- 🔄 **Auto-scaling**: Reinicio automático de servidores caídos
- 📈 **Dashboard Avanzado**: Gráficos en tiempo real, comparativas
- 🔐 **Autenticación Avanzada**: JWT, roles, permisos granulares
- 📝 **Audit Logs**: Registro de todas las acciones administrativas

### Arquitectura Phase 2
```
Phase 1 (Actual): Health Monitoring Only
Phase 2 (Futuro): Full Server Management + Advanced Analytics
Phase 3 (Visión): AI-Powered Auto-management
```

---

## 📞 Soporte y Contacto

### Mantenimiento
- **Desarrollador**: Sistema implementado en Noviembre 2025
- **Repositorio**: `3DDServices` - branch `feature/project-reorganization`
- **Documentación**: Este archivo + código comentado

### Cambios Importantes
- **API Key**: Cambiar periódicamente por seguridad
- **IP Whitelist**: Actualizar si cambian las IPs de acceso
- **Dependencias**: Revisar actualizaciones de Node.js y paquetes npm

### Backup y Recuperación
```bash
# Backup de configuración
scp jota@217.154.124.154:~/ServerMonitor/.env ./backups/gsm-env-$(date +%Y%m%d).bak

# Backup del código
scp jota@217.154.124.154:~/ServerMonitor/game-server-monitor.js ./backups/

# Restauración
scp ./backups/gsm-env-20251109.bak jota@217.154.124.154:~/ServerMonitor/.env
```

---

**📅 Documento actualizado**: Noviembre 2025  
**🔄 Versión**: 1.0.0 - Phase 1 Complete  
**✅ Estado**: Producción - Operativo  

---