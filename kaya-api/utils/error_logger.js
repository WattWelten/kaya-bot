const fs = require('fs-extra');
const path = require('path');

/**
 * KAYA Error Logger
 * Loggt Fehler in Dateien für Debugging und Monitoring
 */

class ErrorLogger {
    constructor() {
        this.logDir = path.join(__dirname, '../logs');
        this.errorLogFile = path.join(this.logDir, 'error.log');
        this.accessLogFile = path.join(this.logDir, 'access.log');
        
        // Erstelle log-Verzeichnis falls nicht vorhanden
        fs.ensureDirSync(this.logDir);
    }

    /**
     * Fehler loggen
     */
    logError(error, context = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            error: error.message,
            stack: error.stack,
            context
        };

        const logLine = JSON.stringify(logEntry) + '\n';
        
        try {
            fs.appendFileSync(this.errorLogFile, logLine);
            console.error('❌ Error logged:', error.message);
        } catch (err) {
            console.error('❌ Error logging failed:', err);
        }
    }

    /**
     * Request loggen
     */
    logRequest(req, res, responseTime = 0) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent')
        };

        const logLine = JSON.stringify(logEntry) + '\n';
        
        try {
            fs.appendFileSync(this.accessLogFile, logLine);
        } catch (err) {
            console.error('❌ Access logging failed:', err);
        }
    }

    /**
     * Performance loggen
     */
    logPerformance(endpoint, duration, success, error = null) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            endpoint,
            duration: `${duration}ms`,
            success,
            error: error ? error.message : null
        };

        const logLine = JSON.stringify(logEntry) + '\n';
        
        try {
            fs.appendFileSync(this.accessLogFile, logLine);
        } catch (err) {
            console.error('❌ Performance logging failed:', err);
        }
    }

    /**
     * Log-Files rotieren (älter als 30 Tage löschen)
     */
    rotateLogs() {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        try {
            const files = fs.readdirSync(this.logDir);
            
            files.forEach(file => {
                const filePath = path.join(this.logDir, file);
                const stats = fs.statSync(filePath);
                
                if (stats.mtime < thirtyDaysAgo) {
                    fs.unlinkSync(filePath);
                    console.log(`🗑️ Old log file deleted: ${file}`);
                }
            });
        } catch (err) {
            console.error('❌ Log rotation failed:', err);
        }
    }
}

module.exports = new ErrorLogger();

