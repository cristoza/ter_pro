const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database connection using Sequelize (Postgres)
// Use environment variables with fallback to previous hardcoded values for backwards compatibility
const dbName = process.env.PG_DATABASE || 'Fisiatria_BD';
const dbUser = process.env.PG_USER || 'postgres';
const dbPassword = process.env.PG_PASSWORD || '200429';
const dbHost = process.env.PG_HOST || 'localhost';
const dbPort = process.env.PG_PORT || 5432;

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? false : false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        // sync models (safe for development). In production consider migrations.
        await sequelize.sync();
        console.log('Postgres (Sequelize) connected successfully');
    } catch (error) {
        console.error('Postgres connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = {
    sequelize,
    Sequelize,
    connectDB,
};