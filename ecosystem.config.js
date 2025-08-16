module.exports = {
  apps: [
    {
      name: '3ddservices',
      script: 'index.js',
      instances: 1, // Single instance for now
      autorestart: true,
      watch: false, // false in production for stability
      max_memory_restart: '500M', // Increased memory limit
      min_uptime: '10s', // Minimum uptime before restart
      max_restarts: 10, // Max restarts in unstable period
      restart_delay: 4000, // Delay between restarts
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true, // Prefix logs with timestamp
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        watch: true
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        instances: 'max', // Use all CPU cores in production
        exec_mode: 'cluster'
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
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
