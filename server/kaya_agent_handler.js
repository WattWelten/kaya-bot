const fs = require('fs');
const path = require('path');

class KAYAAgentHandler {
    constructor() {
        this.agentData = {};
        this.agentDataDir = path.join(__dirname, '../ki_backend', new Date().toISOString().split('T')[0]);
        this.agents = ['buergerdienste', 'ratsinfo', 'stellenportal', 'kontakte', 'jugend', 'soziales'];
        
        // Lazy Loading - nur Metadaten beim Start laden
        this.loadAgentMetadata();
    }
    
    loadAgentMetadata() {
        console.log('🔧 Lazy Loading: Lade nur Agent-Metadaten...');
        
        this.agents.forEach(agent => {
            const dataFile = path.join(this.agentDataDir, `${agent}_data.json`);
            if (fs.existsSync(dataFile)) {
                // Nur Dateigröße prüfen, nicht den ganzen Inhalt laden
                const stats = fs.statSync(dataFile);
                this.agentData[agent] = {
                    loaded: false,
                    filePath: dataFile,
                    fileSize: stats.size,
                    entryCount: 0 // Wird beim ersten Laden gesetzt
                };
                console.log(`✅ Agent ${agent}: Datei gefunden (${Math.round(stats.size/1024)}KB)`);
            } else {
                console.log(`⚠️ Agent ${agent}: Keine Daten gefunden`);
                this.agentData[agent] = { loaded: false, filePath: null, fileSize: 0, entryCount: 0 };
            }
        });
        
        console.log('📊 Lazy Loading aktiviert - Daten werden bei Bedarf geladen');
    }
    
    loadAgentData(agent) {
        if (!this.agentData[agent] || this.agentData[agent].loaded) {
            return this.agentData[agent];
        }
        
        console.log(`🔄 Lade Agent ${agent} bei Bedarf...`);
        
        try {
            const data = JSON.parse(fs.readFileSync(this.agentData[agent].filePath, 'utf8'));
            this.agentData[agent] = {
                loaded: true,
                data: data,
                entryCount: data.length
            };
            console.log(`✅ Agent ${agent}: ${data.length} Einträge geladen`);
            return this.agentData[agent];
        } catch (error) {
            console.error(`❌ Fehler beim Laden von Agent ${agent}:`, error.message);
            this.agentData[agent] = { loaded: false, data: [], entryCount: 0 };
            return this.agentData[agent];
        }
    }
    
    getTotalEntries() {
        let total = 0;
        this.agents.forEach(agent => {
            const agentInfo = this.agentData[agent];
            if (agentInfo && agentInfo.loaded) {
                total += agentInfo.entryCount;
            }
        });
        return total;
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
        const agentInfo = this.loadAgentData(agent);
        return agentInfo.data || [];
    }
    
    searchAgentData(agent, query) {
        const agentInfo = this.loadAgentData(agent);
        const data = agentInfo.data || [];
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