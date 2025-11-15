# 🎮 Migración a PM2 - Resumen Completo
## Configuración de Gestión de Servidores Unreal

### 📋 Archivos Creados/Modificados

#### 1. `ecosystem.config.js` - Configuración PM2
- **Propósito**: Define las 9 instancias de servidores Unreal
- **Servidores configurados**:
  ```
  Puerto 8080: unreal-01-mainworld (01_MAINWORLD)
  Puerto 8081: unreal-art-lobby (ART_EXHIBITIONSARTLOBBY)
  Puerto 8082: unreal-art-aiartists (ART_EXHIBITIONS_AIArtists)
  Puerto 8083: unreal-art-strangeworlds (ART_EXHIBITIONS_STRANGEWORLDS_)
  Puerto 8084: unreal-art-4deya (ART_EXHIBITIONS_4Deya)
  Puerto 8086: unreal-art-halloween (ART_Halloween2025_MULTIPLAYER)
  Puerto 8087: unreal-art-julien (ART_JULIENVALLETakaBYJULES)
  Puerto 8090: unreal-skynova (SKYNOVAbyNOVA)
  Puerto 8091: unreal-mall-downtown (MALL_DOWNTOWNCITYMALL)
  ```

#### 2. `manage_unreal_pm2.sh` - Script de Gestión Mejorado
- **Reemplaza**: `manage_unreal_servers.sh` (basado en screen)
- **Funcionalidades**:
  - `start [all|port]` - Iniciar servidores
  - `stop [all|port]` - Parar servidores
  - `restart [all|port]` - Reiniciar servidores
  - `status` - Estado completo
  - `logs [port]` - Logs específicos o todos
  - `monit` - Monitor interactivo
  - `deploy` - Deploy automático
  - `health` - Health-checks
  - `install` - Instalar PM2
  - `setup` - Configurar auto-start

#### 3. `server-config.json` - Configuración de Mapeo
- **Propósito**: Mapea puertos a nombres PM2 y mapas Unreal
- **Usado por**: GSM backend para control via API

#### 4. `game-server-monitor.js` - GSM Backend Actualizado
- **Añadido**: Soporte PM2 real (no simulación)
- **Funciones PM2**:
  - `executeServerControl()` - Ejecuta comandos PM2
  - `getPM2AppName()` - Resuelve nombres de apps
  - `checkPM2Available()` - Verifica disponibilidad

#### 5. `migrate_to_pm2.sh` - Script de Migración
- **Propósito**: Migración segura de screen a PM2
- **Proceso**: Para screen → Inicia PM2 → Verifica

### 🚀 Ventajas de PM2 vs Screen

| Característica | Screen | PM2 |
|---|---|---|
| **Auto-restart** | ❌ Manual | ✅ Automático |
| **Logging** | ⚠️ Básico | ✅ Avanzado con rotación |
| **Monitoreo** | ❌ Limitado | ✅ CPU/RAM en tiempo real |
| **API Control** | ❌ Difícil | ✅ Integración nativa |
| **Clustering** | ❌ No | ✅ Load balancing |
| **Boot startup** | ⚠️ Manual | ✅ Auto-configuración |
| **Web Dashboard** | ❌ No | ✅ PM2 Plus disponible |
| **Health checks** | ❌ Manual | ✅ Automáticos |

### 📋 Plan de Migración

#### Paso 1: Preparación (Local)
```bash
# Verificar archivos creados
ls -la ecosystem.config.js server-config.json manage_unreal_pm2.sh migrate_to_pm2.sh

# Hacer scripts ejecutables (en Linux)
chmod +x manage_unreal_pm2.sh migrate_to_pm2.sh
```

#### Paso 2: Deploy al Servidor
```bash
# Subir archivos al servidor game server (217.154.124.154)
scp ecosystem.config.js server-config.json manage_unreal_pm2.sh migrate_to_pm2.sh game-server-monitor.js jota@217.154.124.154:/home/jota/LinuxServer/LinuxServer/

# SSH al servidor
ssh jota@217.154.124.154
cd /home/jota/LinuxServer/LinuxServer
```

#### Paso 3: Migración en Servidor
```bash
# Instalar PM2 si no existe
npm install -g pm2

# Ejecutar migración automática
./migrate_to_pm2.sh

# Verificar resultado
pm2 status
./manage_unreal_pm2.sh status
```

#### Paso 4: Actualizar GSM Backend
```bash
# Reiniciar el GSM para cargar PM2 support
pm2 restart game-server-monitor  # Si ya está en PM2
# O si está en screen:
screen -r gsm  # Ctrl+C para parar, luego:
node game-server-monitor.js
```

#### Paso 5: Configurar Auto-Start
```bash
# Configurar PM2 para arranque automático
pm2 startup
# Seguir instrucciones que aparezcan

# Guardar configuración actual
pm2 save
```

### 🧪 Testing del Sistema

#### Test 1: Control desde Dashboard
```bash
# Desde dashboard o máquina con acceso
curl -X POST http://217.154.124.154:3001/servers/8080/control \
  -H "X-API-Key: tu_api_key" \
  -H "Content-Type: application/json" \
  -d '{"action": "restart"}'
```

#### Test 2: Gestión Local
```bash
# En el servidor
./manage_unreal_pm2.sh restart 8081
./manage_unreal_pm2.sh logs 8082
./manage_unreal_pm2.sh health
```

#### Test 3: Monitoreo
```bash
pm2 monit          # Monitor interactivo
pm2 logs --lines 50 # Logs recientes
pm2 show unreal-01-mainworld  # Detalles específicos
```

### 🔒 Integración con Dashboard

El dashboard ya tiene los botones de control. Una vez migrado a PM2:

1. **GSM backend** usará PM2 en lugar de simulación
2. **Dashboard proxy** funcionará igual (no cambios necesarios)
3. **Control real** de start/stop/restart desde interfaz web

### 📊 Monitoreo Mejorado

Con PM2 tendrás:
- **Logs centralizados** con rotación automática
- **Métricas en tiempo real** (CPU, RAM, uptime)
- **Alertas** por email/webhook (PM2 Plus)
- **Health checks** automáticos con restart
- **Zero-downtime deployments**

### 🔧 Comandos Útiles Post-Migración

```bash
# Gestión diaria
pm2 status                    # Estado general
pm2 logs --lines 100         # Logs recientes
pm2 restart all              # Restart de todos
./manage_unreal_pm2.sh health # Health-check completo

# Deploy
./manage_unreal_pm2.sh deploy ./LinuxServer -y

# Troubleshooting
pm2 describe unreal-01-mainworld  # Detalles proceso
pm2 flush                         # Limpiar logs
pm2 reload ecosystem.config.js    # Recargar config
```

¿Quieres que procedamos con el deploy de estos archivos al servidor para hacer la migración?