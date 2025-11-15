#!/bin/bash

# 🔄 Migración de Screen a PM2 para Servidores Unreal
# ===================================================

echo "🔄 Migración de Screen a PM2"
echo "============================"

# Verificar que PM2 esté instalado
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 no está instalado."
    echo "📦 Instalando PM2..."
    npm install -g pm2
    if [ $? -ne 0 ]; then
        echo "❌ Error instalando PM2"
        exit 1
    fi
    echo "✅ PM2 instalado correctamente"
fi

echo ""
echo "📊 Estado actual de Screen:"
echo "----------------------------"
screen -ls | grep "unreal-server" || echo "No hay sesiones screen de unreal-server"

echo ""
echo "📊 Estado actual de PM2:"
echo "-------------------------"
pm2 status 2>/dev/null | head -20 || echo "PM2 no tiene procesos activos"

echo ""
read -r -p "¿Continuar con la migración? Esto parará todos los servidores screen [s/N]: " confirm
if [[ ! $confirm =~ ^[SsYy]$ ]]; then
    echo "🚫 Migración cancelada"
    exit 0
fi

echo ""
echo "🛑 Parando servidores Screen..."
echo "------------------------------"
# Parar todas las sesiones screen de unreal-server
for session in $(screen -ls 2>/dev/null | grep "unreal-server" | cut -d. -f1 | awk '{print $1}' || echo ""); do
    if [ -n "$session" ]; then
        echo "   Parando sesión: $session"
        screen -S "$session" -X quit 2>/dev/null || true
    fi
done

# Esperar un poco
sleep 3

echo "✅ Sesiones screen terminadas"

echo ""
echo "🚀 Iniciando servidores con PM2..."
echo "-----------------------------------"

# Verificar que existe el ecosystem.config.js
if [ ! -f "./ecosystem.config.js" ]; then
    echo "❌ No se encuentra ecosystem.config.js"
    exit 1
fi

# Crear directorio de logs
mkdir -p ./logs

# Iniciar con PM2
pm2 start ecosystem.config.js
if [ $? -ne 0 ]; then
    echo "❌ Error iniciando servidores con PM2"
    exit 1
fi

echo "✅ Servidores iniciados con PM2"

# Esperar un poco para que arranquen
echo ""
echo "⏳ Esperando arranque (10 segundos)..."
sleep 10

echo ""
echo "📊 Estado final:"
echo "=================="
pm2 status

echo ""
echo "🌐 Verificación de puertos:"
echo "---------------------------"
for port in 8080 8081 8082 8083 8084 8086 8087 8090 8091; do
    if ss -tlnp 2>/dev/null | grep -q ":$port "; then
        echo "✅ Puerto $port: ACTIVO"
    else
        echo "❌ Puerto $port: INACTIVO"
    fi
done

echo ""
echo "💾 Guardando configuración PM2..."
pm2 save
echo "✅ Configuración guardada"

echo ""
echo "🎉 ¡Migración completada!"
echo "========================"
echo ""
echo "💡 Comandos útiles PM2:"
echo "   pm2 status          - Ver estado de todos los procesos"
echo "   pm2 logs            - Ver logs en tiempo real"
echo "   pm2 restart all     - Reiniciar todos los servidores"
echo "   pm2 stop all        - Parar todos los servidores"
echo "   pm2 monit           - Monitor interactivo"
echo ""
echo "🔧 Para configurar auto-arranque en boot:"
echo "   pm2 startup"
echo "   # (seguir las instrucciones que aparezcan)"
echo ""
echo "📋 Archivo de configuración: ecosystem.config.js"
echo "🎮 Script de gestión mejorado: ./manage_unreal_pm2.sh"