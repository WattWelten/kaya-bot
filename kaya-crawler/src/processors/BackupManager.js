const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const Logger = require('../utils/Logger');

class BackupManager {
    constructor() {
        this.logger = new Logger('BackupManager');
        this.dataDir = path.join(__dirname, '../../data');
        this.backupDir = path.join(this.dataDir, 'backup');
    }

    async createBackup(timestamp) {
        this.logger.info('💾 Erstelle Backup...');
        
        try {
            // Erstelle Backup-Verzeichnis
            await fs.ensureDir(this.backupDir);
            
            // Backup aller Daten
            await this.backupRawData(timestamp);
            await this.backupProcessedData(timestamp);
            await this.backupCompressedData(timestamp);
            
            // Erstelle vollständiges Backup-Archiv
            await this.createFullBackup(timestamp);
            
            // Bereinige alte Backups
            await this.cleanupOldBackups();
            
            this.logger.info('✅ Backup erfolgreich erstellt');
            
        } catch (error) {
            this.logger.error('❌ Backup-Fehler:', error);
            throw error;
        }
    }

    async backupRawData(timestamp) {
        const rawDir = path.join(this.dataDir, 'raw');
        const backupRawDir = path.join(this.backupDir, 'raw');
        
        await fs.ensureDir(backupRawDir);
        
        // Kopiere alle Raw-Dateien
        const files = await fs.readdir(rawDir);
        for (const file of files) {
            if (file.endsWith('.json')) {
                const sourcePath = path.join(rawDir, file);
                const backupPath = path.join(backupRawDir, file);
                await fs.copy(sourcePath, backupPath);
            }
        }
        
        this.logger.info(`📁 Raw-Daten gesichert: ${files.length} Dateien`);
    }

    async backupProcessedData(timestamp) {
        const processedDir = path.join(this.dataDir, 'processed');
        const backupProcessedDir = path.join(this.backupDir, 'processed');
        
        await fs.ensureDir(backupProcessedDir);
        
        // Kopiere alle Processed-Dateien
        const files = await fs.readdir(processedDir);
        for (const file of files) {
            if (file.endsWith('.json')) {
                const sourcePath = path.join(processedDir, file);
                const backupPath = path.join(backupProcessedDir, file);
                await fs.copy(sourcePath, backupPath);
            }
        }
        
        this.logger.info(`📁 Processed-Daten gesichert: ${files.length} Dateien`);
    }

    async backupCompressedData(timestamp) {
        const compressedDir = path.join(this.dataDir, 'compressed');
        const backupCompressedDir = path.join(this.backupDir, 'compressed');
        
        await fs.ensureDir(backupCompressedDir);
        
        // Kopiere alle Compressed-Dateien
        const files = await fs.readdir(compressedDir);
        for (const file of files) {
            if (file.endsWith('.json') || file.endsWith('.zip')) {
                const sourcePath = path.join(compressedDir, file);
                const backupPath = path.join(backupCompressedDir, file);
                await fs.copy(sourcePath, backupPath);
            }
        }
        
        this.logger.info(`📁 Compressed-Daten gesichert: ${files.length} Dateien`);
    }

    async createFullBackup(timestamp) {
        const backupArchivePath = path.join(this.backupDir, `full_backup_${timestamp}.zip`);
        
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(backupArchivePath);
            const archive = archiver('zip', { zlib: { level: 9 } });
            
            output.on('close', () => {
                this.logger.info(`📦 Vollständiges Backup erstellt: ${backupArchivePath} (${archive.pointer()} bytes)`);
                resolve();
            });
            
            archive.on('error', (err) => {
                reject(err);
            });
            
            archive.pipe(output);
            
            // Füge alle Daten-Verzeichnisse hinzu
            archive.directory(path.join(this.dataDir, 'raw'), 'raw');
            archive.directory(path.join(this.dataDir, 'processed'), 'processed');
            archive.directory(path.join(this.dataDir, 'compressed'), 'compressed');
            
            archive.finalize();
        });
    }

    async cleanupOldBackups() {
        const maxBackups = 10; // Behalte nur die letzten 10 Backups
        
        try {
            const files = await fs.readdir(this.backupDir);
            const backupFiles = files
                .filter(file => file.startsWith('full_backup_') && file.endsWith('.zip'))
                .sort()
                .reverse();
            
            if (backupFiles.length > maxBackups) {
                const filesToDelete = backupFiles.slice(maxBackups);
                
                for (const file of filesToDelete) {
                    const filePath = path.join(this.backupDir, file);
                    await fs.remove(filePath);
                    this.logger.info(`🗑️ Altes Backup gelöscht: ${file}`);
                }
            }
            
        } catch (error) {
            this.logger.error('Fehler beim Bereinigen alter Backups:', error);
        }
    }

    async restoreBackup(backupName) {
        this.logger.info(`🔄 Stelle Backup wieder her: ${backupName}`);
        
        try {
            const backupPath = path.join(this.backupDir, backupName);
            
            if (!await fs.pathExists(backupPath)) {
                throw new Error(`Backup nicht gefunden: ${backupName}`);
            }
            
            // Extrahiere Backup
            await this.extractBackup(backupPath);
            
            this.logger.info('✅ Backup erfolgreich wiederhergestellt');
            
        } catch (error) {
            this.logger.error('❌ Backup-Wiederherstellungsfehler:', error);
            throw error;
        }
    }

    async extractBackup(backupPath) {
        // Einfache Extraktion - in der Realität würde man hier eine ZIP-Bibliothek verwenden
        this.logger.info(`📦 Extrahiere Backup: ${backupPath}`);
        
        // Hier würde die tatsächliche Extraktion stattfinden
        // Für jetzt simulieren wir es
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    async listBackups() {
        try {
            const files = await fs.readdir(this.backupDir);
            const backupFiles = files
                .filter(file => file.startsWith('full_backup_') && file.endsWith('.zip'))
                .sort()
                .reverse();
            
            return backupFiles;
            
        } catch (error) {
            this.logger.error('Fehler beim Auflisten der Backups:', error);
            return [];
        }
    }
}

module.exports = BackupManager;

