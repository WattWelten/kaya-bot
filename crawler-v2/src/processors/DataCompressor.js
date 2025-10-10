const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const Logger = require('../utils/Logger');

class DataCompressor {
    constructor() {
        this.logger = new Logger('DataCompressor');
    }

    async compressAll(data, timestamp) {
        this.logger.info('📦 Komprimiere alle Agent-Daten...');
        
        const compressedData = {};
        
        for (const [agentName, agentData] of Object.entries(data)) {
            try {
                compressedData[agentName] = await this.compressAgentData(agentName, agentData, timestamp);
                this.logger.info(`✅ ${agentName} komprimiert: ${compressedData[agentName].length} Einträge`);
            } catch (error) {
                this.logger.error(`❌ Kompressionsfehler für ${agentName}:`, error);
                compressedData[agentName] = [];
            }
        }
        
        // Speichere komprimierte Daten
        await this.saveCompressedData(compressedData, timestamp);
        
        return compressedData;
    }

    async compressAgentData(agentName, data, timestamp) {
        const compressedData = [];
        
        for (const item of data) {
            const compressedItem = {
                url: item.url,
                title: item.title,
                content: this.compressContent(item.content),
                plain_text: this.compressContent(item.plain_text),
                contacts: item.contacts,
                forms: item.forms,
                links: item.links,
                metadata: {
                    ...item.metadata,
                    compressed: true,
                    compression_ratio: this.calculateCompressionRatio(item.content, item.plain_text)
                }
            };
            
            compressedData.push(compressedItem);
        }
        
        return compressedData;
    }

    compressContent(content) {
        if (!content) return '';
        
        // Entferne überflüssige Leerzeichen und Zeilenumbrüche
        return content
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n')
            .trim();
    }

    calculateCompressionRatio(originalContent, compressedContent) {
        if (!originalContent || !compressedContent) return 1;
        
        const originalSize = originalContent.length;
        const compressedSize = compressedContent.length;
        
        return compressedSize / originalSize;
    }

    async saveCompressedData(data, timestamp) {
        const dataDir = path.join(__dirname, '../../data');
        const compressedDir = path.join(dataDir, 'compressed');
        
        // Erstelle Verzeichnis für komprimierte Daten
        const timestampDir = path.join(compressedDir, `${timestamp}-compressed`);
        await fs.ensureDir(timestampDir);
        
        // Speichere einzelne Agent-Dateien
        for (const [agentName, agentData] of Object.entries(data)) {
            const filePath = path.join(timestampDir, `${agentName}_data_compressed.json`);
            await fs.writeJson(filePath, agentData, { spaces: 2 });
        }
        
        // Erstelle ZIP-Archiv
        await this.createZipArchive(timestampDir, `${timestamp}-compressed.zip`);
        
        this.logger.info(`💾 Komprimierte Daten gespeichert: ${timestampDir}`);
    }

    async createZipArchive(sourceDir, zipName) {
        const dataDir = path.join(__dirname, '../../data');
        const zipPath = path.join(dataDir, 'compressed', zipName);
        
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(zipPath);
            const archive = archiver('zip', { zlib: { level: 9 } });
            
            output.on('close', () => {
                this.logger.info(`📦 ZIP-Archiv erstellt: ${zipPath} (${archive.pointer()} bytes)`);
                resolve();
            });
            
            archive.on('error', (err) => {
                reject(err);
            });
            
            archive.pipe(output);
            archive.directory(sourceDir, false);
            archive.finalize();
        });
    }

    // Decompress data
    async decompressData(compressedData) {
        const decompressedData = [];
        
        for (const item of compressedData) {
            const decompressedItem = {
                ...item,
                content: this.decompressContent(item.content),
                plain_text: this.decompressContent(item.plain_text),
                metadata: {
                    ...item.metadata,
                    compressed: false
                }
            };
            
            decompressedData.push(decompressedItem);
        }
        
        return decompressedData;
    }

    decompressContent(content) {
        // Einfache Dekompression - in der Realität würde man hier komplexere Algorithmen verwenden
        return content;
    }
}

module.exports = DataCompressor;
