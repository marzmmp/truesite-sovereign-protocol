// Add this entry to your ecosystem.config.cjs
// PM2 entry for sovereign-protocol
module.exports = {
  apps: [
    {
      name: 'sovereign-protocol',
      script: 'sovereign_protocol_server.cjs',
      cwd: '/home/truesite-tech/truesite-sovereign',
      max_memory_restart: '512M',
      env: { PORT: 4000, SERVICE_API_KEY: 'YAHUAH' },
      max_restarts: 10,
      restart_delay: 4000,
      autorestart: true,
      watch: false,
      merge_logs: true,
    }
  ]
};
