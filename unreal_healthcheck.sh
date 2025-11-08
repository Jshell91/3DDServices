#!/bin/bash

# 🏥 Health-Check Avanzado para Servidores Unreal Engine
# Integración con manage_unreal_servers.sh

# Configuración desde manage_unreal_servers.sh
source "$(dirname "$0")/manage_unreal_servers.sh" 2>/dev/null || {
    # Fallback si no se puede cargar el script principal
    DEPLOY_USER="${DEPLOY_USER:-jota}"
    DEPLOY_HOST="${DEPLOY_HOST:-217.154.124.154}"
    DEPLOY_SSH_PORT="${DEPLOY_SSH_PORT:-22}"
    REMOTE_BASE_PORT="${REMOTE_BASE_PORT:-7777}"
}

# ========================
# HEALTH-CHECK FUNCTIONS
# ========================

# 1. Check básico de puertos (TCP/UDP)
check_ports() {
    local num_servers="${1:-3}"
    echo "🔌 Verificando puertos TCP/UDP..."
    
    ssh -p "$DEPLOY_SSH_PORT" "$DEPLOY_USER@$DEPLOY_HOST" "
        check_port() {
            local p=\"\$1\"
            # TCP
            if ss -lnt 2>/dev/null | awk '{print \$4}' | grep -q \":\$p\$\"; then
                echo \"✅ Puerto \$p TCP: ACTIVO\"
                return 0
            fi
            # UDP  
            if ss -lnu 2>/dev/null | awk '{print \$4}' | grep -q \":\$p\$\"; then
                echo \"✅ Puerto \$p UDP: ACTIVO\"
                return 0
            fi
            echo \"❌ Puerto \$p: INACTIVO\"
            return 1
        }
        
        ok=0
        for i in \$(seq 0 $((num_servers-1))); do
            port=\$(( $REMOTE_BASE_PORT + i ))
            if check_port \"\$port\"; then ok=\$((ok+1)); fi
        done
        
        echo \"📊 Resultado: \$ok/$num_servers puertos activos\"
        [ \"\$ok\" -eq \"$num_servers\" ]
    "
}

# 2. Check de procesos Unreal activos
check_processes() {
    echo "⚙️ Verificando procesos Unreal..."
    
    ssh -p "$DEPLOY_SSH_PORT" "$DEPLOY_USER@$DEPLOY_HOST" "
        procs=\$(pgrep -fl 'Unreal|VR3DDSO|Server' | grep -v grep || true)
        count=\$(echo \"\$procs\" | wc -l)
        
        if [ -n \"\$procs\" ] && [ \"\$count\" -gt 0 ]; then
            echo \"✅ Procesos Unreal activos: \$count\"
            echo \"\$procs\" | while read line; do
                echo \"  📋 \$line\"
            done
            return 0
        else
            echo \"❌ No hay procesos Unreal activos\"
            return 1
        fi
    "
}

# 3. Check de sesiones screen
check_screen_sessions() {
    echo "📺 Verificando sesiones screen..."
    
    ssh -p "$DEPLOY_SSH_PORT" "$DEPLOY_USER@$DEPLOY_HOST" "
        sessions=\$(screen -ls 2>/dev/null | grep 'unreal-server' || true)
        count=\$(echo \"\$sessions\" | grep -c 'unreal-server' || echo 0)
        
        if [ \"\$count\" -gt 0 ]; then
            echo \"✅ Sesiones screen activas: \$count\"
            echo \"\$sessions\" | while read line; do
                echo \"  🖥️  \$line\"
            done
            return 0
        else
            echo \"❌ No hay sesiones screen activas\"
            return 1
        fi
    "
}

# 4. Check de memoria y CPU
check_system_resources() {
    echo "💾 Verificando recursos del sistema..."
    
    ssh -p "$DEPLOY_SSH_PORT" "$DEPLOY_USER@$DEPLOY_HOST" "
        # Memoria
        mem_info=\$(free -h | grep 'Mem:')
        echo \"📊 Memoria: \$mem_info\"
        
        # CPU load
        load_avg=\$(uptime | awk -F'load average:' '{print \$2}')
        echo \"⚡ Load average:\$load_avg\"
        
        # Uso de disco
        disk_info=\$(df -h / | tail -1)
        echo \"💽 Disco raíz: \$disk_info\"
        
        # Procesos Unreal específicos con uso de recursos
        echo \"🎮 Recursos Unreal:\"
        ps aux | grep -E '(Unreal|VR3DDSO|Server)' | grep -v grep | while read line; do
            echo \"  \$line\"
        done || echo \"  (sin procesos Unreal)\"
    "
}

# 5. Check de logs recientes
check_recent_logs() {
    local minutes="${1:-5}"
    echo "📋 Verificando logs recientes (últimos $minutes min)..."
    
    ssh -p "$DEPLOY_SSH_PORT" "$DEPLOY_USER@$DEPLOY_HOST" "
        log_dir='$DEPLOY_PATH/logs'
        if [ -d \"\$log_dir\" ]; then
            echo \"📁 Logs en: \$log_dir\"
            
            # Logs modificados recientemente
            recent_logs=\$(find \"\$log_dir\" -name '*.log' -mmin -$minutes 2>/dev/null || true)
            if [ -n \"\$recent_logs\" ]; then
                echo \"✅ Logs activos (modificados en últimos ${minutes}m):\"
                echo \"\$recent_logs\" | while read log; do
                    size=\$(du -h \"\$log\" 2>/dev/null | cut -f1 || echo '?')
                    echo \"  📄 \$(basename \"\$log\") - \$size\"
                    
                    # Últimas líneas del log
                    echo \"    Últimas líneas:\"
                    tail -3 \"\$log\" 2>/dev/null | sed 's/^/      /' || echo \"      (no legible)\"
                done
            else
                echo \"⚠️  No hay logs modificados recientemente\"
            fi
        else
            echo \"❌ Directorio de logs no encontrado: \$log_dir\"
        fi
    "
}

# 6. Test de conectividad real (simple socket test)
test_connectivity() {
    local num_servers="${1:-3}"
    echo "🌐 Test de conectividad real..."
    
    for i in $(seq 0 $((num_servers-1))); do
        local port=$((REMOTE_BASE_PORT + i))
        echo "🔍 Probando conexión a $DEPLOY_HOST:$port..."
        
        # Timeout de 3 segundos para conexión
        if timeout 3 bash -c "</dev/tcp/$DEPLOY_HOST/$port" 2>/dev/null; then
            echo "✅ Puerto $port: CONECTA"
        else
            echo "❌ Puerto $port: NO CONECTA"
        fi
    done
}

# 7. Check completo (all-in-one)
full_healthcheck() {
    local num_servers="${1:-3}"
    
    echo "🏥 Health-Check Completo de Servidores Unreal"
    echo "=============================================="
    echo "📊 Host: $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_SSH_PORT"
    echo "🎯 Verificando $num_servers servidores (base port: $REMOTE_BASE_PORT)"
    echo ""
    
    local checks_passed=0
    local total_checks=6
    
    # Ejecutar todos los checks
    if check_ports "$num_servers"; then checks_passed=$((checks_passed+1)); fi
    echo ""
    
    if check_processes; then checks_passed=$((checks_passed+1)); fi
    echo ""
    
    if check_screen_sessions; then checks_passed=$((checks_passed+1)); fi
    echo ""
    
    if check_system_resources; then checks_passed=$((checks_passed+1)); fi
    echo ""
    
    if check_recent_logs 5; then checks_passed=$((checks_passed+1)); fi
    echo ""
    
    if test_connectivity "$num_servers"; then checks_passed=$((checks_passed+1)); fi
    echo ""
    
    # Resultado final
    echo "🎯 Resultado final: $checks_passed/$total_checks checks pasados"
    
    if [ "$checks_passed" -eq "$total_checks" ]; then
        echo "✅ ESTADO: SALUDABLE - Todos los servidores funcionando correctamente"
        return 0
    elif [ "$checks_passed" -ge 4 ]; then
        echo "⚠️  ESTADO: ADVERTENCIA - Algunos problemas menores detectados"
        return 1
    else
        echo "❌ ESTADO: CRÍTICO - Problemas serios detectados"
        return 2
    fi
}

# ========================
# COMANDOS DISPONIBLES
# ========================

show_health_help() {
    echo "🏥 Health-Check Avanzado para Servidores Unreal"
    echo "=============================================="
    echo "Uso: $0 [comando] [opciones]"
    echo ""
    echo "📋 Comandos disponibles:"
    echo "  full [num]         - Health-check completo (default: 3 servidores)"
    echo "  ports [num]        - Solo verificar puertos TCP/UDP"
    echo "  processes          - Solo verificar procesos Unreal"
    echo "  screen             - Solo verificar sesiones screen"
    echo "  resources          - Solo verificar memoria/CPU/disco"
    echo "  logs [min]         - Solo verificar logs (default: 5 min)"
    echo "  connectivity [num] - Solo test de conectividad real"
    echo "  help               - Mostrar esta ayuda"
    echo ""
    echo "💡 Ejemplos:"
    echo "  $0 full 5          - Check completo de 5 servidores"
    echo "  $0 ports 3         - Solo verificar puertos de 3 servidores"
    echo "  $0 logs 10         - Verificar logs modificados en últimos 10 min"
    echo "  $0 connectivity 2  - Test conectividad a 2 servidores"
    echo ""
    echo "🔧 Configuración actual:"
    echo "  Host: $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_SSH_PORT"
    echo "  Puerto base: $REMOTE_BASE_PORT"
    echo ""
    echo "🔗 Integración:"
    echo "  # Desde manage_unreal_servers.sh"
    echo "  ./manage_unreal_servers.sh health 3"
    echo "  # Health-check avanzado"
    echo "  ./unreal_healthcheck.sh full 3"
}

# ========================
# PROCESAMIENTO DE COMANDOS
# ========================

case "$1" in
    full)
        full_healthcheck "${2:-3}"
        ;;
    ports)
        check_ports "${2:-3}"
        ;;
    processes)
        check_processes
        ;;
    screen)
        check_screen_sessions
        ;;
    resources)
        check_system_resources
        ;;
    logs)
        check_recent_logs "${2:-5}"
        ;;
    connectivity)
        test_connectivity "${2:-3}"
        ;;
    help|--help|-h)
        show_health_help
        ;;
    *)
        if [ -z "$1" ]; then
            # Sin argumentos = full check
            full_healthcheck 3
        else
            echo "❌ Comando no reconocido: $1"
            echo ""
            show_health_help
            exit 1
        fi
        ;;
esac