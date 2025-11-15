#!/bin/bash

# 🎮 Gestión de Servidores Unreal con PM2
# Reemplazo moderno del sistema screen
# ========================================

# ========================
# CONFIGURACIÓN
# ========================
ECOSYSTEM_CONFIG="./ecosystem.config.js"
LOG_DIR="./logs"
HEALTH_TIMEOUT=30
HEALTH_INTERVAL=2

# Deploy config (mismo que antes)
DEPLOY_SRC="${DEPLOY_SRC:-./LinuxServer}"
DEPLOY_USER="${DEPLOY_USER:-jota}"
DEPLOY_HOST="${DEPLOY_HOST:-217.154.124.154}"
DEPLOY_PATH="${DEPLOY_PATH:-/home/jota/LinuxServer/LinuxServer}"
DEPLOY_SSH_PORT="${DEPLOY_SSH_PORT:-22}"

# Mapeo de puertos a nombres de aplicaciones PM2
declare -A PORT_TO_APP=(
    ["8080"]="unreal-01-mainworld"
    ["8081"]="unreal-art-lobby"
    ["8082"]="unreal-art-aiartists"
    ["8083"]="unreal-art-strangeworlds"
    ["8084"]="unreal-art-4deya"
    ["8086"]="unreal-art-halloween"
    ["8087"]="unreal-art-julien"
    ["8090"]="unreal-skynova"
    ["8091"]="unreal-mall-downtown"
)

# Crear directorio de logs
mkdir -p "$LOG_DIR"

# ========================
# FUNCIONES
# ========================

show_help() {
    echo "🎮 Gestión de Servidores Unreal con PM2"
    echo "======================================="
    echo "Uso: $0 [comando] [opciones]"
    echo ""
    echo "📋 Comandos disponibles:"
    echo "  start [all|port]    - Iniciar todos los servidores o uno específico"
    echo "  stop [all|port]     - Parar todos los servidores o uno específico"
    echo "  restart [all|port]  - Reiniciar todos los servidores o uno específico"
    echo "  status              - Ver estado de todos los servidores"
    echo "  logs [port]         - Ver logs (todos o de puerto específico)"
    echo "  monit               - Abrir monitor interactivo PM2"
    echo "  install             - Instalar PM2 si no está disponible"
    echo "  setup               - Configurar PM2 para auto-start en boot"
    echo "  deploy [ruta] [-y]  - Deploy + restart automático"
    echo "  health [port]       - Health-check de puerto específico o todos"
    echo "  help                - Mostrar esta ayuda"
    echo ""
    echo "💡 Ejemplos:"
    echo "  $0 start all        - Iniciar todos los servidores"
    echo "  $0 start 8080       - Iniciar solo servidor puerto 8080"
    echo "  $0 logs 8081        - Ver logs del servidor puerto 8081"
    echo "  $0 restart 8090     - Reiniciar servidor puerto 8090"
    echo ""
    echo "🚀 Servidores configurados:"
    for port in "${!PORT_TO_APP[@]}"; do
        echo "  • Puerto $port: ${PORT_TO_APP[$port]}"
    done | sort -V
    echo ""
    echo "🔧 Configuración:"
    echo "  Ecosystem: $ECOSYSTEM_CONFIG"
    echo "  Logs: $LOG_DIR"
    echo "  Deploy: $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH"
}

check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        echo "❌ PM2 no está instalado."
        echo "💡 Usa: $0 install"
        return 1
    fi
    return 0
}

install_pm2() {
    echo "📦 Instalando PM2..."
    if command -v npm &> /dev/null; then
        npm install -g pm2
        echo "✅ PM2 instalado correctamente"
        echo "💡 Usa: $0 setup para configurar auto-start"
    else
        echo "❌ Node.js/npm no está disponible"
        echo "Instala Node.js primero: https://nodejs.org/"
        return 1
    fi
}

setup_pm2() {
    check_pm2 || return 1
    
    echo "⚙️  Configurando PM2 para auto-start..."
    pm2 startup
    echo ""
    echo "💡 Después de iniciar tus servidores, ejecuta:"
    echo "   pm2 save"
    echo "   para guardar la configuración actual"
}

get_app_name_by_port() {
    local port="$1"
    echo "${PORT_TO_APP[$port]:-}"
}

start_servers() {
    check_pm2 || return 1
    
    local target="${1:-all}"
    
    if [ "$target" = "all" ]; then
        echo "🚀 Iniciando todos los servidores Unreal con PM2..."
        pm2 start "$ECOSYSTEM_CONFIG"
        echo ""
        echo "💾 Guardando configuración PM2..."
        pm2 save
    else
        local app_name=$(get_app_name_by_port "$target")
        if [ -n "$app_name" ]; then
            echo "🚀 Iniciando servidor puerto $target ($app_name)..."
            pm2 start "$ECOSYSTEM_CONFIG" --only "$app_name"
        else
            echo "❌ Puerto $target no configurado"
            echo "Puertos disponibles: ${!PORT_TO_APP[@]}"
            return 1
        fi
    fi
    
    sleep 2
    show_status
}

stop_servers() {
    check_pm2 || return 1
    
    local target="${1:-all}"
    
    if [ "$target" = "all" ]; then
        echo "🛑 Parando todos los servidores..."
        pm2 stop all
    else
        local app_name=$(get_app_name_by_port "$target")
        if [ -n "$app_name" ]; then
            echo "🛑 Parando servidor puerto $target ($app_name)..."
            pm2 stop "$app_name"
        else
            echo "❌ Puerto $target no configurado"
            return 1
        fi
    fi
}

restart_servers() {
    check_pm2 || return 1
    
    local target="${1:-all}"
    
    if [ "$target" = "all" ]; then
        echo "🔄 Reiniciando todos los servidores..."
        pm2 restart all
    else
        local app_name=$(get_app_name_by_port "$target")
        if [ -n "$app_name" ]; then
            echo "🔄 Reiniciando servidor puerto $target ($app_name)..."
            pm2 restart "$app_name"
        else
            echo "❌ Puerto $target no configurado"
            return 1
        fi
    fi
    
    sleep 2
    show_status
}

show_status() {
    check_pm2 || return 1
    
    echo "📊 Estado de servidores PM2"
    echo "============================"
    pm2 status
    echo ""
    
    echo "🌐 Puertos verificación:"
    echo "------------------------"
    for port in "${!PORT_TO_APP[@]}"; do
        if ss -tlnp 2>/dev/null | grep -q ":$port "; then
            echo "✅ Puerto $port: ACTIVO (${PORT_TO_APP[$port]})"
        else
            echo "❌ Puerto $port: INACTIVO (${PORT_TO_APP[$port]})"
        fi
    done | sort -V
}

show_logs() {
    check_pm2 || return 1
    
    local port="$1"
    
    if [ -z "$port" ]; then
        echo "📋 Logs de todos los servidores"
        echo "==============================="
        pm2 logs --lines 50
    else
        local app_name=$(get_app_name_by_port "$port")
        if [ -n "$app_name" ]; then
            echo "📋 Logs del servidor puerto $port ($app_name)"
            echo "=============================================="
            pm2 logs "$app_name" --lines 100
        else
            echo "❌ Puerto $port no configurado"
            return 1
        fi
    fi
}

open_monitor() {
    check_pm2 || return 1
    echo "🖥️  Abriendo monitor PM2 interactivo..."
    pm2 monit
}

check_health() {
    local target_port="$1"
    
    if [ -n "$target_port" ]; then
        # Health-check de puerto específico
        local app_name=$(get_app_name_by_port "$target_port")
        if [ -z "$app_name" ]; then
            echo "❌ Puerto $target_port no configurado"
            return 1
        fi
        
        echo "🩺 Health-check puerto $target_port ($app_name)"
        echo "==============================================="
        
        # Estado PM2
        local pm2_status=$(pm2 jlist | jq -r ".[] | select(.name==\"$app_name\") | .pm2_env.status" 2>/dev/null)
        echo "📊 Estado PM2: ${pm2_status:-desconocido}"
        
        # Puerto en escucha
        if ss -tlnp 2>/dev/null | grep -q ":$target_port "; then
            echo "✅ Puerto $target_port: ESCUCHANDO"
        else
            echo "❌ Puerto $target_port: NO DISPONIBLE"
        fi
        
        # Recursos
        if [ "$pm2_status" = "online" ]; then
            pm2 show "$app_name" | grep -E "(memory|cpu)"
        fi
        
    else
        # Health-check de todos
        echo "🩺 Health-check completo"
        echo "======================="
        
        local total=0
        local online=0
        local listening=0
        
        for port in "${!PORT_TO_APP[@]}"; do
            total=$((total + 1))
            app_name="${PORT_TO_APP[$port]}"
            
            # Estado PM2
            pm2_status=$(pm2 jlist | jq -r ".[] | select(.name==\"$app_name\") | .pm2_env.status" 2>/dev/null)
            if [ "$pm2_status" = "online" ]; then
                online=$((online + 1))
            fi
            
            # Puerto
            if ss -tlnp 2>/dev/null | grep -q ":$port "; then
                listening=$((listening + 1))
                echo "✅ $port ($app_name): PM2=$pm2_status, Puerto=ACTIVO"
            else
                echo "❌ $port ($app_name): PM2=$pm2_status, Puerto=INACTIVO"
            fi
        done | sort -V
        
        echo ""
        echo "📈 Resumen: $online/$total aplicaciones online, $listening/$total puertos activos"
    fi
}

deploy_with_pm2() {
    local src="${1:-$DEPLOY_SRC}"
    local yes_flag="${2:-}"
    
    echo "🚚 Deploy con PM2"
    echo "=================="
    
    # Validaciones
    if [ ! -d "$src" ]; then
        echo "❌ Carpeta origen no existe: $src"
        return 1
    fi
    
    # Confirmación
    if [ "$yes_flag" != "-y" ] && [ "$yes_flag" != "--yes" ]; then
        read -r -p "¿Deploy y restart automático? [s/N]: " ans
        case "$ans" in
            s|S|si|SI|sí|Sí|y|Y) ;;
            *) echo "🚫 Cancelado."; return 1 ;;
        esac
    fi
    
    # Contar servidores activos
    echo "📊 Contando servidores activos..."
    local active_apps=$(ssh -p "$DEPLOY_SSH_PORT" "$DEPLOY_USER@$DEPLOY_HOST" "pm2 jlist 2>/dev/null | jq -r '.[] | select(.pm2_env.status==\"online\") | .name' | grep '^unreal-' | wc -l" 2>/dev/null || echo "0")
    
    echo "   Servidores activos: $active_apps"
    
    # Parar servidores remotos
    echo "🛑 Parando servidores remotos..."
    ssh -p "$DEPLOY_SSH_PORT" "$DEPLOY_USER@$DEPLOY_HOST" "cd '$DEPLOY_PATH' && pm2 stop all"
    
    # Deploy
    echo "📤 Subiendo archivos..."
    scp -r -C -P "$DEPLOY_SSH_PORT" "$src/" "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/"
    if [ $? -ne 0 ]; then
        echo "❌ Error en deploy"
        return 1
    fi
    
    # Reiniciar
    echo "🚀 Reiniciando con PM2..."
    ssh -p "$DEPLOY_SSH_PORT" "$DEPLOY_USER@$DEPLOY_HOST" "
        cd '$DEPLOY_PATH' && 
        pm2 start ecosystem.config.js &&
        pm2 save
    "
    
    # Health-check final
    echo "🩺 Verificación final..."
    sleep 5
    ssh -p "$DEPLOY_SSH_PORT" "$DEPLOY_USER@$DEPLOY_HOST" "cd '$DEPLOY_PATH' && pm2 status"
    
    echo "✅ Deploy completado"
}

# ========================
# PROCESAMIENTO DE COMANDOS
# ========================

case "$1" in
    start)
        start_servers "$2"
        ;;
    stop)
        stop_servers "$2"
        ;;
    restart)
        restart_servers "$2"
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "$2"
        ;;
    monit|monitor)
        open_monitor
        ;;
    install)
        install_pm2
        ;;
    setup)
        setup_pm2
        ;;
    deploy)
        deploy_with_pm2 "$2" "$3"
        ;;
    health)
        check_health "$2"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "❌ Comando no reconocido: $1"
        echo ""
        show_help
        exit 1
        ;;
esac