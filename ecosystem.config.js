module.exports = {
  apps: [
    {
      name: '3ddservices',
      script: 'index.js',
      instances: 1, // Change to 'max' for multi-core cluster
      autorestart: true,
      watch: false, // true in development, false in production
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production'
      },
      env_development: {
        NODE_ENV: 'development'
      }
    }
  ]
};
