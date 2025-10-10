const fs = require('fs-extra');
const path = require('path');
const pdfParse = require('pdf-parse');
const Logger = require('../utils/Logger');

class PDFCrawler {
    constructor() {
        this.logger = new Logger('PDFCrawler');
    }

    async crawl(pdfPath) {
        this.logger.info(`📄 Crawle PDF: ${pdfPath}`);
        
        try {
            // Prüfe ob Datei existiert
            if (!await fs.pathExists(pdfPath)) {
                throw new Error(`PDF nicht gefunden: ${pdfPath}`);
            }
            
            // Prüfe Dateiformat
            const ext = path.extname(pdfPath).toLowerCase();
            if (ext !== '.pdf') {
                throw new Error(`Keine PDF-Datei: ${ext}`);
            }
            
            // Lese PDF-Datei
            const pdfBuffer = await fs.readFile(pdfPath);
            
            // Parse PDF
            const pdfData = await pdfParse(pdfBuffer);
            
            // Extrahiere strukturierte Daten
            const data = this.extractStructuredData(pdfData, pdfPath);
            
            this.logger.info(`✅ Erfolgreich gecrawlt: ${data.length} Einträge`);
            return data;
            
        } catch (error) {
            this.logger.error(`❌ PDF-Crawl-Fehler für ${pdfPath}:`, error);
            return [];
        }
    }

    extractStructuredData(pdfData, pdfPath) {
        const data = [];
        const content = pdfData.text;
        
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
                    source: pdfPath
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
                    source: pdfPath
                });
            });
        }
        
        // Extrahiere Formulare (PDF-spezifische Erkennung)
        const formRegex = /(Antrag|Formular|Beantragung|Anmeldung|Meldung)/gi;
        const formMatches = content.match(formRegex);
        if (formMatches) {
            data.push({
                type: 'form',
                url: pdfPath,
                title: `Formular in ${path.basename(pdfPath)}`,
                source: pdfPath
            });
        }
        
        // Extrahiere Hauptinhalt
        if (content.length > 100) {
            data.push({
                type: 'content',
                url: pdfPath,
                title: path.basename(pdfPath, '.pdf'),
                content: content,
                plain_text: content,
                source: pdfPath,
                metadata: {
                    pages: pdfData.numpages,
                    info: pdfData.info
                }
            });
        }
        
        return data;
    }
}

module.exports = PDFCrawler;

