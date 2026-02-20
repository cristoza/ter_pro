const { Sequelize } = require('sequelize');
require('dotenv').config();
const logger = require('./logger');

if (!process.env.PG_PASSWORD || !process.env.PG_USER || !process.env.PG_DATABASE) {
    throw new Error(
        'Missing required database environment variables (PG_USER, PG_PASSWORD, PG_DATABASE). Check your .env file.'
    );
}

const sequelize = new Sequelize(
    process.env.PG_DATABASE,
    process.env.PG_USER,
    process.env.PG_PASSWORD,
    {
        host: process.env.PG_HOST || 'localhost',
        port: process.env.PG_PORT || 5432,
        dialect: 'postgres',
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        logger.info('Postgres (Sequelize) connected successfully');
    } catch (error) {
        logger.error('Postgres connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = {
    sequelize,
    Sequelize,
    connectDB,
};
