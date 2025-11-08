#!/bin/bash

# 🎮 Script de Gestión de Servidores Unreal con Screen
# Autor: Generado para proyecto 3DDServices
# Fecha: September 2025

# ========================
# 📺 COMANDOS BÁSICOS DE SCREEN - REFERENCIA RÁPIDA
# ========================
#
# 🚀 CREACIÓN Y GESTIÓN:
#   screen -S nombre               → Crear nueva sesión con nombre
#   screen -dmS nombre comando     → Crear sesión en background
#   screen -ls                     → Listar todas las sesiones
#   screen -r nombre               → Reconectar a sesión específica
#   screen -r                      → Reconectar a la última sesión
#
# ⌨️  ATAJOS DE TECLADO (dentro de sesión):
#   Ctrl+A, luego D                → Desconectar SIN cerrar (¡IMPORTANTE!)
#   Ctrl+A, luego C                → Crear nueva ventana
#   Ctrl+A, luego N                → Ir a siguiente ventana
#   Ctrl+A, luego P                → Ir a ventana anterior
#   Ctrl+A, luego "                → Listar ventanas
#   Ctrl+A, luego A                → Renombrar ventana actual
#   Ctrl+A, luego K                → Matar ventana actual
#   Ctrl+A, luego [                → Modo scroll/copy (ESC para salir)
#
# 🛑 TERMINAR SESIONES:
#   exit                           → Cerrar ventana actual
#   screen -X -S nombre quit       → Matar sesión desde fuera
#   screen -wipe                   → Limpiar sesiones muertas
#
# 💡 EJEMPLOS PRÁCTICOS:
#   screen -S unreal-7777                    → Crear sesión para servidor
#   screen -dmS unreal ./UnrealServer        → Crear y ejecutar en background
#   screen -r unreal-7777                    → Reconectar a sesión del servidor
#   screen -X -S unreal-7777 quit           → Matar sesión del servidor
#
# ⚠️  CONSEJOS IMPORTANTES:
#   • SIEMPRE usar Ctrl+A, D para salir SIN cerrar el servidor
#   • Nunca cerrar SSH directamente si hay screen activo
#   • Usar nombres descriptivos: unreal-puerto
#   • Verificar con 'screen -ls' antes de crear nuevas sesiones

# ========================
# CHAPAR TODO
# for session in $(screen -ls | grep -o '^[[:space:]]*[0-9]*\.' | tr -d ' .' ); do screen -S "$session" -X stuff $'\003'; done
#
# scp -r -v LinuxServer jota@217.154.124.154:/home/jota/LinuxServer/
# ========================
# CONFIGURACIÓN
# ========================
UNREAL_SERVER_PATH="./YourUnrealServer"  # 🔧 CAMBIAR por la ruta de tu ejecutable
BASE_PORT=8080
LOG_DIR="./logs"

# Crear directorio de logs si no existe
mkdir -p "$LOG_DIR"

# ========================
# DEPLOY - CONFIG
# ========================
# Parámetros por defecto para subir tu build al servidor remoto
DEPLOY_SRC="${DEPLOY_SRC:-./LinuxServer}"              # Carpeta local a subir
DEPLOY_USER="${DEPLOY_USER:-jota}"                     # Usuario remoto
DEPLOY_HOST="${DEPLOY_HOST:-217.154.124.154}"          # Host/IP remoto
DEPLOY_PATH="${DEPLOY_PATH:-/home/jota/LinuxServer}"   # Carpeta destino en el servidor
DEPLOY_SSH_PORT="${DEPLOY_SSH_PORT:-22}"               # Puerto SSH (por defecto 22)

# Rutas/puertos para ejecutar en remoto tras el deploy
REMOTE_UNREAL_SERVER_PATH="${REMOTE_UNREAL_SERVER_PATH:-$DEPLOY_PATH/VR3DDSOCIALWORLDServer.sh}"
REMOTE_BASE_PORT="${REMOTE_BASE_PORT:-$BASE_PORT}"

# Health-check (remoto)
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-30}"         # Tiempo máximo de espera en segundos
HEALTH_INTERVAL="${HEALTH_INTERVAL:-1}"       # Intervalo entre comprobaciones en segundos

# ========================
# FUNCIONES
# ========================

show_help() {
    echo "🎮 Gestión de Servidores Unreal con Screen"
    echo "=========================================="
    echo "Uso: $0 [comando] [opciones]"
    echo ""
    echo "📋 Comandos disponibles:"
    echo "  start [num]     - Iniciar servidores (default: 3)"
    echo "  stop            - Parar todos los servidores"
    echo "  status          - Ver estado de los servidores"
    echo "  logs [port]     - Ver logs de un servidor específico"
    echo "  restart         - Reiniciar todos los servidores"
    echo "  connect [port]  - Conectar a la sesión de un servidor"
    echo "  deploy [ruta] [-y] - Subir la build al servidor remoto (default ruta: $DEPLOY_SRC)"
    echo "  screen          - Mostrar comandos básicos de Screen"
    echo "  health [num]    - Comprobar (remoto) que [num] puertos desde $REMOTE_BASE_PORT están en escucha"
    echo "  healthcheck [tipo] [param] - Health-check avanzado (tipos: full, ports, processes, screen, resources, logs, connectivity)"
    echo "  help            - Mostrar esta ayuda"
    echo ""
    echo "💡 Ejemplos:"
    echo "  $0 start 5      - Iniciar 5 servidores (puertos 8080-8084)"
    echo "  $0 logs 8080    - Ver logs del servidor en puerto 8080"
    echo "  $0 connect 8081 - Conectar a la sesión del servidor puerto 8081"
    echo "  $0 deploy --yes - Subir './LinuxServer' al servidor sin confirmar"
    echo "  $0 status       - Ver todos los servidores corriendo"
    echo ""
    echo "🔧 Configuración actual:"
    echo "  Ejecutable: $UNREAL_SERVER_PATH"
    echo "  Puerto base: $BASE_PORT"
    echo "  Directorio logs: $LOG_DIR"
    echo "  Deploy origen: $DEPLOY_SRC"
    echo "  Deploy destino: $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH (SSH $DEPLOY_SSH_PORT)"
    echo "  Remote exe: $REMOTE_UNREAL_SERVER_PATH (base port: $REMOTE_BASE_PORT)"
    echo "  Health: timeout=$HEALTH_TIMEOUTs interval=$HEALTH_INTERVALs"
}

start_servers() {
    local num_servers=${1:-3}
    echo "🚀 Iniciando $num_servers servidores Unreal..."
    echo "⚙️  Usando ejecutable: $UNREAL_SERVER_PATH"
    echo ""
    
    for i in $(seq 0 $((num_servers-1))); do
        local port=$((BASE_PORT + i))
        local session_name="unreal-server-$port"
        local log_file="$LOG_DIR/server-$port.log"
        
        # Verificar si ya existe la sesión
        if screen -list | grep -q "$session_name"; then
            echo "⚠️  Servidor en puerto $port ya está corriendo (sesión: $session_name)"
            continue
        fi
        
        echo "📡 Iniciando servidor #$((i+1)) en puerto $port"
        echo "   📋 Sesión: $session_name"
        echo "   📄 Log: $log_file"
        
        # Crear sesión screen con logging
        screen -dmS "$session_name" bash -c "
            echo '🚀 Iniciando servidor Unreal en puerto $port...';
            echo '📅 Fecha: $(date)';
            echo '===============================================';
            $UNREAL_SERVER_PATH -Port=$port 2>&1 | tee $log_file;
            echo '';
            echo '❌ Servidor terminado. Presiona Enter para cerrar la sesión.';
            exec bash
        "
        
        sleep 2  # Esperar entre lanzamientos para evitar conflictos
    done
    
    echo ""
    echo "✅ Proceso de inicio completado!"
    echo ""
    show_status
}

stop_servers() {
    echo "🛑 Parando todos los servidores Unreal..."
    echo ""
    
    local stopped_count=0
    for session in $(screen -ls | grep "unreal-server" | cut -d. -f1 | awk '{print $1}'); do
        local session_full=$(screen -ls | grep "$session" | sed 's/\t//g')
        echo "🔸 Parando: $session_full"
        screen -S "$session" -X quit
        stopped_count=$((stopped_count + 1))
    done
    
    if [ $stopped_count -eq 0 ]; then
        echo "ℹ️  No había servidores corriendo"
    else
        echo ""
        echo "✅ $stopped_count servidor(es) parado(s)"
    fi
}

show_status() {
    echo "📊 Estado de los servidores Unreal"
    echo "=================================="
    
    # Verificar sesiones screen
    local screen_sessions=$(screen -ls | grep "unreal-server" || echo "")
    
    if [ -n "$screen_sessions" ]; then
        echo "🖥️  Sesiones Screen activas:"
        echo "$screen_sessions"
        echo ""
        
        echo "💾 Uso de memoria de servidores:"
        echo "--------------------------------"
        local memory_info=$(ps aux | grep -E "(Unreal|YourUnrealServer)" | grep -v grep || echo "")
        if [ -n "$memory_info" ]; then
            echo "USER       PID  %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND"
            echo "$memory_info"
        else
            echo "ℹ️  No se encontraron procesos Unreal en memoria"
        fi
        
        echo ""
        echo "🌐 Puertos en uso:"
        echo "------------------"
        for port in $(seq $BASE_PORT $((BASE_PORT + 10))); do
            if netstat -ln 2>/dev/null | grep -q ":$port "; then
                echo "✅ Puerto $port: OCUPADO"
            fi
        done
        
    else
        echo "❌ No hay servidores Unreal corriendo"
        echo ""
        echo "💡 Para iniciar servidores usa: $0 start [cantidad]"
    fi
    
    echo ""
    echo "📁 Logs disponibles:"
    echo "-------------------"
    if ls "$LOG_DIR"/server-*.log 1> /dev/null 2>&1; then
        for log_file in "$LOG_DIR"/server-*.log; do
            local size=$(du -h "$log_file" | cut -f1)
            local modified=$(stat -c %y "$log_file" 2>/dev/null | cut -d' ' -f1,2 | cut -d'.' -f1 || echo "N/A")
            echo "📄 $(basename "$log_file") - $size - $modified"
        done
    else
        echo "ℹ️  No hay logs disponibles"
    fi
}

show_screen_commands() {
    echo "📺 Comandos Básicos de Screen"
    echo "============================"
    echo ""
    echo "🚀 Creación y gestión de sesiones:"
    echo "  screen -S nombre               - Crear nueva sesión con nombre"
    echo "  screen -dmS nombre comando     - Crear sesión en background"
    echo "  screen -ls                     - Listar todas las sesiones"
    echo "  screen -r nombre               - Reconectar a sesión específica"
    echo "  screen -r                      - Reconectar a la última sesión"
    echo ""
    echo "⌨️  Atajos de teclado (dentro de una sesión):"
    echo "  Ctrl+A, luego D                - Desconectar (detach) sin cerrar"
    echo "  Ctrl+A, luego C                - Crear nueva ventana"
    echo "  Ctrl+A, luego N                - Ir a siguiente ventana"
    echo "  Ctrl+A, luego P                - Ir a ventana anterior"
    echo "  Ctrl+A, luego \"                - Listar ventanas"
    echo "  Ctrl+A, luego A                - Renombrar ventana actual"
    echo "  Ctrl+A, luego K                - Matar ventana actual"
    echo "  Ctrl+A, luego [                - Modo scroll/copy (ESC para salir)"
    echo ""
    echo "🛑 Terminar sesiones:"
    echo "  exit                           - Cerrar ventana actual"
    echo "  screen -X -S nombre quit       - Matar sesión desde fuera"
    echo "  screen -wipe                   - Limpiar sesiones muertas"
    echo ""
    echo "📋 Información y monitoreo:"
    echo "  screen -X -S nombre stuff 'comando\\n'  - Enviar comando a sesión"
    echo "  screen -X -S nombre hardcopy            - Capturar pantalla a archivo"
    echo ""
    echo "💡 Ejemplos prácticos:"
    echo "  screen -S mi-servidor                   - Crear sesión 'mi-servidor'"
    echo "  screen -dmS unreal ./UnrealServer       - Crear y ejecutar en background"
    echo "  screen -r unreal                        - Reconectar a sesión 'unreal'"
    echo "  screen -X -S unreal quit                - Matar sesión 'unreal'"
    echo ""
    echo "⚠️  Consejos importantes:"
    echo "  • Usar Ctrl+A, luego D para salir SIN cerrar el servidor"
    echo "  • Nunca cerrar la terminal SSH directamente si hay screen activo"
    echo "  • Usar nombres descriptivos para las sesiones"
    echo "  • 'screen -ls' para ver qué tienes corriendo antes de crear nuevas"
}

show_logs() {
    local port=${1:-$BASE_PORT}
    local log_file="$LOG_DIR/server-$port.log"
    
    echo "📋 Logs del servidor puerto $port"
    echo "================================="
    
    if [ -f "$log_file" ]; then
        echo "📄 Archivo: $log_file"
        echo "📊 Tamaño: $(du -h "$log_file" | cut -f1)"
        echo ""
        echo "🔄 Mostrando logs en tiempo real (Ctrl+C para salir):"
        echo "----------------------------------------------------"
        tail -f "$log_file"
    else
        echo "❌ No se encontraron logs para el puerto $port"
        echo ""
        echo "📁 Logs disponibles:"
        ls -la "$LOG_DIR"/server-*.log 2>/dev/null || echo "   (ninguno)"
    fi
}

connect_server() {
    local port=${1:-$BASE_PORT}
    local session_name="unreal-server-$port"
    
    echo "🔗 Conectando a servidor puerto $port..."
    echo "📋 Sesión: $session_name"
    
    if screen -list | grep -q "$session_name"; then
        echo "✅ Conectando... (Para salir: Ctrl+A luego D)"
        echo ""
        screen -r "$session_name"
    else
        echo "❌ No se encontró sesión para puerto $port"
        echo ""
        echo "📊 Sesiones disponibles:"
        screen -ls | grep "unreal-server" || echo "   (ninguna)"
    fi
}

restart_servers() {
    echo "🔄 Reiniciando todos los servidores..."
    echo "======================================"
    
    # Contar servidores activos antes de parar
    local active_count=$(screen -ls | grep -c "unreal-server" || echo "0")
    
    stop_servers
    
    if [ "$active_count" -gt 0 ]; then
        echo ""
        echo "⏳ Esperando 3 segundos antes de reiniciar..."
        sleep 3
        echo ""
        start_servers "$active_count"
    else
        echo ""
        echo "ℹ️  No había servidores corriendo. Iniciando 3 servidores por defecto..."
        start_servers 3
    fi
}

# ========================
# DEPLOY - FUNCIÓN
# ========================
deploy() {
    local src="${1:-$DEPLOY_SRC}"
    local yes_flag="${2:-}"

    echo "🚚 Deploy de Unreal build"
    echo "   📂 Origen:      $src"
    echo "   🌍 Destino:     $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH"
    echo "   🔌 Puerto SSH:  $DEPLOY_SSH_PORT"
    echo ""

    # Validaciones básicas
    if [ ! -d "$src" ]; then
        echo "❌ No existe la carpeta local: $src"
        return 1
    fi

    # Confirmación (a menos que -y/--yes)
    if [ "$yes_flag" != "-y" ] && [ "$yes_flag" != "--yes" ]; then
        read -r -p "¿Continuar con el deploy? [s/N]: " ans
        case "$ans" in
            s|S|si|SI|sí|Sí|y|Y) ;;
            *) echo "🚫 Cancelado."; return 1 ;;
        esac
    fi

    # Crear carpeta destino si no existe
    echo "📁 Creando carpeta destino si no existe..."
    ssh -p "$DEPLOY_SSH_PORT" "$DEPLOY_USER@$DEPLOY_HOST" "mkdir -p '$DEPLOY_PATH'"
    if [ $? -ne 0 ]; then
        echo "❌ No se pudo crear/verificar la carpeta destino vía SSH."
        return 1
    fi

    # Copiar comprimido y verboso
    echo "📤 Subiendo archivos (scp -r -C -v -P $DEPLOY_SSH_PORT) ..."
    scp -r -C -v -P "$DEPLOY_SSH_PORT" "$src/" "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/"
    local code=$?

    if [ $code -eq 0 ]; then
        echo "✅ Deploy completado correctamente."
    else
        echo "❌ Error en scp (código $code)."
        return $code
    fi
}

# ========================
# REMOTO: STOP/WAIT/START
# ========================
remote_count_active() {
    ssh -p "$DEPLOY_SSH_PORT" "$DEPLOY_USER@$DEPLOY_HOST" "screen -ls 2>/dev/null | grep -c 'unreal-server' || echo 0"
}

remote_stop_servers() {
    echo "🛑 (remoto) Parando servidores en $DEPLOY_HOST..."
    ssh -p "$DEPLOY_SSH_PORT" "$DEPLOY_USER@$DEPLOY_HOST" "for s in \$(screen -ls 2>/dev/null | grep 'unreal-server' | cut -d. -f1 | awk '{print \$1}'); do echo ' - quit ' \"\$s\"; screen -S \"\$s\" -X quit; done; true"
}

remote_wait_until_stopped() {
    local timeout="${1:-20}"
    local waited=0
    echo "⏳ (remoto) Esperando a que terminen procesos/sesiones (timeout ${timeout}s)..."
    while true; do
        local active=$(remote_count_active)
        local procs=$(ssh -p "$DEPLOY_SSH_PORT" "$DEPLOY_USER@$DEPLOY_HOST" "pgrep -fl 'Unreal|YourUnrealServer' | wc -l" 2>/dev/null)
        if [ "$active" = "0" ] && [ "${procs:-0}" = "0" ]; then
            echo "✅ (remoto) No hay sesiones ni procesos activos."
            return 0
        fi
        if [ $waited -ge $timeout ]; then
            echo "⚠️  (remoto) Timeout esperando cierre. Sesiones activas: $active, procesos: ${procs:-0}"
            return 1
        fi
        sleep 1
        waited=$((waited+1))
    done
}

remote_start_servers() {
    local num_servers="${1:-3}"
    echo "🚀 (remoto) Iniciando $num_servers servidores desde $REMOTE_UNREAL_SERVER_PATH (puerto base $REMOTE_BASE_PORT)"
    ssh -p "$DEPLOY_SSH_PORT" "$DEPLOY_USER@$DEPLOY_HOST" "\
        set -e; \
                # Asegurar que el ejecutable remoto existe y tiene permisos
                if [ -f '$REMOTE_UNREAL_SERVER_PATH' ] && [ ! -x '$REMOTE_UNREAL_SERVER_PATH' ]; then chmod +x '$REMOTE_UNREAL_SERVER_PATH'; fi; \
                if [ ! -x '$REMOTE_UNREAL_SERVER_PATH' ]; then echo '❌ Ejecutable no encontrado o no ejecutable: $REMOTE_UNREAL_SERVER_PATH'; exit 1; fi; \
        mkdir -p '$DEPLOY_PATH/logs'; \
        for i in $(seq 0 $((num_servers-1))); do \
          port=$(( $REMOTE_BASE_PORT + i )); \
          session=unreal-server-$port; \
          log='$DEPLOY_PATH/logs/server-'"$port"'.log'; \
          if screen -ls 2>/dev/null | grep -q "${session}"; then echo "⚠️  Ya existe ${session}, saltando"; else \
            echo "📡 Lanzando ${session} en puerto ${port}"; \
            screen -dmS \"\$session\" bash -c \"echo '🚀 Unreal port \$port'; echo '📅 '\\\$(date); echo '================================'; '\$REMOTE_UNREAL_SERVER_PATH' -Port=\$port 2>&1 | tee -a '\$log'; exec bash\"; \
            sleep 1; \
          fi; \
        done"
}

# Esperar a que los puertos estén en escucha en el host remoto (TCP/UDP)
remote_wait_ports_listening() {
        local num_servers="${1:-3}"
        local timeout="${2:-$HEALTH_TIMEOUT}"
        local interval="${3:-$HEALTH_INTERVAL}"

        echo "🩺 (remoto) Esperando puertos activos (base $REMOTE_BASE_PORT, cantidad $num_servers, timeout ${timeout}s)"
        local max_port=$((REMOTE_BASE_PORT + num_servers - 1))
        ssh -p "$DEPLOY_SSH_PORT" "$DEPLOY_USER@$DEPLOY_HOST" "\
            check_port() { \
                local p=\"\$1\"; \
                if command -v ss >/dev/null 2>&1; then \
                    ss -lntu 2>/dev/null | awk '{print \$5}' | grep -q \":\$p\" && return 0; \
                elif command -v netstat >/dev/null 2>&1; then \
                    netstat -lntu 2>/dev/null | awk '{print \$4}' | grep -q \":\$p\" && return 0; \
                fi; \
                return 1; \
            }; \
            waited=0; \
            while true; do \
                ok=0; \
                for port in \$(seq $REMOTE_BASE_PORT $max_port); do \
                    if check_port \"\$port\"; then ok=\$((ok+1)); fi; \
                done; \
                if [ \"\$ok\" -eq \"$num_servers\" ]; then echo \"✅ (remoto) Puertos activos: \$ok/$num_servers\"; exit 0; fi; \
                if [ \"\$waited\" -ge \"$timeout\" ]; then echo \"⚠️  (remoto) Timeout: activos \$ok/$num_servers\"; exit 1; fi; \
                sleep $interval; waited=\$((waited+$interval)); \
            done"
        return $?
}

# Orquestación completa: parar -> esperar -> deploy -> arrancar
deploy_restart() {
    local src="${1:-$DEPLOY_SRC}"
    local yes_flag="${2:-}"
    local desired="${3:-}"

    echo "🔁 Deploy + Restart (remoto)"
    # Contar servidores activos antes
    local active_before=$(remote_count_active)
    local start_num
    if [[ -n "$desired" && "$desired" =~ ^[0-9]+$ ]]; then
        start_num="$desired"
    else
        start_num=${active_before:-0}
        if [ "$start_num" -eq 0 ]; then start_num=3; fi
    fi

    echo "📊 Activos antes: ${active_before:-0} | Se iniciarán: $start_num"

    remote_stop_servers
    remote_wait_until_stopped 30 || echo "⚠️  Continuando pese al timeout"

    deploy "$src" "$yes_flag" || { echo "❌ Deploy fallido. Abortando restart."; return 1; }

    remote_start_servers "$start_num" || { echo "❌ Falló el arranque remoto."; return 1; }
    # Health-check tras el arranque
    remote_wait_ports_listening "$start_num" "$HEALTH_TIMEOUT" "$HEALTH_INTERVAL" || echo "⚠️  Health-check: algunos puertos no respondieron a tiempo."
}

# ========================
# PROCESAMIENTO DE COMANDOS
# ========================

case "$1" in
    start)
        start_servers "$2"
        ;;
    stop)
        stop_servers
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "$2"
        ;;
    restart)
        restart_servers
        ;;
    connect)
        connect_server "$2"
        ;;
    deploy)
        deploy "$2" "$3"
        ;;
    deploy:restart)
        # Uso: deploy:restart [ruta] [-y] [num]
        deploy_restart "$2" "$3" "$4"
        ;;
    health)
        # Uso: health [num]
        remote_wait_ports_listening "${2:-3}" "$HEALTH_TIMEOUT" "$HEALTH_INTERVAL"
        ;;
    healthcheck)
        # Uso: healthcheck [full|ports|processes|screen|resources|logs|connectivity] [num|minutes]
        local check_type="${2:-full}"
        local param="${3:-3}"
        
        echo "🏥 Health-Check Avanzado"
        echo "========================"
        
        case "$check_type" in
            full)
                echo "🔍 Ejecutando health-check completo..."
                ./unreal_healthcheck.sh full "$param"
                ;;
            ports)
                echo "🔌 Verificando solo puertos..."
                ./unreal_healthcheck.sh ports "$param"
                ;;
            processes)
                echo "⚙️ Verificando solo procesos..."
                ./unreal_healthcheck.sh processes
                ;;
            screen)
                echo "📺 Verificando solo sesiones screen..."
                ./unreal_healthcheck.sh screen
                ;;
            resources)
                echo "💾 Verificando solo recursos del sistema..."
                ./unreal_healthcheck.sh resources
                ;;
            logs)
                echo "📋 Verificando logs recientes..."
                ./unreal_healthcheck.sh logs "$param"
                ;;
            connectivity)
                echo "🌐 Probando conectividad real..."
                ./unreal_healthcheck.sh connectivity "$param"
                ;;
            *)
                echo "❌ Tipo de check no reconocido: $check_type"
                echo "Tipos disponibles: full, ports, processes, screen, resources, logs, connectivity"
                exit 1
                ;;
        esac
        ;;
    screen)
        show_screen_commands
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