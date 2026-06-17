module.exports = {
  apps: [
    {
      name: 'telecom-fault-report',
      script: 'dev/server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    }
  ]
};
