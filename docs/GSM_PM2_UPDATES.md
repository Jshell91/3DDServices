# 📊 GSM Backend - Actualizaciones PM2

## ✅ Funciones Añadidas/Modificadas

### 🔧 **Nuevas Funciones PM2:**

1. **`getPM2ProcessInfo(pm2AppName)`** 
   - Obtiene información detallada del proceso desde PM2
   - Retorna: PID, estado, CPU, memoria, reiniciós, uptime
   - Incluye flag `pm2_managed: true`

2. **`getPM2Logs(pm2AppName, lines)`**
   - Obtiene logs específicos de PM2 para la aplicación
   - Fallback automático a logs legacy si PM2 falla

3. **`checkServerStatus(port)`**
   - Función mejorada que combina verificación de puerto + PM2
   - Retorna estado completo: puerto activo, PM2 status, nombre app

4. **`executeServerControl(port, action)`**
   - Ejecuta comandos PM2 reales (start/stop/restart)
   - Maneja ecosystem.config.js automáticamente
   - Verifica estado post-acción

### 🔄 **Funciones Actualizadas:**

1. **`getProcessInfo(port)`**
   - Ahora intenta PM2 primero, fallback a pgrep
   - Retorna flag `pm2_managed` para identificar origen

2. **`getRecentLogs(port, lines)`**
   - Intenta PM2 logs primero, fallback a archivos legacy
   - Soporte transparente para ambos sistemas

3. **`checkAllServers()`**
   - Usa `checkServerStatus()` para información completa
   - Incluye métricas PM2 en la respuesta
   - Añade campos: `pm2_managed`, `pm2_status`, `pm2_name`

### 🎯 **Endpoints Mejorados:**

#### **GET /servers/status** 
```json
{
  "servers": {
    "8080": {
      "port": 8080,
      "name": "01_MAINWORLD",
      "status": "running",
      "pm2_managed": true,
      "pm2_status": "online", 
      "pm2_name": "unreal-01-mainworld",
      "process": {
        "pid": 12345,
        "cpu": 45.2,
        "memory": 1024,
        "pm2_managed": true,
        "restarts": 0
      }
    }
  }
}
```

#### **GET /servers/:port/health**
```json
{
  "server": {
    "port": 8080,
    "status": "running",
    "pm2_managed": true,
    "pm2_status": "online",
    "pm2_name": "unreal-01-mainworld",
    "process": {
      "pid": 12345,
      "cpu": 45.2,
      "memory": 1024,
      "pm2_managed": true
    }
  }
}
```

#### **POST /servers/:port/control** (NUEVO)
```json
{
  "ok": true,
  "action": "restart",
  "port": 8080,
  "pm2_app": "unreal-01-mainworld",
  "pm2_status": "online", 
  "pid": 12345,
  "execution_details": {
    "command": "pm2 restart unreal-01-mainworld",
    "output": "Process restarted successfully"
  }
}
```

## 🚀 **Funcionalidades Mejoradas:**

### 📊 **Monitoreo Híbrido:**
- **PM2 disponible**: Usa métricas PM2 (más precisas)
- **PM2 no disponible**: Fallback automático a sistema legacy
- **Sin interrupciones**: Transición transparente

### 🎮 **Control Real:**
- **Antes**: Solo simulación
- **Ahora**: Comandos PM2 reales
- **Seguridad**: Validación de puertos y aplicaciones
- **Fallback**: Mensaje de error si PM2 falla

### 📈 **Métricas Mejoradas:**
- **CPU/Memoria**: Directamente desde PM2 (más precisas)
- **Estado**: `online/stopped/errored/stopping`
- **Reinicializaciones**: Contador automático PM2
- **Uptime**: Tiempo exacto desde PM2

### 📋 **Logs Unificados:**
- **PM2**: `pm2 logs app-name --lines N`
- **Legacy**: `tail -n N server-port.log`
- **Automático**: Detección y fallback transparente

## 🔧 **Configuración Cargada:**

Al arrancar, el GSM ahora carga:

1. **server-config.json**: Mapeo puerto → PM2 app name
2. **Verificación PM2**: Checa si PM2 está disponible
3. **Logs mejorados**: Muestra configuración PM2 en startup

```bash
🎮 Game Server Manager API - Phase 2 (Health Monitoring + PM2 Control)
🚀 Server running on port 3001
📊 Monitoring 9 Unreal servers
🔧 PM2 Integration: ✅ Available
⚙️  PM2 Configuration: 9 servers configured  
📁 PM2 Ecosystem: ./ecosystem.config.js
```

## 💡 **Beneficios del Sistema Híbrido:**

1. **Compatibilidad**: Funciona con screen existente o PM2 nuevo
2. **Migración gradual**: No requiere parar todo para migrar
3. **Mejor información**: Métricas más precisas con PM2
4. **Control real**: Start/stop/restart funcionan de verdad
5. **Fallback robusto**: Nunca falla completamente

## 🎯 **Próximo Paso:**

Una vez que deploys el GSM actualizado y migres a PM2, tendrás:

- ✅ **Dashboard control** con botones funcionando
- ✅ **Monitoreo mejorado** con métricas PM2  
- ✅ **Control real** desde interfaz web
- ✅ **Logs centralizados** y rotación automática
- ✅ **Auto-restart** y gestión robusta de procesos

¿Listo para hacer el deploy del GSM actualizado al servidor?