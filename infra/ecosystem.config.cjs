/**
 * PM2 Ecosystem Config — multivohub-jobapp
 *
 * Three separate processes:
 *   jobapp-server  — Express/tRPC HTTP server  (port 3001)
 *   jobapp-worker  — Auto-apply queue worker   (polls DB every 30s)
 *   jobapp-webhook — Deploy webhook server     (port 9000, localhost only)
 *
 * Deploy:  pm2 start infra/ecosystem.config.cjs
 * Reload:  pm2 reload infra/ecosystem.config.cjs --update-env
 * Status:  pm2 list
 * Logs:    pm2 logs jobapp-server
 *
 * Webhook trigger (from any machine):
 *   bash scripts/trigger-deploy.sh
 *   # or: curl -X POST "https://jobapp.multivohub.com/webhook/deploy?token=SECRET"
 * Nginx must proxy /webhook/ → http://127.0.0.1:9000/
 */

module.exports = {
  apps: [
    {
      name: 'jobapp-server',
      script: 'dist/backend/src/server.js',
      cwd: '/var/www/multivohub-jobapp',
      instances: 1,
      exec_mode: 'fork',
      node_args: '--experimental-vm-modules',
      env: {
        NODE_ENV: 'production',
        PORT: '3001',
      },
      // Restart policy
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 3000,
      // Logs
      out_file: '/var/log/pm2/jobapp-server.out.log',
      error_file: '/var/log/pm2/jobapp-server.err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
    {
      name: 'jobapp-worker',
      script: 'dist/backend/src/worker.js',
      cwd: '/var/www/multivohub-jobapp',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      // Worker polls every 30s — it's OK to let it restart on crash
      autorestart: true,
      watch: false,
      max_restarts: 20,
      min_uptime: '5s',
      restart_delay: 5000,
      // Logs
      out_file: '/var/log/pm2/jobapp-worker.out.log',
      error_file: '/var/log/pm2/jobapp-worker.err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      kill_timeout: 10000,
    },
    {
      name: 'jobapp-webhook',
      script: 'scripts/webhook-server.js',
      cwd: '/var/www/multivohub-jobapp',
      instances: 1,
      exec_mode: 'fork',
      interpreter: 'node',
      interpreter_args: '--input-type=module',
      env: {
        NODE_ENV: 'production',
        WEBHOOK_PORT: '9000',
        APP_DIR: '/var/www/multivohub-jobapp',
        BRANCH: 'main',
        PM2_APP_NAME: 'jobapp-server',
        // DEPLOY_TOKEN must be set in /var/www/multivohub-jobapp/.env.production
        // Never hardcode the token here.
      },
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '5s',
      restart_delay: 3000,
      out_file: '/var/log/pm2/jobapp-webhook.out.log',
      error_file: '/var/log/pm2/jobapp-webhook.err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      kill_timeout: 5000,
    },
  ],
};
