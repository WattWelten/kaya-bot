const fs = require('fs-extra');
const path = require('path');

class KAYAAgentManager {
    constructor() {
        this.agents = new Map();
        this.verifiedFacts = null; // Wird beim ersten Zugriff geladen
        this.loadVerifiedFacts(); // Lade verifizierte Fakten beim Start
        
        // Agent-Daten-Pfad und weitere Initialisierung
        // Agent-Daten sind jetzt lokal in kaya-api/data/agents/ verfügbar
        // (kopiert von kaya-crawler/data/processed/)
        this.agentDataPath = path.join(__dirname, './data/agents');
        
        // Prüfe ob lokaler Pfad existiert, sonst Fallback zu altem Pfad
        if (!fs.existsSync(this.agentDataPath)) {
            console.warn('⚠️ Lokaler Agent-Daten-Pfad nicht gefunden, versuche Fallback');
            try {
                const { getKommuneConfig } = require('./config/kommune_config_loader');
                const kommuneConfig = getKommuneConfig();
                // Fallback: Alte Crawler-Pfad (für lokale Entwicklung)
                this.agentDataPath = path.join(__dirname, '../kaya-crawler/data/processed');
            } catch (error) {
                console.warn('⚠️ KommuneConfigLoader nicht verfügbar, verwende lokalen Pfad');
                // Bleibt bei lokalem Pfad
            }
        }
        this.cache = new Map();
        this.lastUpdate = null;
        this.updateInterval = 300000; // 5 Minuten
        this.fileWatcher = null;
        this.reloadLock = false;
        
        // Performance Metrics
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            cacheHits: 0,
            dataLoads: 0,
            averageLoadTime: 0,
            autoReloads: 0,
            fileWatchEvents: 0
        };
        
        console.log('🚀 KAYA Agent Manager v2.0 initialisiert');
        this.initializeAgents();
        
        // Starte File-Watcher für automatische Aktualisierung
        this.startFileWatcher();
    }
    
    /**
     * Lädt verifizierte Fakten aus verified_facts.json
     * Diese Fakten sind kritisch für hoheitliche Aufgaben - keine Halluzinationen!
     */
    loadVerifiedFacts() {
        try {
            const factsPath = path.join(__dirname, 'data', 'verified_facts.json');
            if (fs.existsSync(factsPath)) {
                this.verifiedFacts = fs.readJsonSync(factsPath);
                console.log('✅ Verifizierte Fakten geladen (Personen, Leitweg-ID, Kontakte)');
            } else {
                console.warn('⚠️ verified_facts.json nicht gefunden - verwende Fallback');
                this.verifiedFacts = this.getFallbackFacts();
            }
        } catch (error) {
            console.error('❌ Fehler beim Laden der verifizierten Fakten:', error.message);
            this.verifiedFacts = this.getFallbackFacts();
        }
    }
    
    /**
     * Fallback-Fakten falls Datei nicht existiert (für Sicherheit)
     */
    getFallbackFacts() {
        return {
            version: "1.0",
            facts: {
                personen_und_positionen: {
                    landrat: {
                        name: "Dr. Christian Pundt",
                        titel: "Landrat",
                        warnung: "NIEMALS andere Namen verwenden!"
                    }
                },
                rechnung_ebilling: {
                    leitweg_id: {
                        wert: "03458-0-051",
                        warnung: "NIEMALS sagen 'kann ich nicht bereitstellen'!"
                    },
                    vorgang: {
                        schritt_1: "Rechnung im XRechnung-Format erstellen (XML, UBL 2.1/CIIl) oder ZUGFeRD 2.0",
                        schritt_2: "Leitweg-ID 03458-0-051 in der Rechnung verwenden",
                        schritt_3: "Rechnung über das XRechnung-System senden",
                        zustandig: "Finanzdezernat / Rechnungsprüfung",
                        kontakt: "04431 85-0"
                    }
                }
            }
        };
    }
    
    /**
     * Gibt verifizierte Fakten für einen bestimmten Kontext zurück
     * @param {string} context - 'landrat', 'leitweg_id', 'vorgang', 'agent_name', etc.
     * @param {string} agentName - Optional: Agent-Name für agent-spezifische Fakten
     * @returns {object} Verifizierte Fakten
     */
    getVerifiedFacts(context = null, agentName = null) {
        if (!this.verifiedFacts) {
            this.loadVerifiedFacts();
        }
        
        if (!context && !agentName) {
            return this.verifiedFacts;
        }
        
        // Agent-spezifische Fakten (hat Priorität)
        if (agentName && this.verifiedFacts.facts[agentName]) {
            const agentFacts = this.verifiedFacts.facts[agentName];
            // Kombiniere mit allgemeinen Fakten
            return {
                ...agentFacts,
                kontakt: this.verifiedFacts.facts.kontakt_informationen,
                allgemeine_regeln: this.verifiedFacts.facts.alle_agenten?.allgemeine_regeln
            };
        }
        
        // Context-spezifische Fakten extrahieren
        const contextMap = {
            'landrat': this.verifiedFacts.facts?.personen_und_positionen?.landrat,
            'leitweg_id': this.verifiedFacts.facts?.rechnung_ebilling?.leitweg_id,
            'vorgang': this.verifiedFacts.facts?.rechnung_ebilling?.vorgang,
            'rechnung_ebilling': this.verifiedFacts.facts?.rechnung_ebilling,
            'kontakt': this.verifiedFacts.facts?.kontakt_informationen,
            'buergerdienste': this.verifiedFacts.facts?.buergerdienste,
            'ratsinfo': this.verifiedFacts.facts?.ratsinfo,
            'stellenportal': this.verifiedFacts.facts?.stellenportal,
            'jugend': this.verifiedFacts.facts?.jugend,
            'soziales': this.verifiedFacts.facts?.soziales,
            'jobcenter': this.verifiedFacts.facts?.jobcenter
        };
        
        return contextMap[context] || this.verifiedFacts;
    }
    
    /**
     * Prüft ob ein Wert zu einer verifizierten Faktum passt (für Post-Processing)
     * @param {string} agentName - Agent-Name
     * @param {string} factType - Typ des Fakts ('kontakt', 'person', 'vorgang', etc.)
     * @param {string} value - Zu prüfender Wert
     * @returns {object} {valid: boolean, corrected: string|null, warning: string|null}
     */
    validateFact(agentName, factType, value) {
        if (!this.verifiedFacts) {
            this.loadVerifiedFacts();
        }
        
        const agentFacts = this.getVerifiedFacts(null, agentName);
        const kontaktFacts = this.verifiedFacts.facts?.kontakt_informationen;
        
        // Prüfe Telefonnummern
        if (factType === 'telefon' || factType === 'kontakt_telefon') {
            const validTelefon = kontaktFacts?.haupttelefon?.wert || '04431 85-0';
            if (value && !value.includes('04431') && !value.includes('04431 85-0')) {
                return {
                    valid: false,
                    corrected: validTelefon,
                    warning: `Unverifizierte Telefonnummer erkannt. Korrigiert zu verifizierter Nummer: ${validTelefon}`
                };
            }
        }
        
        // Prüfe E-Mail-Adressen
        if (factType === 'email' || factType === 'kontakt_email') {
            const validEmail = kontaktFacts?.hauptemail?.wert || 'info@oldenburg-kreis.de';
            if (value && !value.includes('@oldenburg-kreis.de')) {
                return {
                    valid: false,
                    corrected: validEmail,
                    warning: `Unverifizierte E-Mail erkannt. Korrigiert zu verifizierter E-Mail: ${validEmail}`
                };
            }
        }
        
        // Prüfe Landrat-Name
        if (factType === 'landrat_name' || factType === 'person_landrat') {
            const validName = this.verifiedFacts.facts?.personen_und_positionen?.landrat?.name || 'Dr. Christian Pundt';
            const invalidNames = ['Matthias Groote', 'Jens Pundt', 'Jens', 'Groote'];
            const valueLower = value?.toLowerCase() || '';
            
            for (const invalidName of invalidNames) {
                if (valueLower.includes(invalidName.toLowerCase())) {
                    return {
                        valid: false,
                        corrected: validName,
                        warning: `Ungültiger Landrat-Name erkannt ("${invalidName}"). Korrigiert zu: ${validName}`
                    };
                }
            }
        }
        
        // Prüfe Leitweg-ID
        if (factType === 'leitweg_id') {
            const validLeitwegId = this.verifiedFacts.facts?.rechnung_ebilling?.leitweg_id?.wert || '03458-0-051';
            if (value && value !== validLeitwegId && !value.includes('03458-0-051')) {
                return {
                    valid: false,
                    corrected: validLeitwegId,
                    warning: `Ungültige Leitweg-ID erkannt. Korrigiert zu verifizierter ID: ${validLeitwegId}`
                };
            }
        }
        
        return { valid: true, corrected: null, warning: null };
    }
    
    // Agent-Initialisierung
    async initializeAgents() {
        try {
            console.log('📊 Initialisiere Agent-Daten...');
            await this.loadAgentData();
            console.log(`✅ ${this.agents.size} Agenten geladen`);
        } catch (error) {
            console.error('❌ Agent-Initialisierung Fehler:', error);
        }
    }
    
    // Agent-Daten laden
    async loadAgentData() {
        const startTime = Date.now();
        
        try {
            // Prüfe ob Agent-Daten-Verzeichnis existiert
            if (!await fs.pathExists(this.agentDataPath)) {
                console.log('⚠️ Agent-Daten-Verzeichnis nicht gefunden, erstelle Standard-Agenten');
                await this.createDefaultAgents();
                return;
            }
            
            // Lade alle Agent-Dateien
            const agentFiles = await fs.readdir(this.agentDataPath);
            // Ignoriere all_agents_data_*.json und Dateien in Unterordnern
            const jsonFiles = agentFiles.filter(file => 
                file.endsWith('.json') && 
                !file.startsWith('all_agents_data_') &&
                !file.includes('/') &&
                !file.includes('\\')
            );
            
            console.log(`📁 Gefundene Agent-Dateien: ${jsonFiles.length}`);
            
            // Gruppiere Dateien nach Agent-Name (entferne Timestamp)
            const agentFileMap = new Map();
            
            for (const file of jsonFiles) {
                // Parse Agent-Name: entferne "_data_YYYY-MM-DD" Pattern
                let agentName = path.basename(file, '.json');
                agentName = agentName.replace(/_data_\d{4}-\d{2}-\d{2}$/, '');
                
                const filePath = path.join(this.agentDataPath, file);
                const stats = await fs.stat(filePath);
                
                // Speichere neueste Datei pro Agent
                if (!agentFileMap.has(agentName) || stats.mtime > agentFileMap.get(agentName).mtime) {
                    agentFileMap.set(agentName, { filePath, mtime: stats.mtime });
                }
            }
            
            // Lade Daten für jeden Agent
            for (const [agentName, { filePath }] of agentFileMap) {
                try {
                    const agentData = await fs.readJson(filePath);
                    this.agents.set(agentName, {
                        name: agentName,
                        data: agentData,
                        lastUpdated: new Date().toISOString(),
                        filePath: filePath
                    });
                    
                    console.log(`✅ Agent geladen: ${agentName} (${agentData.length || 0} Einträge)`);
                } catch (error) {
                    console.error(`❌ Fehler beim Laden von ${agentName}:`, error.message);
                }
            }
            
            this.lastUpdate = new Date().toISOString();
            this.metrics.dataLoads++;
            this.metrics.averageLoadTime = (this.metrics.averageLoadTime * (this.metrics.dataLoads - 1) + (Date.now() - startTime)) / this.metrics.dataLoads;
            
        } catch (error) {
            console.error('❌ Agent-Daten-Ladung Fehler:', error);
            await this.createDefaultAgents();
        }
    }
    
    // Standard-Agenten erstellen
    async createDefaultAgents() {
        const defaultAgents = {
            buergerdienste: [
                {
                    title: 'Bürgerservice',
                    content: 'Allgemeine Bürgerservices im Landkreis Oldenburg',
                    category: 'general',
                    priority: 'high'
                }
            ],
            ratsinfo: [
                {
                    title: 'Ratsinformationen',
                    content: 'Informationen über Ratssitzungen und Beschlüsse',
                    category: 'politics',
                    priority: 'medium'
                }
            ],
            stellenportal: [
                {
                    title: 'Stellenportal',
                    content: 'Aktuelle Stellenausschreibungen',
                    category: 'jobs',
                    priority: 'high'
                }
            ],
            kontakte: [
                {
                    title: 'Kontakte',
                    content: 'Kontaktinformationen der Verwaltung',
                    category: 'contact',
                    priority: 'high'
                }
            ],
            jugend: [
                {
                    title: 'Jugend',
                    content: 'Angebote und Services für Jugendliche',
                    category: 'youth',
                    priority: 'medium'
                }
            ],
            soziales: [
                {
                    title: 'Soziales',
                    content: 'Soziale Dienstleistungen und Hilfen',
                    category: 'social',
                    priority: 'high'
                }
            ]
        };
        
        for (const [agentName, data] of Object.entries(defaultAgents)) {
            this.agents.set(agentName, {
                name: agentName,
                data: data,
                lastUpdated: new Date().toISOString(),
                filePath: null
            });
        }
        
        console.log(`✅ ${Object.keys(defaultAgents).length} Standard-Agenten erstellt`);
    }
    
    // Agent-Daten abrufen
    async getAgentData(agentName, forceReload = false) {
        this.metrics.totalRequests++;
        
        try {
            // Cache-Check
            if (!forceReload && this.cache.has(agentName)) {
                const cached = this.cache.get(agentName);
                if (Date.now() - cached.timestamp < this.updateInterval) {
                    this.metrics.cacheHits++;
                    return cached.data;
                }
            }
            
            // Agent-Daten laden
            const agent = this.agents.get(agentName);
            if (!agent) {
                console.log(`⚠️ Agent nicht gefunden: ${agentName}`);
                return null;
            }
            
            // Cache aktualisieren
            this.cache.set(agentName, {
                data: agent.data,
                timestamp: Date.now()
            });
            
            this.metrics.successfulRequests++;
            return agent.data;
            
        } catch (error) {
            console.error(`❌ Agent-Daten-Abruf Fehler für ${agentName}:`, error);
            return null;
        }
    }
    
    // Agent-Routing
    async routeToAgent(query, sessionId, sessionContext, intentionAnalysis, personaAnalysis) {
        const startTime = Date.now();
        
        try {
            const { intention, confidence } = intentionAnalysis;
            const { persona } = personaAnalysis;
            const queryLower = query.toLowerCase();
            
            // WICHTIG: Keyword-basiertes Routing VOR Intention-basiertem Routing
            // (höchste Priorität für spezifische Keywords)
            let targetAgent = null;
            
            // Landrat / politik_landkreis Keywords
            if (queryLower.includes('landrat') || 
                queryLower.includes('christian pundt') || 
                queryLower.includes('dr. christian pundt') ||
                queryLower.includes('dr christian pundt') ||
                queryLower.includes('kreistagsmitglieder') || 
                queryLower.includes('kreisorgane')) {
                targetAgent = 'politik_landkreis';
            }
            // XRechnung / rechnung_ebilling Keywords
            else if (queryLower.includes('xrechnung') || 
                     queryLower.includes('e-rechnung') || 
                     queryLower.includes('erechnung') || 
                     queryLower.includes('leitweg') || 
                     queryLower.includes('03458-0-051') ||
                     queryLower.includes('ebilling')) {
                targetAgent = 'rechnung_ebilling';
            }
            // Ratsinfo Keywords
            else if (queryLower.includes('sitzung') || 
                     queryLower.includes('kreistagssitzung') || 
                     queryLower.includes('beschluss') ||
                     queryLower.includes('tagesordnung')) {
                targetAgent = 'ratsinfo';
            }
            // Aktionen/Veranstaltungen Keywords
            else if (queryLower.includes('aktion saubere landschaft') || 
                     queryLower.includes('veranstaltung') && !queryLower.includes('sitzung') ||
                     queryLower.includes('aktionen')) {
                targetAgent = 'aktionen_veranstaltungen';
            }
            // Stellenportal Keywords (nur wenn nicht "Bewerbung" in Kontext mit Persona-Routing)
            else if ((queryLower.includes('stelle') && !queryLower.includes('melde') && !queryLower.includes('bauantrag')) || 
                     (queryLower.includes('bewerbung') && persona.type !== 'unemployed' && persona.type !== 'low_income') ||
                     (queryLower.includes('job') && !queryLower.includes('center') && !queryLower.includes('jobcenter'))) {
                targetAgent = 'stellenportal';
            }
            // Bauantrag hat Priorität über "stelle"
            else if (queryLower.includes('bauantrag') || queryLower.includes('bau beantragen')) {
                targetAgent = 'buergerdienste';
            }
            // Kontakte Keywords (nur wenn nicht Migrant-spezifisch)
            else if ((queryLower.includes('kontakt') && !queryLower.includes('landrat') && !queryLower.includes('migrant')) || 
                     (queryLower.includes('telefon') && !queryLower.includes('migrant')) ||
                     (queryLower.includes('sprechzeit') && !queryLower.includes('migrant'))) {
                targetAgent = 'kontakte';
            }
            // Migrant Hilfe → buergerdienste (höchste Priorität)
            else if (queryLower.includes('migrant hilfe') || queryLower.includes('migrant beratung')) {
                targetAgent = 'buergerdienste';
            }
            
            // Falls kein Keyword-Match, Intention-basiertes Routing verwenden
            if (!targetAgent) {
                const agentMapping = {
                    kfz_zulassung: 'buergerdienste',
                    führerschein: 'buergerdienste',
                    bauantrag: 'buergerdienste',
                    gewerbe: 'buergerdienste',
                    landwirtschaft: 'buergerdienste',
                    handwerk: 'buergerdienste',
                    studium: 'buergerdienste',
                    soziales: 'soziales',
                    gesundheit: 'soziales',
                    bildung: 'jugend',
                    umwelt: 'buergerdienste',
                    notfall: 'kontakte',
                    tourismus: 'buergerdienste',
                    politik: 'politik_landkreis',  // NEU: politik → politik_landkreis
                    ratsinfo: 'ratsinfo',
                    sitzung: 'ratsinfo',
                    tagesordnung: 'ratsinfo',
                    beschluss: 'ratsinfo',
                    landrat: 'politik_landkreis',  // NEU
                    kreistag: 'politik_landkreis',  // NEU
                    xrechnung: 'rechnung_ebilling',  // NEU
                    erechnung: 'rechnung_ebilling',  // NEU
                    leitweg: 'rechnung_ebilling',  // NEU
                    ebilling: 'rechnung_ebilling',  // NEU
                    stellen: 'stellenportal',  // NEU
                    bewerbung: 'stellenportal',  // NEU
                    ausbildung: 'stellenportal',
                    praktikum: 'stellenportal',
                    job: 'stellenportal',
                    kontakt: 'kontakte',
                    telefon: 'kontakte',
                    email: 'kontakte',
                    sprechzeit: 'kontakte',
                    standort: 'kontakte',
                    öffnungszeiten: 'kontakte',
                    aktionen: 'aktionen_veranstaltungen',  // NEU
                    veranstaltungen: 'aktionen_veranstaltungen',  // NEU
                    saubere: 'aktionen_veranstaltungen',  // NEU
                    events: 'aktionen_veranstaltungen',
                    ordnungsamt: 'buergerdienste',
                    senioren: 'senioren',
                    inklusion: 'inklusion',
                    digitalisierung: 'digitalisierung',
                    gleichstellung: 'gleichstellung'
                };
                
                targetAgent = agentMapping[intention] || 'buergerdienste';
            }
            
            // Keyword-basierte Spezial-Routings (höchste Priorität)
            if (queryLower.includes('kindergeld')) {
                targetAgent = 'jugend'; // Kindergeld → jugend
            } else if (queryLower.includes('bürgergeld') || queryLower.includes('buergergeld')) {
                targetAgent = 'soziales'; // Bürgergeld → soziales (nicht jobcenter)
            }
            
            // Persona-basiertes Routing (nur wenn noch kein Keyword-Agent gesetzt)
            // UND nur für bestimmte Queries, nicht für alle
            if (!targetAgent || targetAgent === 'buergerdienste') {
                if (persona.type === 'youth' || persona.type === 'student') {
                    // Nur wenn Query jugendbezogen ist
                    if (queryLower.includes('jugend') || queryLower.includes('kind') || queryLower.includes('kindergeld') || queryLower.includes('schule')) {
                        targetAgent = 'jugend';
                    }
                }
            }
            
            // Jobcenter-Routing nur wenn Query arbeitslos-bezogen ist
            if (persona.type === 'unemployed' || persona.type === 'low_income') {
                if (queryLower.includes('arbeitslos') || queryLower.includes('arbeitslosengeld')) {
                    targetAgent = 'jobcenter';
                } else if (queryLower.includes('bewerbung') || queryLower.includes('stelle')) {
                    // Bewerbung → stellenportal hat Vorrang
                    targetAgent = 'stellenportal';
                } else if (queryLower.includes('sozialhilfe') || queryLower.includes('sozial')) {
                    // Sozialhilfe → soziales Agent
                    targetAgent = 'soziales';
                }
                // Bürgergeld → soziales (nicht jobcenter) - bereits oben abgefangen
            } else if (persona.type === 'migrant') {
                // Migrant + "Hilfe" → immer buergerdienste (nicht kontakte)
                if (queryLower.includes('hilfe') && queryLower.includes('migrant')) {
                    targetAgent = 'buergerdienste'; // Migrant-spezifische Hilfe → buergerdienste
                } else if (!queryLower.includes('hilfe') || queryLower.includes('beratung') || queryLower.includes('migrant')) {
                    targetAgent = 'buergerdienste'; // Allgemeine Beratung für Migranten
                }
            } else if (persona.type === 'commuter' || persona.type === 'mobility_needs') {
                targetAgent = 'buergerdienste'; // Verkehrsangelegenheiten
            } else if (persona.type === 'housing_seeker') {
                targetAgent = 'buergerdienste'; // Wohnungsangelegenheiten
            } else if (persona.type === 'plattdeutsch_speaker' || persona.type === 'low_education') {
                targetAgent = 'buergerdienste'; // Allgemeine Beratung mit einfacher Sprache
            }
            
            // Agent-Daten abrufen
            const agentData = await this.getAgentData(targetAgent);
            
            if (!agentData) {
                return {
                    agent: 'kaya',
                    response: 'Entschuldigung, ich konnte keine passenden Informationen finden. Bitte versuchen Sie es erneut.',
                    confidence: 0
                };
            }
            
            // Relevante Daten filtern (optimiert: Top-3, gekürzt für Token-Einsparung)
            const relevantData = this.filterRelevantDataOptimized(agentData, query, intention, 3, 300);
            
            // Response generieren
            const response = this.generateAgentResponse(relevantData, query, intention, persona);
            
            console.log(`🎯 Agent-Routing: ${intention} → ${targetAgent} (${confidence}%)`);
            
            return {
                agent: targetAgent,
                response: response,
                confidence: confidence,
                dataCount: relevantData.length,
                processingTime: Date.now() - startTime
            };
            
        } catch (error) {
            console.error('❌ Agent-Routing Fehler:', error);
            return {
                agent: 'kaya',
                response: 'Entschuldigung, es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
                confidence: 0,
                error: error.message
            };
        }
    }
    
    // Relevante Daten filtern
    filterRelevantData(agentData, query, intention) {
        if (!agentData || !Array.isArray(agentData)) {
            return [];
        }
        
        const queryLower = query.toLowerCase();
        const intentionLower = intention.toLowerCase();
        
        return agentData.filter(item => {
            // Titel-Matching
            if (item.title && item.title.toLowerCase().includes(queryLower)) {
                return true;
            }
            
            // Content-Matching
            if (item.content && item.content.toLowerCase().includes(queryLower)) {
                return true;
            }
            
            // Intention-Matching
            if (item.category && item.category.toLowerCase().includes(intentionLower)) {
                return true;
            }
            
            // Keyword-Matching
            if (item.keywords && Array.isArray(item.keywords)) {
                return item.keywords.some(keyword => 
                    keyword.toLowerCase().includes(queryLower)
                );
            }
            
            return false;
        }).slice(0, 5); // Maximal 5 relevante Einträge
    }
    
    /**
     * Optimierte Filterung: Top-3 relevanteste Einträge, Content gekürzt
     * Für Token-Optimierung: Nur die wichtigsten Daten im Prompt
     */
    filterRelevantDataOptimized(agentData, query, intention, maxResults = 3, maxContentLength = 300) {
        const relevant = this.filterRelevantData(agentData, query, intention);
        
        // Nimm nur Top-N und kürze Content
        return relevant.slice(0, maxResults).map(item => {
            const optimized = { ...item };
            
            // Kürze Content auf maxContentLength Zeichen (behält Anfang)
            if (optimized.content && optimized.content.length > maxContentLength) {
                optimized.content = optimized.content.substring(0, maxContentLength) + '...';
            }
            
            if (optimized.plain_text && optimized.plain_text.length > maxContentLength) {
                optimized.plain_text = optimized.plain_text.substring(0, maxContentLength) + '...';
            }
            
            // Reduziere Metadata auf das Wesentliche
            if (optimized.metadata) {
                optimized.metadata = {
                    agent: optimized.metadata.agent,
                    type: optimized.metadata.type,
                    source: optimized.metadata.source
                };
            }
            
            return optimized;
        });
    }
    
    // Agent-Response generieren
    generateAgentResponse(relevantData, query, intention, persona) {
        if (!relevantData || relevantData.length === 0) {
            return 'Keine spezifischen Informationen gefunden. Bitte kontaktieren Sie uns direkt.';
        }
        
        let response = `📋 **Relevante Informationen für ${intention}:**\n\n`;
        
        relevantData.forEach((item, index) => {
            response += `**${index + 1}. ${item.title || 'Information'}**\n`;
            
            if (item.content) {
                response += `${item.content}\n`;
            }
            
            if (item.link) {
                response += `→ [Mehr erfahren](${item.link})\n`;
            }
            
            if (item.contact) {
                response += `📞 Kontakt: ${item.contact}\n`;
            }
            
            response += '\n';
        });
        
        // Persona-spezifische Hinweise
        if (persona.type === 'senior') {
            response += `👴 **Für Senioren:** Spezielle Beratungen und Unterstützungen verfügbar!\n\n`;
        } else if (persona.type === 'youth') {
            response += `👨‍🎓 **Für Jugendliche:** Spezielle Angebote und Förderungen!\n\n`;
        }
        
        response += `📞 **Weitere Hilfe:** 04431 85-0 (Mo-Fr 8-16 Uhr)`;
        
        return response;
    }
    
    // Agent-Status abrufen
    getAgentStatus() {
        const status = {
            totalAgents: this.agents.size,
            lastUpdate: this.lastUpdate,
            agents: {}
        };
        
        for (const [name, agent] of this.agents) {
            status.agents[name] = {
                name: agent.name,
                dataCount: agent.data ? agent.data.length : 0,
                lastUpdated: agent.lastUpdated,
                hasData: !!agent.data
            };
        }
        
        return status;
    }
    
    // Performance-Metriken
    getMetrics() {
        return {
            ...this.metrics,
            cacheSize: this.cache.size,
            cacheHitRate: this.metrics.totalRequests > 0 ? 
                Math.round((this.metrics.cacheHits / this.metrics.totalRequests) * 100) : 0,
            averageLoadTime: Math.round(this.metrics.averageLoadTime),
            successRate: this.metrics.totalRequests > 0 ? 
                Math.round((this.metrics.successfulRequests / this.metrics.totalRequests) * 100) : 0
        };
    }
    
    // Cache-Management
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Agent-Cache geleert');
    }
    
    // Daten-Update
    async updateAgentData() {
        if (this.reloadLock) {
            console.log('⚠️ Reload bereits im Gange');
            return;
        }

        this.reloadLock = true;
        try {
            console.log('🔄 Agent-Daten werden aktualisiert...');
            await this.loadAgentData();
            this.clearCache();
            this.metrics.autoReloads++;
            console.log('✅ Agent-Daten aktualisiert');
        } finally {
            this.reloadLock = false;
        }
    }
    
    // Health Check
    healthCheck() {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            agents: this.getAgentStatus(),
            metrics: this.getMetrics(),
            cache: {
                size: this.cache.size,
                hitRate: this.getMetrics().cacheHitRate
            },
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
            }
        };
    }
    
    // Debug-Informationen
    getDebugInfo() {
        return {
            agentDataPath: this.agentDataPath,
            agents: Array.from(this.agents.keys()),
            cache: Array.from(this.cache.keys()),
            lastUpdate: this.lastUpdate,
            metrics: this.getMetrics(),
            fileWatcherActive: this.fileWatcher !== null
        };
    }
    
    /**
     * Startet File-Watcher für automatische Agent-Datenaktualisierung
     */
    startFileWatcher() {
        try {
            // Prüfe ob Verzeichnis existiert
            if (!fs.existsSync(this.agentDataPath)) {
                console.log('⚠️ Agent-Daten-Verzeichnis nicht gefunden, File-Watcher nicht gestartet');
                return;
            }

            // Nutze fs.watch (Node.js built-in)
            this.fileWatcher = fs.watch(this.agentDataPath, { recursive: false }, async (eventType, filename) => {
                // Ignoriere nicht-JSON Dateien und all_agents_data
                if (!filename || !filename.endsWith('.json') || filename.startsWith('all_agents_data_')) {
                    return;
                }

                // Prüfe ob es eine neue Agent-Daten-Datei ist (Pattern: *_data_YYYY-MM-DD.json)
                if (!filename.match(/_data_\d{4}-\d{2}-\d{2}\.json$/)) {
                    return;
                }

                this.metrics.fileWatchEvents++;

                // Debounce: Warte 2 Sekunden vor Reload (wenn mehrere Dateien gleichzeitig geschrieben werden)
                if (this.reloadDebounceTimer) {
                    clearTimeout(this.reloadDebounceTimer);
                }

                this.reloadDebounceTimer = setTimeout(async () => {
                    if (this.reloadLock) {
                        console.log('⚠️ Reload bereits im Gange, überspringe');
                        return;
                    }

                    console.log(`📁 Neue Agent-Daten erkannt: ${filename}, lade neu...`);
                    try {
                        await this.updateAgentData();
                        console.log('✅ Agent-Daten automatisch aktualisiert');
                    } catch (error) {
                        console.error('❌ Fehler beim automatischen Reload:', error);
                    }
                }, 2000); // 2 Sekunden Debounce

            });

            console.log('👁️ File-Watcher gestartet für automatische Agent-Aktualisierung');
            
        } catch (error) {
            console.error('❌ Fehler beim Starten des File-Watchers:', error);
            // Fallback: Polling alle 15 Minuten
            this.startPolling();
        }
    }

    /**
     * Startet Polling als Fallback (falls File-Watcher nicht funktioniert)
     */
    startPolling() {
        console.log('🔄 Starte Polling-Fallback (alle 15 Minuten)');
        setInterval(async () => {
            try {
                const files = await fs.readdir(this.agentDataPath);
                const jsonFiles = files.filter(f => 
                    f.endsWith('.json') && 
                    f.match(/_data_\d{4}-\d{2}-\d{2}\.json$/) &&
                    !f.startsWith('all_agents_data_')
                );

                // Prüfe ob neue Dateien vorhanden sind
                let hasNewFiles = false;
                for (const file of jsonFiles) {
                    const filePath = path.join(this.agentDataPath, file);
                    const stats = await fs.stat(filePath);
                    const fileTime = stats.mtime.getTime();
                    
                    if (!this.lastUpdate || fileTime > new Date(this.lastUpdate).getTime()) {
                        hasNewFiles = true;
                        break;
                    }
                }

                if (hasNewFiles) {
                    console.log('📁 Neue Dateien via Polling erkannt, lade Agent-Daten neu...');
                    await this.updateAgentData();
                }
            } catch (error) {
                console.error('❌ Fehler beim Polling:', error);
            }
        }, 15 * 60 * 1000); // 15 Minuten
    }

    /**
     * Stoppt File-Watcher
     */
    stopFileWatcher() {
        if (this.fileWatcher) {
            this.fileWatcher.close();
            this.fileWatcher = null;
            console.log('🛑 File-Watcher gestoppt');
        }
        
        if (this.reloadDebounceTimer) {
            clearTimeout(this.reloadDebounceTimer);
        }
    }
}

module.exports = KAYAAgentManager;

