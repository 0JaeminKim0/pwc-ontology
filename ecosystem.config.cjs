module.exports = {
  apps: [
    {
      name: 'pdf-server',
      script: 'railway-server.js',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      log_type: 'json'
    }
  ]
}