const winston = require('winston');
const path = require('path');

class Logger {
    constructor(module) {
        this.module = module;
        
        // Erstelle Logs-Verzeichnis
        const logsDir = path.join(__dirname, '../../logs');
        require('fs-extra').ensureDirSync(logsDir);
        
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { module: this.module },
            transports: [
                // Console-Output
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.simple(),
                        winston.format.printf(({ timestamp, level, message, module }) => {
                            return `${timestamp} [${module}] ${level}: ${message}`;
                        })
                    )
                }),
                // File-Output
                new winston.transports.File({
                    filename: path.join(logsDir, 'crawler.log'),
                    maxsize: 5242880, // 5MB
                    maxFiles: 5
                }),
                // Error-File
                new winston.transports.File({
                    filename: path.join(logsDir, 'error.log'),
                    level: 'error',
                    maxsize: 5242880,
                    maxFiles: 5
                })
            ]
        });
    }

    info(message, ...args) {
        this.logger.info(message, ...args);
    }

    error(message, ...args) {
        this.logger.error(message, ...args);
    }

    warn(message, ...args) {
        this.logger.warn(message, ...args);
    }

    debug(message, ...args) {
        this.logger.debug(message, ...args);
    }
}

module.exports = Logger;
