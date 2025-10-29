#!/usr/bin/env node

/**
 * Scheduled Crawler - Automatisiertes tägliches Crawling
 * 
 * Läuft täglich um 5:00 Uhr morgens via Cron-Job
 * Crawlt alle Agenten, validiert Daten und benachrichtigt bei Erfolg/Fehler
 */

const cron = require('node-cron');
const path = require('path');
const CrawlerEngine = require('../src/core/CrawlerEngine');
const Logger = require('../src/utils/Logger');

class ScheduledCrawler {
    constructor() {
        this.logger = new Logger('ScheduledCrawler');
        this.crawler = null;
        this.isRunning = false;
        this.lastRun = null;
        this.runHistory = [];
        
        // Konfiguration
        this.config = {
            cronPattern: process.env.CRAWLER_SCHEDULE || '0 5 * * *', // Default: 5:00 Uhr
            maxRetries: 3,
            retryDelay: 60000, // 1 Minute
            enableNotifications: process.env.CRAWLER_NOTIFICATIONS === 'true'
        };
    }

    /**
     * Führt einen vollständigen Crawl-Durchlauf durch
     */
    async runCrawl() {
        if (this.isRunning) {
            this.logger.warn('⚠️ Crawl läuft bereits, überspringe diesen Durchlauf');
            return;
        }

        this.isRunning = true;
        const startTime = Date.now();
        const timestamp = new Date().toISOString();

        try {
            this.logger.info('🚀 Starte automatisierten Crawl...');
            
            this.crawler = new CrawlerEngine();
            
            // Führe vollständigen Crawl durch
            const results = await this.crawler.crawlAll();
            
            // Validierung
            const validation = await this.validateResults(results);
            
            const duration = Date.now() - startTime;
            const success = validation.success;

            // Speichere Run-History
            this.runHistory.push({
                timestamp,
                duration,
                success,
                agentCount: Object.keys(results).length,
                totalEntries: validation.totalEntries,
                errors: validation.errors,
                warnings: validation.warnings
            });

            // Behalte nur die letzten 30 Runs
            if (this.runHistory.length > 30) {
                this.runHistory.shift();
            }

            this.lastRun = {
                timestamp,
                duration,
                success,
                validation
            };

            if (success) {
                this.logger.info(`✅ Crawl erfolgreich abgeschlossen in ${(duration / 1000).toFixed(1)}s`);
                this.logger.info(`📊 ${validation.totalEntries} Einträge über ${Object.keys(results).length} Agenten`);
                
                if (this.config.enableNotifications) {
                    await this.sendNotification('success', {
                        duration,
                        agentCount: Object.keys(results).length,
                        totalEntries: validation.totalEntries
                    });
                }
            } else {
                this.logger.warn(`⚠️ Crawl abgeschlossen mit Warnungen: ${validation.warnings.length} Warnungen`);
                
                if (this.config.enableNotifications) {
                    await this.sendNotification('warning', {
                        duration,
                        warnings: validation.warnings
                    });
                }
            }

            // Schließe Browser
            if (this.crawler && this.crawler.webCrawler) {
                await this.crawler.webCrawler.close();
            }

        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error(`❌ Crawl-Fehler nach ${(duration / 1000).toFixed(1)}s:`, error);
            
            this.runHistory.push({
                timestamp,
                duration,
                success: false,
                error: error.message
            });

            if (this.config.enableNotifications) {
                await this.sendNotification('error', {
                    duration,
                    error: error.message
                });
            }

            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Validiert Crawl-Ergebnisse
     */
    async validateResults(results) {
        const validation = {
            success: true,
            totalEntries: 0,
            errors: [],
            warnings: []
        };

        for (const [agent, data] of Object.entries(results)) {
            if (data.error) {
                validation.success = false;
                validation.errors.push({
                    agent,
                    error: data.error
                });
            } else if (Array.isArray(data)) {
                validation.totalEntries += data.length;
                
                // Warnung bei sehr wenigen Einträgen
                if (data.length < 5) {
                    validation.warnings.push({
                        agent,
                        message: `Nur ${data.length} Einträge (erwartet: >5)`
                    });
                }

                // Warnung bei leeren Einträgen
                const emptyEntries = data.filter(item => !item.content || item.content.trim().length === 0);
                if (emptyEntries.length > 0) {
                    validation.warnings.push({
                        agent,
                        message: `${emptyEntries.length} leere Einträge gefunden`
                    });
                }
            }
        }

        return validation;
    }

    /**
     * Sendet Benachrichtigung (E-Mail, Webhook, etc.)
     */
    async sendNotification(type, data) {
        // TODO: Implementiere E-Mail/Webhook-Integration
        this.logger.info(`📧 Notification ${type}:`, data);
    }

    /**
     * Startet den Scheduled Crawler
     */
    start() {
        if (!cron.validate(this.config.cronPattern)) {
            throw new Error(`Ungültiges Cron-Pattern: ${this.config.cronPattern}`);
        }

        this.logger.info(`⏰ Scheduled Crawler gestartet (Pattern: ${this.config.cronPattern})`);
        this.logger.info(`📅 Nächster Lauf: täglich um 5:00 Uhr morgens`);

        // Cron-Job einrichten
        this.cronJob = cron.schedule(this.config.cronPattern, async () => {
            try {
                await this.runCrawl();
            } catch (error) {
                this.logger.error('❌ Fehler im Scheduled Crawl:', error);
            }
        }, {
            scheduled: true,
            timezone: "Europe/Berlin"
        });

        // Optional: Sofort ausführen für Tests
        if (process.env.CRAWLER_RUN_IMMEDIATELY === 'true') {
            this.logger.info('🔧 Sofortiger Test-Lauf aktiviert');
            setTimeout(async () => {
                try {
                    await this.runCrawl();
                } catch (error) {
                    this.logger.error('❌ Fehler im Test-Lauf:', error);
                }
            }, 5000);
        }
    }

    /**
     * Stoppt den Scheduled Crawler
     */
    stop() {
        if (this.cronJob) {
            this.cronJob.stop();
            this.logger.info('🛑 Scheduled Crawler gestoppt');
        }
    }

    /**
     * Gibt Status zurück
     */
    getStatus() {
        return {
            running: this.isRunning,
            lastRun: this.lastRun,
            nextRun: this.cronJob ? 'Täglich 5:00 Uhr' : 'Nicht geplant',
            history: this.runHistory.slice(-10), // Letzte 10 Runs
            config: this.config
        };
    }
}

// Main: Starte Scheduled Crawler wenn direkt aufgerufen
if (require.main === module) {
    const crawler = new ScheduledCrawler();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Beende Scheduled Crawler...');
        crawler.stop();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('\n🛑 Beende Scheduled Crawler...');
        crawler.stop();
        process.exit(0);
    });

    // Starte Crawler
    crawler.start();
    
    // Keep process alive
    setInterval(() => {
        // Heartbeat
    }, 60000);
}

module.exports = ScheduledCrawler;

