'use strict';
const winston = require('winston');
const logger = winston.createLogger({
	level: 'error',
	format: winston.format.json(),
	defaultMeta: { service: 'user-service' },
	transports: [
		//
		// - Write to all logs with level `info` and below to `combined.log`
		// - Write all logs error (and below) to `error.log`.
		//
		new winston.transports.File({
			filename: 'logs/info.log',
			level: 'error',
		}),
		new winston.transports.File({ filename: 'logs/combined.log' }),
	],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
	logger.add(
		new winston.transports.Console({
			format: winston.format.simple(),
		}),
	);
}

module.exports = logger;
