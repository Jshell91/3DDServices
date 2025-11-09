module.exports = {
  apps: [
    {
      name: '3ddservices',
      script: 'index.js',
      instances: 1, // Single instance for debugging connection issues
      autorestart: true,
      watch: false, // false in production for stability
      max_memory_restart: '500M', // Increased memory limit
      min_uptime: '10s', // Minimum uptime before restart
      max_restarts: 15, // Increased max restarts
      restart_delay: 2000, // Reduced delay between restarts
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true, // Prefix logs with timestamp
      kill_timeout: 5000, // Time to wait before force killing
      listen_timeout: 3000, // Time to wait for app to listen
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NODE_OPTIONS: '--max-old-space-size=512'
      },
      env_file: '.env',
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        watch: true
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        NODE_OPTIONS: '--max-old-space-size=512',
        // Keep single instance for now to debug connection issues
        instances: 1,
        exec_mode: 'fork' // Changed from cluster to fork for stability
      }
    }
  ],
  
  deploy: {
    production: {
      user: 'node',
      host: '157.230.112.247',
      ref: 'origin/main',
      repo: 'git@github.com:jshell91/3DDServices.git',
      path: '/var/www/production',
      'post-deploy': 'npm install --production && pm2 reload ecosystem.config.js --env production'
    }
  }
};
