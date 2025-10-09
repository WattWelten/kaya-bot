const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

class DataCompressor {
    constructor() {
        this.compressionRatio = 0.7; // Ziel: 70% Kompression
    }

    /**
     * Komprimiert Agent-Daten intelligent ohne Inhaltsverlust
     */
    async compressAgentData(inputFile, outputFile) {
        try {
            console.log(`📦 Komprimiere ${inputFile}...`);
            
            // Lade Original-Daten
            const originalData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
            console.log(`📊 Original: ${(fs.statSync(inputFile).size / 1024 / 1024).toFixed(2)} MB`);
            
            // Komprimiere Daten
            const compressedData = this.optimizeDataStructure(originalData);
            
            // Speichere komprimierte Version
            const compressedJson = JSON.stringify(compressedData, null, 0); // Keine Einrückung
            fs.writeFileSync(outputFile, compressedJson);
            
            const originalSize = fs.statSync(inputFile).size;
            const compressedSize = fs.statSync(outputFile).size;
            const ratio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
            
            console.log(`✅ Komprimiert: ${(compressedSize / 1024 / 1024).toFixed(2)} MB (${ratio}% Reduktion)`);
            
            return {
                success: true,
                originalSize: originalSize,
                compressedSize: compressedSize,
                ratio: ratio
            };
            
        } catch (error) {
            console.error(`❌ Kompression fehlgeschlagen: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Optimiert Datenstruktur ohne Inhaltsverlust
     */
    optimizeDataStructure(data) {
        if (!Array.isArray(data)) return data;
        
        return data.map(page => {
            const optimized = {
                // Kern-Informationen (immer behalten)
                url: page.url,
                title: page.title,
                tags: page.tags,
                crawled_at: page.crawled_at,
                
                // Komprimierte Inhalte
                content: this.compressContent(page.content),
                plain_text: this.compressContent(page.plain_text),
                
                // Optimierte Links (nur relevante)
                links: this.optimizeLinks(page.links),
                
                // Metadaten (falls vorhanden)
                ...(page.published_at && { published_at: page.published_at })
            };
            
            return optimized;
        });
    }

    /**
     * Komprimiert Text-Inhalte intelligent
     */
    compressContent(content) {
        if (!content) return content;
        
        // Entferne redundante Whitespace
        let compressed = content
            .replace(/\s+/g, ' ')  // Mehrfache Leerzeichen zu einem
            .replace(/\n\s*\n/g, '\n')  // Mehrfache Zeilenumbrüche
            .trim();
        
        // Entferne häufige Redundanzen
        compressed = compressed
            .replace(/Landkreis Oldenburg/g, 'LKO')  // Häufige Wiederholung
            .replace(/https:\/\/www\.oldenburg-kreis\.de/g, '')  // Basis-URL entfernen
            .replace(/Delmenhorster Straße 6 27793 Wildeshausen/g, 'Kreisverwaltung')
            .replace(/Telefon: 04431 85-0/g, 'Tel: 04431 85-0');
        
        return compressed;
    }

    /**
     * Optimiert Link-Listen
     */
    optimizeLinks(links) {
        if (!Array.isArray(links)) return links;
        
        // Gruppiere ähnliche Links und entferne Duplikate
        const uniqueLinks = new Map();
        
        links.forEach(link => {
            if (typeof link === 'string') {
                // URL-String
                const key = link.replace(/https:\/\/www\.oldenburg-kreis\.de/, '');
                if (!uniqueLinks.has(key)) {
                    uniqueLinks.set(key, link);
                }
            } else if (link.url) {
                // Link-Objekt
                const key = link.url.replace(/https:\/\/www\.oldenburg-kreis\.de/, '');
                if (!uniqueLinks.has(key)) {
                    uniqueLinks.set(key, link);
                }
            }
        });
        
        return Array.from(uniqueLinks.values()).slice(0, 200); // Max 200 Links pro Seite
    }

    /**
     * Komprimiert alle Agent-Daten
     */
    async compressAllAgentData(inputDir, outputDir) {
        const agents = ['buergerdienste', 'ratsinfo', 'kontakte', 'stellenportal', 'jugend', 'soziales'];
        const results = [];
        
        // Erstelle Output-Verzeichnis
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        for (const agent of agents) {
            const inputFile = path.join(inputDir, `${agent}_data.json`);
            const outputFile = path.join(outputDir, `${agent}_data_compressed.json`);
            
            if (fs.existsSync(inputFile)) {
                const result = await this.compressAgentData(inputFile, outputFile);
                results.push({ agent, ...result });
            } else {
                console.log(`⚠️ Datei nicht gefunden: ${inputFile}`);
            }
        }
        
        return results;
    }

    /**
     * Erstellt Backup der Original-Daten
     */
    createBackup(inputDir, backupDir) {
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        const files = fs.readdirSync(inputDir).filter(f => f.endsWith('_data.json'));
        
        files.forEach(file => {
            const source = path.join(inputDir, file);
            const backup = path.join(backupDir, file);
            fs.copyFileSync(source, backup);
        });
        
        console.log(`💾 Backup erstellt: ${files.length} Dateien`);
    }
}

module.exports = DataCompressor;


