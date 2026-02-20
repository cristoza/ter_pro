const { createLogger, format, transports } = require('winston');
const path = require('path');

const { combine, timestamp, errors, json, colorize, printf } = format;

const logger = createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        json()
    ),
    transports: [
        new transports.File({
            filename: path.join(__dirname, '../../logs/error.log'),
            level: 'error'
        }),
        new transports.File({
            filename: path.join(__dirname, '../../logs/combined.log')
        }),
    ],
    exceptionHandlers: [
        new transports.File({
            filename: path.join(__dirname, '../../logs/exceptions.log')
        })
    ],
    rejectionHandlers: [
        new transports.File({
            filename: path.join(__dirname, '../../logs/exceptions.log')
        })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
        format: combine(
            colorize(),
            printf(({ timestamp, level, message, stack, ...meta }) => {
                const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
                return `${timestamp} ${level}: ${stack || message}${metaStr}`;
            })
        )
    }));
}

module.exports = logger;
