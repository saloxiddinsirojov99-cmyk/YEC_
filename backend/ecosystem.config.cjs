module.exports = {
  apps: [
    {
      name: 'yec-backend',
      cwd: __dirname,
      script: 'dist/main.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_restarts: 100,
      restart_delay: 1500,
      exp_backoff_restart_delay: 10000,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: '3001',
      },
    },
  ],
};
