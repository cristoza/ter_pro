module.exports = {
    apps: [{
        name: 'physio-clinic-backend',
        script: './src/app.js',

        // Single fork instance required — Socket.IO uses in-memory state.
        // To scale horizontally, add a Redis Socket.IO adapter and switch to cluster mode.
        instances: 1,
        exec_mode: 'fork',

        // Restart behaviour
        autorestart: true,
        max_memory_restart: '512M',
        min_uptime: '10s',       // App must stay up 10s before a restart counts as "successful"
        max_restarts: 10,        // Stop restarting after 10 fast crashes (prevents infinite loops)
        restart_delay: 3000,     // Wait 3 seconds between restarts

        // Graceful shutdown
        listen_timeout: 10000,   // Wait up to 10s for app to be ready after start
        kill_timeout: 5000,      // Wait up to 5s for in-flight requests before force-kill

        // Logging
        out_file: './logs/pm2-out.log',
        error_file: './logs/pm2-error.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss',
        merge_logs: true,

        // Development environment (default)
        env: {
            NODE_ENV: 'development',
            PORT: 3000
        },

        // Production environment — run with: pm2 start ecosystem.config.js --env production
        // All other variables (PG_*, SESSION_SECRET, ALLOWED_ORIGINS) are loaded from .env by dotenv
        env_production: {
            NODE_ENV: 'production',
            PORT: 3000
        }
    }]
};
