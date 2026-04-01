const path = require('path');

const root = __dirname;

module.exports = {
  apps: [
    {
      name: 'yec-backend',
      cwd: path.join(root, 'backend'),
      script: path.join(root, 'backend', 'dist', 'main.js'),
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_restarts: 100,
      restart_delay: 1500,
      exp_backoff_restart_delay: 10000,
      max_memory_restart: '700M',
      env: {
        NODE_ENV: 'production',
        PORT: '3001',
        REQUEST_TIMEOUT_MS: '20000',
      },
    },
    {
      name: 'yec-frontend',
      cwd: path.join(root, 'front'),
      script: path.join(
        root,
        'front',
        'node_modules',
        'next',
        'dist',
        'bin',
        'next',
      ),
      args: 'start -p 3000',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_restarts: 100,
      restart_delay: 1500,
      exp_backoff_restart_delay: 10000,
      max_memory_restart: '700M',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
    },
  ],
};
