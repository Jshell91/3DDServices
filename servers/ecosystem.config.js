module.exports = {
  apps: [
    // =================
    // GAME SERVER MONITOR (GSM) - API Backend
    // =================
    {
      name: 'gsm-backend',
      script: 'game-server-monitor.js',
      cwd: '/home/jota/gsm-backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 3000,
      env: {
        NODE_ENV: 'production',
        PORT: '3001'
      },
      error_file: './logs/gsm-error.log',
      out_file: './logs/gsm-out.log',
      log_file: './logs/gsm-combined.log',
      time: true,
      merge_logs: true
    },
    // =================
    // UNREAL DEDICATED SERVERS
    // =================
    {
      name: 'unreal-01-mainworld',
      script: './LinuxServer/VR3DDSOCIALWORLDServer.sh',
      args: '01_MAINWORLD -port=8080 -log',
      cwd: '/home/jota/unreal-servers',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production',
        UNREAL_MAP: '01_MAINWORLD',
        UNREAL_PORT: '8080'
      },
      error_file: './logs/unreal-8080-error.log',
      out_file: './logs/unreal-8080-out.log',
      log_file: './logs/unreal-8080-combined.log',
      time: true,
      merge_logs: true
    },
    {
      name: 'unreal-art-lobby',
      script: './LinuxServer/VR3DDSOCIALWORLDServer.sh',
      args: 'ART_EXHIBITIONSARTLOBBY -port=8081 -log',
      cwd: '/home/jota/unreal-servers',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production',
        UNREAL_MAP: 'ART_EXHIBITIONSARTLOBBY',
        UNREAL_PORT: '8081'
      },
      error_file: './logs/unreal-8081-error.log',
      out_file: './logs/unreal-8081-out.log',
      log_file: './logs/unreal-8081-combined.log',
      time: true,
      merge_logs: true
    },
    {
      name: 'unreal-art-aiartists',
      script: './LinuxServer/VR3DDSOCIALWORLDServer.sh',
      args: 'ART_EXHIBITIONS_AIArtists -port=8082 -log',
      cwd: '/home/jota/unreal-servers',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production',
        UNREAL_MAP: 'ART_EXHIBITIONS_AIArtists',
        UNREAL_PORT: '8082'
      },
      error_file: './logs/unreal-8082-error.log',
      out_file: './logs/unreal-8082-out.log',
      log_file: './logs/unreal-8082-combined.log',
      time: true,
      merge_logs: true
    },
    {
      name: 'unreal-art-strangeworlds',
      script: './LinuxServer/VR3DDSOCIALWORLDServer.sh',
      args: 'ART_EXHIBITIONS_STRANGEWORLDS_ -port=8083 -log',
      cwd: '/home/jota/unreal-servers',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production',
        UNREAL_MAP: 'ART_EXHIBITIONS_STRANGEWORLDS_',
        UNREAL_PORT: '8083'
      },
      error_file: './logs/unreal-8083-error.log',
      out_file: './logs/unreal-8083-out.log',
      log_file: './logs/unreal-8083-combined.log',
      time: true,
      merge_logs: true
    },
    {
      name: 'unreal-art-4deya',
      script: './LinuxServer/VR3DDSOCIALWORLDServer.sh',
      args: 'ART_EXHIBITIONS_4Deya -port=8084 -log',
      cwd: '/home/jota/unreal-servers',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production',
        UNREAL_MAP: 'ART_EXHIBITIONS_4Deya',
        UNREAL_PORT: '8084'
      },
      error_file: './logs/unreal-8084-error.log',
      out_file: './logs/unreal-8084-out.log',
      log_file: './logs/unreal-8084-combined.log',
      time: true,
      merge_logs: true
    },
    {
      name: 'unreal-art-halloween',
      script: './LinuxServer/VR3DDSOCIALWORLDServer.sh',
      args: 'ART_Halloween2025_MULTIPLAYER -port=8086 -log',
      cwd: '/home/jota/unreal-servers',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production',
        UNREAL_MAP: 'ART_Halloween2025_MULTIPLAYER',
        UNREAL_PORT: '8086'
      },
      error_file: './logs/unreal-8086-error.log',
      out_file: './logs/unreal-8086-out.log',
      log_file: './logs/unreal-8086-combined.log',
      time: true,
      merge_logs: true
    },
    {
      name: 'unreal-art-julien',
      script: './LinuxServer/VR3DDSOCIALWORLDServer.sh',
      args: 'ART_JULIENVALLETakaBYJULES -port=8087 -log',
      cwd: '/home/jota/unreal-servers',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production',
        UNREAL_MAP: 'ART_JULIENVALLETakaBYJULES',
        UNREAL_PORT: '8087'
      },
      error_file: './logs/unreal-8087-error.log',
      out_file: './logs/unreal-8087-out.log',
      log_file: './logs/unreal-8087-combined.log',
      time: true,
      merge_logs: true
    },
    {
      name: 'unreal-skynova',
      script: './LinuxServer/VR3DDSOCIALWORLDServer.sh',
      args: 'SKYNOVAbyNOVA -port=8090 -log',
      cwd: '/home/jota/unreal-servers',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production',
        UNREAL_MAP: 'SKYNOVAbyNOVA',
        UNREAL_PORT: '8090'
      },
      error_file: './logs/unreal-8090-error.log',
      out_file: './logs/unreal-8090-out.log',
      log_file: './logs/unreal-8090-combined.log',
      time: true,
      merge_logs: true
    },
    {
      name: 'unreal-mall-downtown',
      script: './LinuxServer/VR3DDSOCIALWORLDServer.sh',
      args: 'MALL_DOWNTOWNCITYMALL -port=8091 -log',
      cwd: '/home/jota/unreal-servers',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production',
        UNREAL_MAP: 'MALL_DOWNTOWNCITYMALL',
        UNREAL_PORT: '8091'
      },
      error_file: './logs/unreal-8091-error.log',
      out_file: './logs/unreal-8091-out.log',
      log_file: './logs/unreal-8091-combined.log',
      time: true,
      merge_logs: true
    }
  ]
};