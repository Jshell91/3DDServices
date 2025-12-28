# 🔔 Sistema de Alertas Telegram - GSM

## Descripción

Sistema de notificaciones automáticas vía Telegram que alerta cuando los servidores Unreal tienen problemas.

## ✅ Qué alertas recibirás

### 1. 🚨 Servidor Caído
Cuando un servidor pasa de `running` → `stopped`:
```
🚨 SERVIDOR CAÍDO 🚨

Servidor: 01_MAINWORLD
Puerto: 8080
Estado: stopped
Error: Connection timeout

Fecha: 28/12/2025 15:30:45

🔗 Ver Dashboard
```

### 2. ⚠️ Servidor No Saludable
Cuando un servidor está online pero con problemas (CPU/memoria alta):
```
⚠️ SERVIDOR NO SALUDABLE

Servidor: ART_EXHIBITIONSARTLOBBY
Puerto: 8081
Jugadores: 12/50

Fecha: 28/12/2025 15:35:20

ℹ️ El servidor está en línea pero puede tener problemas.

🔗 Ver Dashboard
```

### 3. ✅ Servidor Recuperado
Cuando un servidor vuelve a estar operativo:
```
✅ SERVIDOR RECUPERADO

Servidor: 01_MAINWORLD
Puerto: 8080
Estado: Online

Fecha: 28/12/2025 15:40:10

🎉 El servidor ha vuelto a estar operativo.

🔗 Ver Dashboard
```

---

## 📋 Configuración (Ya hecha para ti)

### Credenciales configuradas:
```dotenv
TELEGRAM_BOT_TOKEN=tu_bot_token_aqui
TELEGRAM_CHAT_ID=tu_chat_id_aqui
ALERT_COOLDOWN_MINUTES=15
```

**⚠️ IMPORTANTE:** Las credenciales reales están en `api/.env` y `servers/.env` (ambos en `.gitignore`).

NO expongas tus credenciales en ningún documento públicamente versionado.

### Bot de Telegram:
- **Nombre:** Tu bot (el que creaste con BotFather)
- **Username:** @tu_username_bot
- **Chat ID:** Tu ID de chat personal (número)

---

## 🚀 Cómo usar

### 1. Probar que funciona

```bash
# Conectarte al servidor GSM
ssh root@217.154.124.154

# Ejecutar test de alertas
curl -X POST http://localhost:3001/alerts/test \
  -H "X-API-Key: GSM_PROD_2025_9kL3mN8pQ7vR2xZ5wA4tY6uI1oE0"
```

Deberías recibir un mensaje de prueba en Telegram inmediatamente.

---

### 2. Funcionamiento automático

El sistema funciona **automáticamente** cada 30 segundos:
1. GSM revisa el estado de todos los servidores
2. Detecta cambios de estado (running → stopped, healthy → unhealthy, etc.)
3. Envía alerta a Telegram
4. Activa cooldown de 15 minutos para ese servidor (evita spam)

---

## 🛡️ Sistema Anti-Spam

**Cooldown de 15 minutos:**
- Si un servidor falla y se alerta, NO se enviará otra alerta del mismo servidor por 15 minutos
- Esto evita recibir cientos de mensajes si un servidor está intermitente
- Las alertas de "recuperado" siempre se envían (sin cooldown)

**Ejemplo:**
```
15:00 - Servidor caído → ALERTA ✅
15:05 - Servidor caído → (cooldown activo, no alerta)
15:10 - Servidor caído → (cooldown activo, no alerta)
15:16 - Servidor caído → ALERTA ✅ (pasaron 15 min)
```

---

## 🔧 Personalización

### Cambiar tiempo de cooldown

Edita `servers/.env`:
```dotenv
ALERT_COOLDOWN_MINUTES=30  # 30 minutos en vez de 15
```

### Añadir más destinatarios

**Opción 1: Grupo de Telegram**
1. Crea un grupo en Telegram
2. Añade el bot al grupo
3. Envía un mensaje en el grupo
4. Obtén el nuevo `CHAT_ID` (será negativo, ej: `-123456789`)
5. Actualiza `TELEGRAM_CHAT_ID=-123456789`

**Opción 2: Canal de Telegram**
1. Crea un canal público
2. Añade el bot como administrador
3. Obtén el `CHAT_ID` del canal
4. Actualiza la configuración

---

## 📊 Endpoints de la API

### POST /alerts/test
Envía una alerta de prueba.

```bash
curl -X POST http://217.154.124.154:3001/alerts/test \
  -H "X-API-Key: GSM_PROD_2025_9kL3mN8pQ7vR2xZ5wA4tY6uI1oE0"
```

**Respuesta:**
```json
{
  "ok": true,
  "message": "Test alert sent successfully",
  "telegram": {
    "configured": true,
    "cooldown_minutes": 15
  }
}
```

---

## 🐛 Solución de Problemas

### No recibo alertas

1. **Verifica que el bot esté configurado:**
```bash
curl http://217.154.124.154:3001/alerts/test \
  -H "X-API-Key: GSM_PROD_2025_9kL3mN8pQ7vR2xZ5wA4tY6uI1oE0"
```

2. **Verifica variables de entorno:**
```bash
ssh root@217.154.124.154
cd ~/3DDServices/servers
cat .env | grep TELEGRAM
```

3. **Revisa logs del GSM:**
```bash
pm2 logs game-server-manager --lines 50
```

Deberías ver:
```
✅ Telegram alert sent successfully
```

O si hay error:
```
❌ Failed to send Telegram alert: ...
```

### Recibo demasiadas alertas

Aumenta el cooldown en `servers/.env`:
```dotenv
ALERT_COOLDOWN_MINUTES=30
```

Luego reinicia:
```bash
pm2 restart game-server-manager
```

---

## 📝 Archivos modificados

- ✅ `servers/alerts.js` - Módulo de notificaciones Telegram
- ✅ `servers/game-server-monitor.js` - Integración de alertas
- ✅ `api/.env` - Credenciales de Telegram
- ✅ `api/.env.example` - Template actualizado
- ✅ `servers/.env.example` - Template actualizado

---

## 🚀 Próximos pasos

1. **Probar el sistema:**
```bash
curl -X POST http://217.154.124.154:3001/alerts/test \
  -H "X-API-Key: GSM_PROD_2025_9kL3mN8pQ7vR2xZ5wA4tY6uI1oE0"
```

2. **Hacer deploy:**
```bash
# Subir cambios a Git
git add .
git commit -m "feat: Add Telegram alerts system for GSM"
git push

# En el servidor GSM
ssh root@217.154.124.154
cd ~/3DDServices/servers
git pull
pm2 restart game-server-manager
pm2 logs game-server-manager
```

3. **Simular fallo (opcional):**
```bash
# Detener un servidor para probar alerta
pm2 stop unreal-01_mainworld-8080
# Esperar 30 segundos → Deberías recibir alerta
# Volver a iniciarlo
pm2 start unreal-01_mainworld-8080
# Deberías recibir alerta de recuperación
```

---

**Fecha:** 28/12/2025  
**Estado:** ✅ Completado y listo para deploy
