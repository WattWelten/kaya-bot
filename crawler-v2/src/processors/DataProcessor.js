const Logger = require('../utils/Logger');

class DataProcessor {
    constructor() {
        this.logger = new Logger('DataProcessor');
    }

    async processAll(agentData) {
        this.logger.info('🔄 Verarbeite alle Agent-Daten...');
        
        const processedData = {};
        
        for (const [agentName, data] of Object.entries(agentData)) {
            if (data.error) {
                this.logger.error(`Skippe ${agentName} wegen Fehler: ${data.error}`);
                continue;
            }
            
            try {
                processedData[agentName] = await this.processAgentData(agentName, data);
                this.logger.info(`✅ ${agentName} verarbeitet: ${processedData[agentName].length} Einträge`);
            } catch (error) {
                this.logger.error(`❌ Verarbeitungsfehler für ${agentName}:`, error);
                processedData[agentName] = [];
            }
        }
        
        return processedData;
    }

    async processAgentData(agentName, rawData) {
        const processedData = [];
        
        for (const item of rawData) {
            try {
                const processedItem = await this.processItem(item, agentName);
                if (processedItem) {
                    processedData.push(processedItem);
                }
            } catch (error) {
                this.logger.error(`Fehler beim Verarbeiten von Item:`, error);
            }
        }
        
        // Entferne Duplikate
        return this.removeDuplicates(processedData);
    }

    async processItem(item, agentName) {
        const title = item.title || this.generateTitle(item);
        // Fallback: Wenn kein Content, verwende mindestens Titel oder URL als Content
        const fallbackContent = item.content || item.plain_text || title || item.url || '';
        
        const processedItem = {
            url: item.url || item.source,
            title: title,
            content: fallbackContent, // IMMER mindestens Titel/URL als Content
            plain_text: item.plain_text || item.content || fallbackContent,
            contacts: [],
            forms: [],
            links: [],
            metadata: {
                agent: agentName,
                type: item.type,
                source: item.source || item.url,
                timestamp: new Date().toISOString()
            }
        };
        
        // Verarbeite verschiedene Item-Typen
        switch (item.type) {
            case 'content':
                processedItem.content = this.cleanContent(item.content);
                processedItem.plain_text = this.cleanContent(item.plain_text);
                // Speichere sectionType für Content-Einträge
                if (item.sectionType) {
                    processedItem.metadata.sectionType = item.sectionType;
                }
                break;
                
            case 'contact':
                // Kontakte bekommen den Wert als Content
                const contactValue = item.value || '';
                processedItem.content = processedItem.content || contactValue;
                processedItem.plain_text = processedItem.plain_text || contactValue;
                processedItem.contacts.push({
                    type: item.contactType,
                    value: contactValue
                });
                break;
                
            case 'form':
                // Formulare bekommen mindestens Titel als Content
                const formTitle = item.title || 'Formular';
                processedItem.content = processedItem.content || formTitle;
                processedItem.plain_text = processedItem.plain_text || formTitle;
                processedItem.forms.push({
                    type: 'form',
                    title: formTitle,
                    url: item.url
                });
                break;
                
            case 'pdf':
                // PDFs bekommen mindestens Titel als Content
                const pdfTitle = item.title || 'PDF-Dokument';
                processedItem.content = processedItem.content || pdfTitle;
                processedItem.plain_text = processedItem.plain_text || pdfTitle;
                processedItem.forms.push({
                    type: 'pdf',
                    title: pdfTitle,
                    url: item.url
                });
                break;
                
            case 'link':
                // Links können jetzt auch Content haben (Context) - auch wenn nur 30 Zeichen
                if (item.content || item.plain_text) {
                    const linkContent = item.content || item.plain_text || '';
                    // Auch kurzer Content wird gespeichert (ab 30 Zeichen)
                    if (linkContent.trim().length >= 30) {
                        processedItem.content = this.cleanContent(linkContent);
                        processedItem.plain_text = this.cleanContent(item.plain_text || item.content);
                    }
                }
                processedItem.links.push({
                    title: item.title,
                    url: item.url
                });
                break;
        }
        
        return processedItem;
    }

    cleanContent(content) {
        if (!content) return '';
        
        return content
            .replace(/\s+/g, ' ') // Mehrfache Leerzeichen zu einem
            .replace(/\n\s*\n/g, '\n') // Mehrfache Zeilenumbrüche zu einem
            .trim();
    }

    generateTitle(item) {
        if (item.title) return item.title;
        if (item.url) {
            const urlParts = item.url.split('/');
            return urlParts[urlParts.length - 1] || 'Unbekannt';
        }
        return 'Unbekannt';
    }

    removeDuplicates(data) {
        const seen = new Set();
        return data.filter(item => {
            const key = `${item.url}_${item.title}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    // Validiere Links
    async validateLinks(data) {
        this.logger.info('🔍 Validiere Links...');
        
        for (const item of data) {
            // Validiere Formulare
            for (const form of item.forms) {
                if (form.url) {
                    form.valid = await this.validateUrl(form.url);
                }
            }
            
            // Validiere Links
            for (const link of item.links) {
                if (link.url) {
                    link.valid = await this.validateUrl(link.url);
                }
            }
        }
        
        return data;
    }

    async validateUrl(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

module.exports = DataProcessor;

