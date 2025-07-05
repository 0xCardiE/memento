module.exports = {
  apps: [
    {
      name: 'memento-ai-generator',
      script: 'backend/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './backend/logs/err.log',
      out_file: './backend/logs/out.log',
      log_file: './backend/logs/combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'memento-pending-processor',
      script: 'backend/process-pending-continuous.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: './backend/logs/pending-err.log',
      out_file: './backend/logs/pending-out.log',
      log_file: './backend/logs/pending-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
}; 