const fs = require('fs-extra');
const path = require('path');
const Logger = require('../utils/Logger');

class FileCrawler {
    constructor() {
        this.logger = new Logger('FileCrawler');
        this.supportedFormats = ['.txt', '.md', '.csv', '.json', '.xml'];
    }

    async crawl(filePath) {
        this.logger.info(`📄 Crawle Datei: ${filePath}`);
        
        try {
            // Prüfe ob Datei existiert
            if (!await fs.pathExists(filePath)) {
                throw new Error(`Datei nicht gefunden: ${filePath}`);
            }
            
            // Prüfe Dateiformat
            const ext = path.extname(filePath).toLowerCase();
            if (!this.supportedFormats.includes(ext)) {
                throw new Error(`Nicht unterstütztes Format: ${ext}`);
            }
            
            // Lese Datei
            const content = await fs.readFile(filePath, 'utf8');
            
            // Extrahiere strukturierte Daten
            const data = this.extractStructuredData(content, filePath, ext);
            
            this.logger.info(`✅ Erfolgreich gecrawlt: ${data.length} Einträge`);
            return data;
            
        } catch (error) {
            this.logger.error(`❌ File-Crawl-Fehler für ${filePath}:`, error);
            return [];
        }
    }

    extractStructuredData(content, filePath, ext) {
        const data = [];
        
        switch (ext) {
            case '.txt':
            case '.md':
                data.push(...this.extractFromText(content, filePath));
                break;
            case '.csv':
                data.push(...this.extractFromCSV(content, filePath));
                break;
            case '.json':
                data.push(...this.extractFromJSON(content, filePath));
                break;
            case '.xml':
                data.push(...this.extractFromXML(content, filePath));
                break;
        }
        
        return data;
    }

    extractFromText(content, filePath) {
        const data = [];
        const lines = content.split('\n');
        
        // Extrahiere Kontakte
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const phoneRegex = /(\+?49\s?)?(\(?0?\)?[1-9]\d{1,4}\)?[\s\-]?\d{1,4}[\s\-]?\d{1,4}[\s\-]?\d{1,4})/g;
        
        const emails = content.match(emailRegex);
        if (emails) {
            emails.forEach(email => {
                data.push({
                    type: 'contact',
                    contactType: 'email',
                    value: email,
                    source: filePath
                });
            });
        }
        
        const phones = content.match(phoneRegex);
        if (phones) {
            phones.forEach(phone => {
                data.push({
                    type: 'contact',
                    contactType: 'phone',
                    value: phone.trim(),
                    source: filePath
                });
            });
        }
        
        // Extrahiere Hauptinhalt
        if (content.length > 100) {
            data.push({
                type: 'content',
                url: filePath,
                title: path.basename(filePath, path.extname(filePath)),
                content: content,
                plain_text: content,
                source: filePath
            });
        }
        
        return data;
    }

    extractFromCSV(content, filePath) {
        const data = [];
        const lines = content.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const row = {};
            
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            
            data.push({
                type: 'csv_row',
                data: row,
                source: filePath
            });
        }
        
        return data;
    }

    extractFromJSON(content, filePath) {
        const data = [];
        
        try {
            const jsonData = JSON.parse(content);
            
            if (Array.isArray(jsonData)) {
                jsonData.forEach((item, index) => {
                    data.push({
                        type: 'json_item',
                        data: item,
                        source: filePath,
                        index: index
                    });
                });
            } else {
                data.push({
                    type: 'json_object',
                    data: jsonData,
                    source: filePath
                });
            }
        } catch (error) {
            this.logger.error(`JSON-Parse-Fehler für ${filePath}:`, error);
        }
        
        return data;
    }

    extractFromXML(content, filePath) {
        const data = [];
        
        // Einfache XML-Extraktion (für komplexere XML-Parsing würde man eine Bibliothek verwenden)
        const tagRegex = /<(\w+)[^>]*>(.*?)<\/\1>/g;
        let match;
        
        while ((match = tagRegex.exec(content)) !== null) {
            data.push({
                type: 'xml_element',
                tag: match[1],
                content: match[2],
                source: filePath
            });
        }
        
        return data;
    }
}

module.exports = FileCrawler;

