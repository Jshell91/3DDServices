# 🎮 Game Server Manager - Configuración de Despliegue

## Checklist de Instalación

### ✅ Pre-requisitos
- [ ] Node.js >= 18.x instalado
- [ ] npm actualizado  
- [ ] Usuario con acceso SSH
- [ ] Screen instalado
- [ ] Puertos 3001 abierto

### ✅ Archivos Requeridos
- [ ] `game-server-monitor.js` (backend)
- [ ] `.env` (configuración)
- [ ] `package.json` (dependencias)
- [ ] `game-server-monitor.js` (frontend - para dashboard)

### ✅ Variables de Entorno (.env)
```bash
GSM_PORT=3001
GSM_API_KEY=CAMBIAR_POR_KEY_SEGURA
GSM_ALLOWED_IPS=127.0.0.1,::1,IP_API_SERVER,IP_GAME_SERVER,IP_DEV
GSM_CHECK_INTERVAL=30000
GSM_CACHE_DURATION=300000
GSM_LOG_LEVEL=info
GSM_LOG_DIR=./logs
```

### ✅ Pasos de Instalación
1. [ ] Copiar archivos al servidor
2. [ ] Instalar dependencias: `npm install express cors dotenv`
3. [ ] Configurar .env con valores específicos
4. [ ] Lanzar con screen: `screen -S monitor-api -dm node game-server-monitor.js`
5. [ ] Verificar funcionamiento: health check + test con API key
6. [ ] Actualizar frontend en servidor dashboard
7. [ ] Probar dashboard web completo

### ✅ Post-instalación
- [ ] Documentar credenciales de forma segura
- [ ] Configurar backup de .env
- [ ] Verificar logs funcionando
- [ ] Test desde múltiples IPs
- [ ] Programar mantenimiento regular

## Comandos de Verificación

```bash
# 1. Estado del servicio
screen -list
netstat -tlnp | grep :3001

# 2. Health check
curl -s http://localhost:3001/health | jq .

# 3. Test autenticación  
curl -s -H "X-API-Key: TU_API_KEY" http://localhost:3001/dashboard/summary | jq .ok

# 4. Test sin autenticación (debe fallar)
curl -s http://localhost:3001/dashboard/summary

# 5. Verificar logs
screen -r monitor-api  # Ctrl+A, D para salir
```

## Configuraciones por Entorno

### Desarrollo
```bash
GSM_API_KEY=gsm_dev_key_2025_change_me
GSM_ALLOWED_IPS=127.0.0.1,::1,localhost
GSM_LOG_LEVEL=debug
```

### Producción
```bash
GSM_API_KEY=GSM_PROD_2025_SECURE_KEY_HERE
GSM_ALLOWED_IPS=IP1,IP2,IP3
GSM_LOG_LEVEL=info
```

### Testing
```bash
GSM_API_KEY=gsm_test_key_temp
GSM_ALLOWED_IPS=127.0.0.1,TEST_IPS
GSM_LOG_LEVEL=debug
```

---
**Nota**: Nunca commitear archivos .env al repositorio