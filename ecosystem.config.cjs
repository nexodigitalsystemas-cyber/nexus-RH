module.exports = {
  apps: [
    {
      name: 'nexus-rh',
      script: './node_modules/.bin/serve',
      args: 'dist -l tcp://127.0.0.1:13710 -s',
      cwd: '/root/nexo-projects-abner/nexus_RH/app',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
      log_file: '/root/nexo-projects-abner/nexus_RH/logs/nexus-rh.log',
      error_file: '/root/nexo-projects-abner/nexus_RH/logs/nexus-rh-error.log',
      out_file: '/root/nexo-projects-abner/nexus_RH/logs/nexus-rh-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
    },
  ],
};
