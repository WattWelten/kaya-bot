const fs = require('fs');
const path = require('path');

class KAYAAgentHandler {
    constructor() {
        this.agentData = {};
        this.loadAgentData();
    }
    
    loadAgentData() {
        const agentDataDir = path.join(__dirname, '../ki_backend', new Date().toISOString().split('T')[0]);
        
        const agents = ['buergerdienste', 'ratsinfo', 'stellenportal', 'kontakte', 'jobcenter', 'schule', 'jugend', 'soziales'];
        
        agents.forEach(agent => {
            const dataFile = path.join(agentDataDir, `${agent}_data.json`);
            if (fs.existsSync(dataFile)) {
                this.agentData[agent] = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
                console.log(`Agent ${agent}: ${this.agentData[agent].length} Einträge geladen`);
            }
        });
    }
    
    routeToAgent(query) {
        const queryLower = query.toLowerCase();
        
        // Routing-Logik basierend auf Keywords
        if (this.containsKeywords(queryLower, ['formular', 'antrag', 'dienstleistung', 'gebühr', 'unterlage'])) {
            return 'buergerdienste';
        }
        if (this.containsKeywords(queryLower, ['sitzung', 'kreistag', 'tagesordnung', 'beschluss', 'vorlage'])) {
            return 'ratsinfo';
        }
        if (this.containsKeywords(queryLower, ['stelle', 'job', 'bewerbung', 'ausbildung', 'praktikum'])) {
            return 'stellenportal';
        }
        if (this.containsKeywords(queryLower, ['kontakt', 'telefon', 'email', 'sprechzeit', 'öffnungszeit'])) {
            return 'kontakte';
        }
        if (this.containsKeywords(queryLower, ['arbeitslosengeld', 'jobsuche', 'vermittlung', 'beratung'])) {
            return 'jobcenter';
        }
        if (this.containsKeywords(queryLower, ['schule', 'schulanmeldung', 'schulwechsel', 'bildung'])) {
            return 'schule';
        }
        if (this.containsKeywords(queryLower, ['jugend', 'jugendamt', 'jugendhilfe', 'freizeit'])) {
            return 'jugend';
        }
        if (this.containsKeywords(queryLower, ['sozialhilfe', 'wohngeld', 'hilfe zur pflege', 'sozialleistung'])) {
            return 'soziales';
        }
        
        return 'kaya'; // Fallback
    }
    
    containsKeywords(text, keywords) {
        return keywords.some(keyword => text.includes(keyword));
    }
    
    getAgentData(agent) {
        return this.agentData[agent] || [];
    }
    
    searchAgentData(agent, query) {
        const data = this.getAgentData(agent);
        const queryLower = query.toLowerCase();
        
        console.log(`Suche in Agent ${agent}: "${query}"`);
        console.log(`Verfügbare Daten: ${data.length} Einträge`);
        
        const results = data.filter(item => {
            // Suche in Titel
            const title = (item.title || '').toLowerCase();
            if (title.includes(queryLower)) {
                console.log(`Gefunden im Titel: ${item.title}`);
                return true;
            }
            
            // Suche in Formularen
            if (item.forms && Array.isArray(item.forms)) {
                for (const form of item.forms) {
                    const formName = (form.name || '').toLowerCase();
                    if (formName.includes(queryLower)) {
                        console.log(`Gefunden in Formular: ${form.name}`);
                        return true;
                    }
                }
            }
            
            // Suche in URL
            const url = (item.url || '').toLowerCase();
            if (url.includes(queryLower)) {
                console.log(`Gefunden in URL: ${item.url}`);
                return true;
            }
            
            // Suche mit Keywords
            const keywords = queryLower.split(' ');
            for (const keyword of keywords) {
                if (keyword.length > 2) { // Nur relevante Keywords
                    if (title.includes(keyword) || url.includes(keyword)) {
                        console.log(`Gefunden mit Keyword "${keyword}": ${item.title}`);
                        return true;
                    }
                }
            }
            
            return false;
        });
        
        console.log(`Gefunden: ${results.length} Ergebnisse`);
        return results;
    }
    
    hasRelevantContent(item, keyword) {
        // Prüfe spezifische Felder je nach Agent
        const relevantFields = [];
        
        if (item.forms) relevantFields.push(...item.forms.map(f => f.name || ''));
        if (item.contacts) relevantFields.push(...item.contacts.map(c => c.name || ''));
        if (item.meetings) relevantFields.push(...item.meetings.map(m => m.type || ''));
        if (item.job_postings) relevantFields.push(...item.job_postings.map(j => j.title || ''));
        
        const allText = relevantFields.join(' ').toLowerCase();
        return allText.includes(keyword);
    }
}

module.exports = KAYAAgentHandler;