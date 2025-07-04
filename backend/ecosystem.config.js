module.exports = {
  apps: [
    {
      name: 'memento-ai-generator',
      script: 'index2.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      },
      env_development: {
        NODE_ENV: 'development'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      max_restarts: 10,
      min_uptime: '10s',
      exec_mode: 'fork',
      cron_restart: '0 2 * * *', // Restart daily at 2 AM
      ignore_watch: [
        'node_modules',
        'logs',
        '.git'
      ],
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'memento-swarm-gateway',
      script: 'index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: '5555'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: '5555'
      },
      error_file: './logs/swarm-err.log',
      out_file: './logs/swarm-out.log',
      log_file: './logs/swarm-combined.log',
      time: true,
      max_restarts: 10,
      min_uptime: '10s',
      exec_mode: 'fork',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ],

  deploy: {
    production: {
      user: 'node',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/memento.git',
      path: '/var/www/memento-backend',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
}; 