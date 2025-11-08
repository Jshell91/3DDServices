#!/bin/bash

# 🚀 Script Automático para Iniciar Servidores Unreal con Screen
# ==============================================================
# Basado en los mapas del run_server.ps1
# Cada servidor se ejecuta en su propia sesión de screen

echo "🚀 Iniciando todos los servidores VR3DDSOCIALWORLD con Screen..."
echo "⏱️  Pausa de 3 segundos entre cada servidor"
echo ""

# Array con la configuración de servidores
# Formato: "NOMBRE_SESION:MAPA:PUERTO"
servers=(
    "MAINWORLD:01_MAINWORLD:8080"
    "ARTLOBBY:ART_EXHIBITIONSARTLOBBY:8081"
    "AIArtists:ART_EXHIBITIONS_AIArtists:8082"
    "STRANGEWORLDS:ART_EXHIBITIONS_STRANGEWORLDS_:8083"
    "4Deya:ART_EXHIBITIONS_4Deya:8084"
    "SHEisAI:ART_EXHIBITIONS_SHEisAI:8085"
    "HALLOWEEN:ART_Halloween2025_MULTIPLAYER:8086"
    "JULIEN:ART_JULIENVALLETakaBYJULES:8087"
    "HOUSEOFNOVA:SKYNOVAbyNOVA:8090"
    "MALL:MALL_DOWNTOWNCITYMALL:8091"
)

# Contador para mostrar progreso
total=${#servers[@]}
current=1

# Iniciar cada servidor
for server in "${servers[@]}"; do
    # Extraer datos del servidor
    name=$(echo $server | cut -d: -f1)
    map=$(echo $server | cut -d: -f2)
    port=$(echo $server | cut -d: -f3)
    
    echo "[$current/$total] 🎮 Iniciando $name ($map) en puerto $port..."
    
    # Verificar si la sesión ya existe
    if screen -list | grep -q "$name"; then
        echo "    ⚠️  Sesión '$name' ya existe, saltando..."
    else
        # Crear sesión screen y ejecutar servidor
        screen -dmS "$name" bash -c "
            echo '🚀 Iniciando servidor $name...';
            echo '📍 Mapa: $map';
            echo '🌐 Puerto: $port';
            echo '📅 Fecha: \$(date)';
            echo '===============================================';
            ./VR3DDSOCIALWORLDServer.sh $map -port=$port -log;
            echo '';
            echo '❌ Servidor $name terminado. Presiona Enter para cerrar.';
            read
        "
        echo "    ✅ Sesión '$name' creada exitosamente"
    fi
    
    # Pausa entre servidores (excepto el último)
    if [ $current -lt $total ]; then
        sleep 3
    fi
    
    ((current++))
done

echo ""
echo "🎉 Proceso de inicio completado!"
echo ""
echo "📊 Sesiones creadas:"
screen -ls | grep -E "(MAINWORLD|ARTLOBBY|AIArtists|STRANGEWORLDS|4Deya|SHEisAI|HALLOWEEN|JULIEN|HOUSEOFNOVA|MALL)" || echo "  (verificar con 'screen -ls')"

echo ""
echo "💡 Comandos útiles:"
echo "  screen -ls                    # Ver todas las sesiones"
echo "  screen -r MAINWORLD          # Conectar a una sesión específica"
echo "  screen -r ARTLOBBY           # Conectar al lobby de arte"
echo ""
echo "🛑 Para cerrar todos los servidores:"
echo "  for s in MAINWORLD ARTLOBBY AIArtists STRANGEWORLDS 4Deya SHEisAI HALLOWEEN JULIEN HOUSEOFNOVA MALL; do screen -S \"\$s\" -X stuff \$'\\003'; done"
echo ""
echo "🔄 Para detach de una sesión: Ctrl+A, luego D"
echo "📋 Para ver este script: cat start_all_servers.sh"