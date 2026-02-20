const logger = require('../config/logger');

module.exports = (err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: err.message
    });
};