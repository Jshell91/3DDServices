# 🎮 Game Server Manager - Guía Rápida

## 🚀 Comandos Esenciales

### Estado del Servicio
```bash
ssh jota@217.154.124.154 "screen -list && netstat -tlnp | grep :3001"
```

### Reiniciar GSM
```bash
ssh jota@217.154.124.154 "screen -S monitor-api -X quit; cd ~/ServerMonitor && screen -S monitor-api -dm node game-server-monitor.js"
```

### Health Check
```bash
curl -s http://217.154.124.154:3001/health | jq .
```

### Test Completo
```bash
curl -s -H "X-API-Key: GSM_PROD_2025_9kL3mN8pQ7vR2xZ5wA4tY6uI1oE0" http://217.154.124.154:3001/dashboard/summary | jq .ok
```

## 🔑 Credenciales Actuales
- **API Key**: `GSM_PROD_2025_9kL3mN8pQ7vR2xZ5wA4tY6uI1oE0`
- **Puerto**: `3001`
- **IPs Autorizadas**: `92.191.152.245, 157.230.112.247, 217.154.124.154`

## 📁 Archivos Importantes
- **Backend**: `~/ServerMonitor/game-server-monitor.js`
- **Config**: `~/ServerMonitor/.env` 
- **Frontend**: `/path/to/dashboard/public/game-server-monitor.js`
- **Docs**: `E:/3DDServices/docs/GAME_SERVER_MANAGER.md`

## 🔧 Solución de Problemas
1. **Error 401**: Verificar API key y limpiar caché navegador (Ctrl+Shift+R)
2. **Connection refused**: Verificar que el servicio esté corriendo
3. **Error 403**: Verificar IP en whitelist
4. **Datos viejos**: Esperar 5min o usar botón Refresh

## 📊 Servidores Monitoreados
- **8080**: 01_MAINWORLD (main)
- **8081**: ART_EXHIBITIONSARTLOBBY (exhibition)  
- **8082**: ART_EXHIBITIONS_AIArtists (exhibition)
- **8083**: ART_EXHIBITIONS_STRANGEWORLDS_ (exhibition)
- **8086**: ART_Halloween2025_MULTIPLAYER (seasonal)
- **8087**: ART_JULIENVALLETakaBYJULES (artist)
- **8090**: SKYNOVAbyNOVA (artist)
- **8091**: MALL_DOWNTOWNCITYMALL (social)

## 🌐 URLs
- **Dashboard**: `http://157.230.112.247:3000` (tab "Game Servers")
- **GSM API**: `http://217.154.124.154:3001`
- **Health**: `http://217.154.124.154:3001/health`

---
**Status**: ✅ Operativo | **Versión**: Phase 1 | **Fecha**: Nov 2025