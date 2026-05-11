module.exports = {
  apps: [{
    name: 'xiayi-foodie-skill',
    script: 'lambda/server.js',
    cwd: '/workspace',
    instances: 1,
    exec_mode: 'fork',
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M',
    restart_delay: 4000,
    error_file: 'logs/pm2-error.log',
    out_file: 'logs/pm2-out.log',
    log_file: 'logs/pm2-combined.log',
    time: true,
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_development: {
      NODE_ENV: 'development'
    },
    kill_timeout: 5000,
    listen_timeout: 3000,
    pmx: false,
    instance_var: 'INSTANCE_ID'
  }]
};
