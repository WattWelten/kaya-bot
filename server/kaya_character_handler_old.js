const KAYAAgentHandler = require('./kaya_agent_handler');
const LLMService = require('./llm_service');

class KAYACharacterHandler {
    constructor() {
        this.agentHandler = new KAYAAgentHandler();
        this.llmService = new LLMService();
        this.useLLM = process.env.USE_LLM === 'true';
        
        // Multi-Language Support (Phase 1.1)
        this.supportedLanguages = {
            'de': 'Deutsch',
            'en': 'English', 
            'tr': 'Turkce',
            'ar': 'Arabic',
            'fr': 'Francais',
            'es': 'Espanol',
            'ru': 'Russian',
            'pl': 'Polski'
        };
        
        // Language Detection Patterns (ohne Unicode-Zeichen)
        this.languagePatterns = {
            'en': ['hello', 'hi', 'help', 'need', 'want', 'how', 'what', 'where', 'when', 'why', 'can', 'could', 'would', 'should', 'please', 'thank', 'thanks', 'sorry', 'excuse'],
            'tr': ['merhaba', 'selam', 'yardim', 'ihtiyac', 'istiyorum', 'nasil', 'ne', 'nerede', 'ne zaman', 'neden', 'lutfen', 'tesekkur', 'ozur', 'afedersiniz'],
            'ar': ['marhaba', 'ahlan', 'musaada', 'haja', 'urid', 'kayf', 'matha', 'ayn', 'mata', 'limatha', 'min fadlik', 'shukran', 'asif'],
            'fr': ['bonjour', 'salut', 'aide', 'besoin', 'vouloir', 'comment', 'quoi', 'ou', 'quand', 'pourquoi', 'sil vous plait', 'merci', 'desole'],
            'es': ['hola', 'ayuda', 'necesito', 'quiero', 'como', 'que', 'donde', 'cuando', 'por que', 'por favor', 'gracias', 'lo siento'],
            'ru': ['privet', 'pomoshch', 'nuzhno', 'khochu', 'kak', 'chto', 'gde', 'kogda', 'pochemu', 'pozhaluysta', 'spasibo', 'izvinite'],
            'pl': ['czesc', 'pomoc', 'potrzebuje', 'chce', 'jak', 'co', 'gdzie', 'kiedy', 'dlaczego', 'prosze', 'dziekuje', 'przepraszam']
        };
        
        // Erweiterte Bürgerzentrierte Perspektiven mit Fuzzy-Matching
        this.citizenPersonas = {
            'familie': {
                'keywords': ['kind', 'kita', 'schule', 'familie', 'eltern', 'betreuung', 'jugend', 'baby', 'kleinkind', 'schüler', 'student', 'ausbildung', 'lehre', 'kindergarten', 'hort', 'tagesmutter', 'erziehung', 'sorgerecht', 'unterhalt', 'alleinerziehend', 'geschieden', 'getrennt', 'adoption', 'pflegekind', 'vormundschaft'],
                'contexts': ['anmeldung', 'beantragen', 'hilfe', 'beratung', 'unterstützung', 'geld', 'zuschuss', 'förderung'],
                'phrases': ['mein kind', 'meine tochter', 'mein sohn', 'unser baby', 'die kinder', 'familie mit', 'alleinerziehend', 'geschieden', 'sorgerecht']
            },
            'unternehmen': {
                'keywords': ['gewerbe', 'firma', 'unternehmen', 'bewerbung', 'stellen', 'arbeit', 'job', 'karriere', 'personal', 'mitarbeiter', 'angestellte', 'ausbildung', 'lehre', 'praktikum', 'werkstudent', 'freelancer', 'selbstständig', 'gründung', 'startup', 'handwerk', 'handel', 'dienstleistung', 'produktion', 'vertrieb', 'marketing'],
                'contexts': ['anmeldung', 'genehmigung', 'lizenz', 'zulassung', 'förderung', 'beratung', 'hilfe', 'support', 'finanzierung', 'kredit', 'zuschuss'],
                'phrases': ['mein unternehmen', 'meine firma', 'ich gründe', 'selbstständig', 'freiberufler', 'handwerker', 'händler', 'dienstleister']
            },
            'senioren': {
                'keywords': ['pflege', 'senioren', 'alt', 'rente', 'hilfe', 'betreuung', 'demenz', 'alzheimer', 'rollstuhl', 'gehhilfe', 'badewanne', 'treppenlift', 'hausnotruf', 'tagespflege', 'vollzeitpflege', 'pflegestufe', 'pflegegeld', 'pflegeversicherung', 'heim', 'wohnheim', 'ambulant', 'stationär', 'ruhestand', 'pension', 'witwe', 'witwer'],
                'contexts': ['beantragen', 'hilfe', 'unterstützung', 'beratung', 'pflege', 'betreuung', 'wohnen', 'umzug', 'anpassung'],
                'phrases': ['mein vater', 'meine mutter', 'meine oma', 'mein opa', 'pflegebedürftig', 'hilfe im alltag', 'nicht mehr allein', 'pflegeheim', 'zu hause pflegen']
            },
            'bauherren': {
                'keywords': ['bau', 'bauantrag', 'genehmigung', 'grundstück', 'haus', 'wohnung', 'garage', 'carport', 'terrasse', 'balkon', 'umbau', 'sanierung', 'renovierung', 'dach', 'fassade', 'fenster', 'tür', 'heizung', 'klimaanlage', 'solar', 'photovoltaik', 'wärmepumpe', 'isolierung', 'dämmung', 'keller', 'dachboden', 'ausbau'],
                'contexts': ['bauen', 'bauantrag', 'genehmigung', 'planung', 'architekt', 'bauherr', 'handwerker', 'finanzierung', 'kredit', 'bausparvertrag'],
                'phrases': ['ich baue', 'wir bauen', 'haus bauen', 'umbauen', 'sanieren', 'renovieren', 'grundstück kaufen', 'bauplatz', 'eigenheim']
            },
            'studenten': {
                'keywords': ['student', 'studium', 'universität', 'hochschule', 'fachhochschule', 'bachelor', 'master', 'doktor', 'promotion', 'semester', 'vorlesung', 'prüfung', 'thesis', 'praktikum', 'werkstudent', 'bafög', 'stipendium', 'wohnheim', 'studentenwohnung', 'mensa', 'bibliothek'],
                'contexts': ['studieren', 'bewerbung', 'einschreibung', 'immatrikulation', 'bafög', 'stipendium', 'wohnen', 'jobben'],
                'phrases': ['ich studiere', 'ich will studieren', 'student sein', 'studium beginnen', 'hochschule', 'universität']
            },
            'arbeitslose': {
                'keywords': ['arbeitslos', 'arbeitslosigkeit', 'alg', 'arbeitslosengeld', 'jobcenter', 'arbeitsagentur', 'bewerbung', 'jobsuche', 'stellenangebot', 'qualifizierung', 'umschulung', 'fortbildung', 'weiterbildung', 'berufsberatung', 'coaching', 'bewerbungstraining'],
                'contexts': ['arbeitslos', 'jobsuche', 'bewerbung', 'qualifizierung', 'hilfe', 'beratung', 'unterstützung'],
                'phrases': ['ich bin arbeitslos', 'arbeitslos geworden', 'job verloren', 'stelle verloren', 'kündigung', 'arbeitslosengeld']
            },
            'behinderte': {
                'keywords': ['behinderung', 'behindert', 'rollstuhl', 'gehhilfe', 'blind', 'taub', 'hörbehindert', 'sehbehindert', 'geistig behindert', 'körperlich behindert', 'schwerbehindert', 'grad der behinderung', 'ausweis', 'nachteilsausgleich', 'assistenz', 'betreuung', 'pflege'],
                'contexts': ['behinderung', 'ausweis', 'nachteilsausgleich', 'assistenz', 'betreuung', 'hilfe', 'unterstützung'],
                'phrases': ['ich bin behindert', 'schwerbehindert', 'behindertenausweis', 'nachteilsausgleich', 'assistenz']
            },
            'migranten': {
                'keywords': ['migrant', 'ausländer', 'einwanderer', 'flüchtling', 'asyl', 'aufenthalt', 'visum', 'einbürgerung', 'staatsbürgerschaft', 'deutsch lernen', 'integrationskurs', 'sprachkurs', 'deutschkurs', 'anerkennung', 'qualifikation', 'beruf', 'ausbildung'],
                'contexts': ['aufenthalt', 'visum', 'einbürgerung', 'deutsch lernen', 'integrationskurs', 'anerkennung', 'qualifikation'],
                'phrases': ['ich bin ausländer', 'ausländisch', 'deutsch lernen', 'einbürgerung', 'aufenthalt', 'visum']
            },
            'allgemein': {
                'keywords': ['antrag', 'formular', 'dokument', 'bescheinigung', 'urkunde', 'ausweis', 'pass', 'führerschein', 'kfz', 'auto', 'fahrzeug', 'anmeldung', 'abmeldung', 'ummelden', 'anmelden', 'wohnen', 'miete', 'eigentum', 'grundstück', 'immobilie'],
                'contexts': ['beantragen', 'anmelden', 'abmelden', 'ummelden', 'bescheinigung', 'dokument', 'ausweis'],
                'phrases': ['ich brauche', 'ich möchte', 'ich will', 'hilfe bei', 'wie geht', 'wo kann ich']
            }
        };
        
        // Lokale Struktur des Landkreises Oldenburg
        this.localStructure = {
            'landkreis': {
                'name': 'Landkreis Oldenburg',
                'zuständigkeiten': [
                    'Kreistag und Politik',
                    'Schulen (Gymnasien, Berufsschulen)',
                    'Jugendamt',
                    'Sozialhilfe',
                    'Gesundheitsamt',
                    'Straßenbau (Kreisstraßen)',
                    'ÖPNV',
                    'Abfallwirtschaft',
                    'Kreisstraßen',
                    'Kreiskrankenhaus'
                ],
                'kontakt': {
                    'adresse': 'Delmenhorster Straße 6, 27793 Wildeshausen',
                    'telefon': '04431 85-0',
                    'email': 'info@landkreis-oldenburg.de'
                }
            },
            'städte': {
                'wildeshausen': {
                    'name': 'Wildeshausen',
                    'typ': 'Große kreisangehörige Stadt',
                    'zuständigkeiten': [
                        'Einwohnermeldeamt',
                        'Standesamt',
                        'Bauamt (Baugenehmigungen)',
                        'Ordnungsamt',
                        'Feuerwehr',
                        'Straßenbau (Stadtstraßen)',
                        'Kindergärten/Kitas',
                        'Stadtverwaltung',
                        'Tourismus'
                    ],
                    'besonderheiten': [
                        'Historische Altstadt',
                        'Tourismus',
                        'Einzelhandel',
                        'Kulturveranstaltungen'
                    ],
                    'kontakt': {
                        'adresse': 'Markt 1, 27793 Wildeshausen',
                        'telefon': '04431 65-0',
                        'email': 'info@wildeshausen.de',
                        'website': 'https://www.wildeshausen.de'
                    }
                },
                'vechta': {
                    'name': 'Vechta',
                    'typ': 'Große kreisangehörige Stadt',
                    'zuständigkeiten': [
                        'Einwohnermeldeamt',
                        'Standesamt',
                        'Bauamt',
                        'Ordnungsamt',
                        'Feuerwehr',
                        'Stadtverwaltung',
                        'Bildungseinrichtungen'
                    ],
                    'besonderheiten': [
                        'Universität Vechta',
                        'Bildungsschwerpunkt',
                        'Forschung',
                        'Studentenstadt'
                    ],
                    'kontakt': {
                        'adresse': 'Burgstraße 1, 49377 Vechta',
                        'telefon': '04441 886-0',
                        'email': 'info@vechta.de',
                        'website': 'https://www.vechta.de'
                    }
                },
                'cloppenburg': {
                    'name': 'Cloppenburg',
                    'typ': 'Große kreisangehörige Stadt',
                    'zuständigkeiten': [
                        'Einwohnermeldeamt',
                        'Standesamt',
                        'Bauamt',
                        'Ordnungsamt',
                        'Feuerwehr',
                        'Stadtverwaltung'
                    ],
                    'besonderheiten': [
                        'Museumsdorf Cloppenburg',
                        'Kultur',
                        'Tourismus',
                        'Handwerk'
                    ],
                    'kontakt': {
                        'adresse': 'Lange Straße 12, 49661 Cloppenburg',
                        'telefon': '04471 15-0',
                        'email': 'info@cloppenburg.de',
                        'website': 'https://www.cloppenburg.de'
                    }
                }
            },
            'gemeinden': {
                'dötlingen': {
                    'name': 'Dötlingen',
                    'typ': 'Gemeinde',
                    'zuständigkeiten': [
                        'Gemeindeverwaltung',
                        'Bauamt',
                        'Ordnungsamt',
                        'Feuerwehr',
                        'Gemeindestraßen'
                    ],
                    'besonderheiten': [
                        'Landwirtschaft',
                        'Natur',
                        'Wohnen im Grünen'
                    ],
                    'kontakt': {
                        'adresse': 'Hauptstraße 1, 27801 Dötlingen',
                        'telefon': '04432 89-0',
                        'email': 'info@doetlingen.de'
                    }
                },
                'großenkneten': {
                    'name': 'Großenkneten',
                    'typ': 'Gemeinde',
                    'zuständigkeiten': [
                        'Gemeindeverwaltung',
                        'Bauamt',
                        'Ordnungsamt',
                        'Feuerwehr'
                    ],
                    'besonderheiten': [
                        'Landwirtschaft',
                        'Industrie',
                        'Wohngebiete'
                    ],
                    'kontakt': {
                        'adresse': 'Hauptstraße 1, 26197 Großenkneten',
                        'telefon': '04435 89-0',
                        'email': 'info@grossenkneten.de'
                    }
                },
                'hatten': {
                    'name': 'Hatten',
                    'typ': 'Gemeinde',
                    'zuständigkeiten': [
                        'Gemeindeverwaltung',
                        'Bauamt',
                        'Ordnungsamt',
                        'Feuerwehr'
                    ],
                    'besonderheiten': [
                        'Landwirtschaft',
                        'Wohnen',
                        'Natur'
                    ],
                    'kontakt': {
                        'adresse': 'Hauptstraße 1, 26209 Hatten',
                        'telefon': '04482 89-0',
                        'email': 'info@hatten.de'
                    }
                },
                'wardenburg': {
                    'name': 'Wardenburg',
                    'typ': 'Gemeinde',
                    'zuständigkeiten': [
                        'Gemeindeverwaltung',
                        'Bauamt',
                        'Ordnungsamt',
                        'Feuerwehr'
                    ],
                    'besonderheiten': [
                        'Landwirtschaft',
                        'Wohnen',
                        'Natur'
                    ],
                    'kontakt': {
                        'adresse': 'Hauptstraße 1, 26203 Wardenburg',
                        'telefon': '04407 89-0',
                        'email': 'info@wardenburg.de'
                    }
                }
            }
        };
        
        // Zuständigkeits-Mapping für häufige Anfragen
        this.responsibilityMapping = {
            'ummelden': 'stadt_gemeinde',
            'anmelden': 'stadt_gemeinde',
            'bauantrag': 'stadt_gemeinde',
            'baugenehmigung': 'stadt_gemeinde',
            'feuerwehr': 'stadt_gemeinde',
            'standesamt': 'stadt_gemeinde',
            'einwohnermeldeamt': 'stadt_gemeinde',
            'jugendamt': 'landkreis',
            'sozialhilfe': 'landkreis',
            'gesundheitsamt': 'landkreis',
            'schule': 'landkreis',
            'gymnasium': 'landkreis',
            'berufsschule': 'landkreis',
            'öpnv': 'landkreis',
            'bus': 'landkreis',
            'kreistag': 'landkreis',
            'politik': 'landkreis'
        };
    }
    
    async generateResponse(query, userMessage) {
        // Bestimme zuständigen Agent
        const agent = this.agentHandler.routeToAgent(query);
        
        let response;
        if (agent === 'kaya') {
            response = this.generateKAYAResponse(query);
        } else {
            response = this.generateAgentResponse(agent, query);
        }

        // LLM-Enhancement falls aktiviert
        if (this.useLLM && !response.fallback) {
            try {
                response = await this.llmService.enhanceResponse(response, query);
            } catch (error) {
                console.error('LLM-Enhancement Fehler:', error);
                // Verwende ursprüngliche Antwort als Fallback
            }
        }

        return response;
    }
    
    generateKAYAResponse(query) {
        const greeting = "Moin! Ich bin KAYA, Ihr kommunaler KI-Assistent für den Landkreis Oldenburg.";
        
        // Erkenne Bürgerperspektive
        const persona = this.detectCitizenPersona(query);
        const personalizedGreeting = this.getPersonalizedGreeting(persona);
        
        // Prüfe auf lokale Zuständigkeiten
        const localContext = this.analyzeLocalContext(query);
        
        return {
            agent: 'kaya',
            response: `${greeting} ${personalizedGreeting}${localContext}`,
            suggestions: this.getContextualSuggestions(persona),
            persona: persona,
            localContext: localContext
        };
    }
    
    analyzeLocalContext(query) {
        const queryLower = query.toLowerCase();
        
        // Prüfe auf Ortsnamen
        const mentionedLocation = this.detectLocation(queryLower);
        if (mentionedLocation) {
            return this.getLocationSpecificResponse(mentionedLocation, queryLower);
        }
        
        // Prüfe auf Zuständigkeiten
        const responsibility = this.detectResponsibility(queryLower);
        if (responsibility) {
            return this.getResponsibilityResponse(responsibility, queryLower);
        }
        
        return "";
    }
    
    detectLocation(queryLower) {
        const locations = Object.keys(this.localStructure.städte).concat(Object.keys(this.localStructure.gemeinden));
        
        for (const location of locations) {
            if (queryLower.includes(location)) {
                return location;
            }
        }
        
        return null;
    }
    
    detectResponsibility(queryLower) {
        for (const [keyword, responsibility] of Object.entries(this.responsibilityMapping)) {
            if (queryLower.includes(keyword)) {
                return responsibility;
            }
        }
        
        return null;
    }
    
    getLocationSpecificResponse(location, queryLower) {
        const locationData = this.localStructure.städte[location] || this.localStructure.gemeinden[location];
        
        if (!locationData) return "";
        
        let response = `\n\n**📍 Lokaler Kontext für ${locationData.name}:**\n`;
        
        // Erkläre Zuständigkeiten
        if (queryLower.includes('ummelden') || queryLower.includes('anmelden')) {
            response += `Für Ummeldungen und Anmeldungen ist die **${locationData.name}** zuständig.\n`;
            response += `📞 **Direkter Kontakt:** ${locationData.kontakt.telefon}\n`;
            response += `🏢 **Adresse:** ${locationData.kontakt.adresse}\n`;
            if (locationData.kontakt.website) {
                response += `🌐 **Website:** ${locationData.kontakt.website}\n`;
            }
        } else if (queryLower.includes('bau') || queryLower.includes('bauantrag')) {
            response += `Für Baugenehmigungen ist die **${locationData.name}** zuständig.\n`;
            response += `📞 **Bauamt:** ${locationData.kontakt.telefon}\n`;
            response += `🏢 **Adresse:** ${locationData.kontakt.adresse}\n`;
        } else {
            response += `Die **${locationData.name}** ist zuständig für:\n`;
            locationData.zuständigkeiten.forEach(z => {
                response += `• ${z}\n`;
            });
            response += `\n📞 **Kontakt:** ${locationData.kontakt.telefon}\n`;
        }
        
        return response;
    }
    
    getResponsibilityResponse(responsibility, queryLower) {
        let response = "\n\n**🏛️ Zuständigkeits-Info:**\n";
        
        if (responsibility === 'landkreis') {
            response += "Das ist eine **Landkreis-Angelegenheit**.\n";
            response += "📞 **Landkreis Oldenburg:** 04431 85-0\n";
            response += "🏢 **Adresse:** Delmenhorster Straße 6, 27793 Wildeshausen\n";
        } else if (responsibility === 'stadt_gemeinde') {
            response += "Das ist eine **Stadt-/Gemeinde-Angelegenheit**.\n";
            response += "Bitte wenden Sie sich an Ihre örtliche Verwaltung:\n";
            response += "• **Wildeshausen:** 04431 65-0\n";
            response += "• **Vechta:** 04441 886-0\n";
            response += "• **Cloppenburg:** 04471 15-0\n";
            response += "• **Gemeinden:** Siehe jeweilige Gemeindeverwaltung\n";
        }
        
        return response;
    }
    
    detectCitizenPersona(query) {
        const queryLower = query.toLowerCase();
        
        // Bereinige die Anfrage von häufigen Fehlern
        const cleanedQuery = this.cleanQuery(queryLower);
        
        // Erkenne Persona mit erweitertem Matching
        const personaScores = this.calculatePersonaScores(cleanedQuery);
        
        // Finde die beste Übereinstimmung
        const bestPersona = this.findBestPersonaMatch(personaScores);
        
        // Wenn keine klare Persona erkannt, verwende Frage-Funnel
        if (bestPersona.score < 0.3) {
            return this.useQuestionFunnel(cleanedQuery);
        }
        
        return bestPersona.name;
    }
    
    cleanQuery(query) {
        // Entferne häufige Rechtschreibfehler und normalisiere
        const corrections = {
            'kindergarden': 'kindergarten',
            'kinderkrippe': 'kita',
            'schüler': 'schüler',
            'student': 'student',
            'studium': 'studium',
            'universität': 'universität',
            'hochschule': 'hochschule',
            'arbeit': 'arbeit',
            'job': 'job',
            'stelle': 'stelle',
            'bewerbung': 'bewerbung',
            'pflege': 'pflege',
            'senior': 'senioren',
            'alt': 'alt',
            'bau': 'bau',
            'haus': 'haus',
            'wohnung': 'wohnung',
            'bauantrag': 'bauantrag',
            'genehmigung': 'genehmigung'
        };
        
        let cleaned = query;
        for (const [wrong, correct] of Object.entries(corrections)) {
            cleaned = cleaned.replace(new RegExp(wrong, 'gi'), correct);
        }
        
        return cleaned;
    }
    
    calculatePersonaScores(query) {
        const scores = {};
        
        for (const [personaName, personaData] of Object.entries(this.citizenPersonas)) {
            let score = 0;
            
            // Keyword-Matching (höchste Gewichtung)
            const keywordMatches = personaData.keywords.filter(keyword => 
                query.includes(keyword) || this.fuzzyMatch(query, keyword)
            );
            score += keywordMatches.length * 0.4;
            
            // Context-Matching (mittlere Gewichtung)
            const contextMatches = personaData.contexts.filter(context => 
                query.includes(context) || this.fuzzyMatch(query, context)
            );
            score += contextMatches.length * 0.3;
            
            // Phrase-Matching (höchste Gewichtung für natürliche Sprache)
            const phraseMatches = personaData.phrases.filter(phrase => 
                query.includes(phrase) || this.fuzzyMatch(query, phrase)
            );
            score += phraseMatches.length * 0.5;
            
            // Länge der Anfrage berücksichtigen (längere Anfragen = mehr Kontext)
            const lengthBonus = Math.min(query.length / 100, 0.2);
            score += lengthBonus;
            
            scores[personaName] = score;
        }
        
        return scores;
    }
    
    fuzzyMatch(query, target) {
        // Einfaches Fuzzy-Matching für Rechtschreibfehler
        const queryWords = query.split(' ');
        const targetWords = target.split(' ');
        
        for (const queryWord of queryWords) {
            for (const targetWord of targetWords) {
                // Exakte Übereinstimmung
                if (queryWord === targetWord) return true;
                
                // Teilstring-Übereinstimmung
                if (queryWord.includes(targetWord) || targetWord.includes(queryWord)) return true;
                
                // Levenshtein-Distanz für ähnliche Wörter
                if (this.levenshteinDistance(queryWord, targetWord) <= 2) return true;
            }
        }
        
        return false;
    }
    
    // Erweiterte Levenshtein-Distanz für Fuzzy-Matching (Phase 5.1)
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    // Erweiterte Fuzzy-Match-Funktion (Phase 5.1)
    fuzzyMatch(str1, str2) {
        const distance = this.levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
        const maxLength = Math.max(str1.length, str2.length);
        
        if (maxLength === 0) return 1;
        
        const similarity = 1 - (distance / maxLength);
        
        // Bonus für ähnliche Anfangsbuchstaben
        if (str1.charAt(0) === str2.charAt(0)) {
            return similarity + 0.1;
        }
        
        return similarity;
    }

    // Phonetische Ähnlichkeit (Phase 5.1)
    phoneticSimilarity(str1, str2) {
        const phonetic1 = this.getPhoneticCode(str1);
        const phonetic2 = this.getPhoneticCode(str2);
        
        return phonetic1 === phonetic2 ? 0.8 : 0;
    }

    // Einfacher phonetischer Code (Phase 5.1)
    getPhoneticCode(str) {
        return str.toLowerCase()
            .replace(/ä/g, 'ae')
            .replace(/ö/g, 'oe')
            .replace(/ü/g, 'ue')
            .replace(/ß/g, 'ss')
            .replace(/[^a-z]/g, '')
            .replace(/(.)\1+/g, '$1'); // Doppelte Buchstaben entfernen
    }
    
    findBestPersonaMatch(scores) {
        let bestPersona = { name: 'allgemein', score: 0 };
        
        for (const [personaName, score] of Object.entries(scores)) {
            if (score > bestPersona.score) {
                bestPersona = { name: personaName, score: score };
            }
        }
        
        return bestPersona;
    }
    
    useQuestionFunnel(query) {
        // Intelligenter Frage-Funnel für unklare Anfragen
        const funnelQuestions = {
            'familie': [
                'Haben Sie Fragen zu Kindern, Familie oder Betreuung?',
                'Geht es um Kita, Schule oder Jugendhilfe?',
                'Suchen Sie Hilfe für Ihre Familie?'
            ],
            'unternehmen': [
                'Haben Sie gewerbliche Angelegenheiten?',
                'Suchen Sie nach Arbeit oder Stellen?',
                'Geht es um Ihr Unternehmen oder Ihre Firma?'
            ],
            'senioren': [
                'Haben Sie Fragen zu Pflege oder Seniorenangeboten?',
                'Suchen Sie Hilfe für ältere Menschen?',
                'Geht es um Pflegegeld oder Betreuung?'
            ],
            'bauherren': [
                'Haben Sie Bauvorhaben oder Baugenehmigungen?',
                'Planen Sie zu bauen oder zu renovieren?',
                'Geht es um Grundstück oder Immobilien?'
            ],
            'studenten': [
                'Sind Sie Student oder planen Sie zu studieren?',
                'Haben Sie Fragen zu BAföG oder Stipendien?',
                'Geht es um Hochschule oder Universität?'
            ],
            'arbeitslose': [
                'Sind Sie arbeitslos oder suchen Sie Arbeit?',
                'Haben Sie Fragen zu Arbeitslosengeld?',
                'Benötigen Sie Hilfe bei der Jobsuche?'
            ],
            'behinderte': [
                'Haben Sie eine Behinderung oder benötigen Sie Hilfe?',
                'Geht es um Behindertenausweis oder Nachteilsausgleich?',
                'Suchen Sie Assistenz oder Betreuung?'
            ],
            'migranten': [
                'Sind Sie Ausländer oder Migrant?',
                'Haben Sie Fragen zu Aufenthalt oder Einbürgerung?',
                'Möchten Sie Deutsch lernen oder sich integrieren?'
            ]
        };
        
        // Erkenne Hinweise in der Anfrage für gezielte Fragen
        if (query.includes('kind') || query.includes('familie')) {
            return 'familie';
        }
        if (query.includes('arbeit') || query.includes('job') || query.includes('stelle')) {
            return 'unternehmen';
        }
        if (query.includes('pflege') || query.includes('alt') || query.includes('senior')) {
            return 'senioren';
        }
        if (query.includes('bau') || query.includes('haus') || query.includes('wohnung')) {
            return 'bauherren';
        }
        if (query.includes('studium') || query.includes('universität') || query.includes('hochschule')) {
            return 'studenten';
        }
        if (query.includes('arbeitslos') || query.includes('alg') || query.includes('jobcenter')) {
            return 'arbeitslose';
        }
        if (query.includes('behindert') || query.includes('behinderung') || query.includes('rollstuhl')) {
            return 'behinderte';
        }
        if (query.includes('ausländer') || query.includes('migrant') || query.includes('deutsch lernen')) {
            return 'migranten';
        }
        
        return 'allgemein';
    }
    
    getPersonalizedGreeting(persona) {
        const greetings = {
            'familie': "Ich helfe Ihnen gerne bei allen Fragen rund um Familie, Kinderbetreuung und Bildung. Was benötigen Sie für Ihr Kind oder Ihre Familie?",
            'unternehmen': "Gerne unterstütze ich Sie bei gewerblichen Angelegenheiten, Anträgen und Verwaltungsaufgaben. Womit kann ich Ihnen helfen?",
            'senioren': "Ich bin da, um Ihnen bei allen Fragen rund um Pflege, Unterstützung und Seniorenangebote zu helfen. Was beschäftigt Sie?",
            'bauherren': "Bei Bauvorhaben und Baugenehmigungen begleite ich Sie gerne durch den Prozess. Was planen Sie zu bauen?",
            'studenten': "Gerne unterstütze ich Sie bei allen Fragen rund um Studium, BAföG und studentische Angelegenheiten. Womit kann ich Ihnen helfen?",
            'arbeitslose': "Ich helfe Ihnen gerne bei der Jobsuche, Bewerbungen und arbeitslosenbezogenen Angelegenheiten. Was benötigen Sie?",
            'behinderte': "Ich unterstütze Sie gerne bei allen Fragen rund um Behinderung, Nachteilsausgleich und Assistenz. Womit kann ich Ihnen helfen?",
            'migranten': "Gerne helfe ich Ihnen bei Fragen zu Aufenthalt, Einbürgerung und Integration. Womit kann ich Ihnen helfen?",
            'allgemein': "Wie kann ich Ihnen heute helfen? Ich unterstütze Sie bei allen Anliegen rund um den Landkreis Oldenburg."
        };
        
        return greetings[persona] || greetings['allgemein'];
    }
    
    getContextualSuggestions(persona) {
        const suggestions = {
            'familie': [
                "Kita-Anmeldung",
                "Schulangelegenheiten", 
                "Familienberatung",
                "Jugendhilfe",
                "Sorgerecht",
                "Unterhalt"
            ],
            'unternehmen': [
                "Gewerbeanmeldung",
                "Stellenausschreibungen",
                "Fördermöglichkeiten",
                "Wirtschaftsförderung",
                "Gründungsberatung",
                "Personal"
            ],
            'senioren': [
                "Pflegegeld beantragen",
                "Seniorenberatung",
                "Betreuungsangebote",
                "Hilfe im Alltag",
                "Pflegestufe",
                "Wohnheim"
            ],
            'bauherren': [
                "Baugenehmigung",
                "Bauantrag stellen",
                "Bauaufsicht",
                "Grundstücksangelegenheiten",
                "Architekt",
                "Finanzierung"
            ],
            'studenten': [
                "BAföG beantragen",
                "Stipendien",
                "Wohnheim",
                "Studienberatung",
                "Praktikum",
                "Werkstudent"
            ],
            'arbeitslose': [
                "Arbeitslosengeld",
                "Jobsuche",
                "Bewerbungstraining",
                "Qualifizierung",
                "Umschulung",
                "Berufsberatung"
            ],
            'behinderte': [
                "Behindertenausweis",
                "Nachteilsausgleich",
                "Assistenz",
                "Betreuung",
                "Pflege",
                "Barrierefreiheit"
            ],
            'migranten': [
                "Aufenthalt",
                "Einbürgerung",
                "Deutsch lernen",
                "Integrationskurs",
                "Anerkennung",
                "Qualifikation"
            ],
            'allgemein': [
                "Formulare und Anträge",
                "Kontakte und Öffnungszeiten", 
                "Stellenausschreibungen",
                "Ratsinfo und Sitzungen"
            ]
        };
        
        return suggestions[persona] || suggestions['allgemein'];
    }
    
    generateAgentResponse(agent, query, language = 'de') {
        const agentData = this.agentHandler.searchAgentData(agent, query);
        
        console.log(`Agent ${agent}: ${agentData.length} Ergebnisse für "${query}" (${language})`);
        
        if (agentData.length === 0) {
            // Fallback: Zeige allgemeine Informationen über den Agent
            const agentInfo = this.getAgentInfo(agent);
            return {
                agent: agent,
                response: this.getFallbackMessage(language),
                fallback: true,
                suggestion: agentInfo.suggestion,
                confidence: 0,
                source: 'fallback',
                detectedLanguage: language
            };
        }
        
        // Validiere Datenqualität vor Antwort
        const validatedData = this.validateDataQuality(agentData);
        if (validatedData.length === 0) {
            return {
                agent: agent,
                response: `Ich habe keine verlässlichen Informationen zu "${query}" gefunden. Bitte kontaktieren Sie uns direkt für eine persönliche Beratung.`,
                fallback: true,
                confidence: 0,
                source: 'no_valid_data'
            };
        }
        
        // Erstelle empathische, zielgerichtete Antwort
        const response = this.createEmpatheticResponse(agent, validatedData.slice(0, 3), query);
        
        return {
            agent: agent,
            response: response,
            data: validatedData.slice(0, 3),
            links: this.extractLinks(validatedData.slice(0, 3)),
            confidence: this.calculateConfidence(validatedData, query),
            source: 'agent_data'
        };
    }
    
    validateDataQuality(data) {
        // Validiere Datenqualität - nur verlässliche Daten verwenden
        return data.filter(item => {
            // Mindestanforderungen für valide Daten
            return item.title && 
                   item.title.length > 10 && 
                   item.url && 
                   item.url.startsWith('http') &&
                   item.content && 
                   item.content.length > 50;
        });
    }
    
    calculateConfidence(data, query) {
        if (data.length === 0) return 0;
        
        // Berechne Konfidenz basierend auf Datenqualität und Relevanz
        let confidence = 0.5; // Basis-Konfidenz
        
        // Erhöhe Konfidenz für mehr Daten
        confidence += Math.min(data.length * 0.1, 0.3);
        
        // Erhöhe Konfidenz für exakte Matches
        const queryLower = query.toLowerCase();
        const exactMatches = data.filter(item => 
            item.title.toLowerCase().includes(queryLower) ||
            item.content.toLowerCase().includes(queryLower)
        );
        
        if (exactMatches.length > 0) {
            confidence += 0.2;
        }
        
        return Math.min(confidence, 1.0);
    }
    
    createEmpatheticResponse(agent, data, query) {
        const queryLower = query.toLowerCase();
        const persona = this.detectCitizenPersona(query);
        
        // Empathische Einleitung basierend auf dem Anliegen
        let empatheticIntro = this.getEmpatheticIntro(agent, queryLower, persona);
        
        // Proaktive Lösung-Dialoge hinzufügen (Phase 5.2)
        let proactiveSolution = this.createProactiveSolutionDialog(agent, persona, query, data);
        
        // Erkläre den Prozess und begleite den Bürger
        let processExplanation = this.explainProcess(agent, queryLower, persona);
        
        // Zeige die konkreten Optionen mit Erklärungen
        let options = this.presentOptionsWithGuidance(data, persona);
        
        // Aktive Nachfragen für weitere Unterstützung
        let followUpQuestions = this.generateFollowUpQuestions(agent, queryLower, persona);
        
        return `${empatheticIntro}\n\n${proactiveSolution}\n\n${processExplanation}\n\n${options}\n\n${followUpQuestions}`;
    }
    
    getEmpatheticIntro(agent, queryLower, persona) {
        const intros = {
            'buergerdienste': {
                'familie': [
                    "Das verstehe ich gut! Als Familie haben Sie viele wichtige Angelegenheiten zu regeln.",
                    "Gerne unterstütze ich Sie bei diesem wichtigen Schritt für Ihre Familie.",
                    "Ich weiß, wie wichtig solche Angelegenheiten für Familien sind."
                ],
                'unternehmen': [
                    "Als Unternehmer haben Sie viel zu organisieren - ich helfe Ihnen gerne dabei.",
                    "Gewerbliche Angelegenheiten können komplex sein, lassen Sie uns das Schritt für Schritt angehen.",
                    "Ich unterstütze Sie gerne bei Ihrem Vorhaben."
                ],
                'senioren': [
                    "Ich verstehe, dass solche Angelegenheiten wichtig für Sie sind.",
                    "Gerne helfe ich Ihnen bei diesem wichtigen Schritt.",
                    "Lassen Sie uns das gemeinsam angehen."
                ],
                'bauherren': [
                    "Ein Bauvorhaben ist ein großer Schritt - ich begleite Sie gerne durch den Prozess.",
                    "Baugenehmigungen können komplex sein, aber wir schaffen das zusammen.",
                    "Ich helfe Ihnen gerne bei Ihrem Bauvorhaben."
                ],
                'allgemein': [
                    "Gerne helfe ich Ihnen bei diesem Anliegen.",
                    "Das kann ich für Sie klären!",
                    "Ich unterstütze Sie gerne dabei."
                ]
            },
            'ratsinfo': {
                'allgemein': [
                    "Transparenz ist wichtig - gerne informiere ich Sie über die politischen Entscheidungen.",
                    "Als Bürger haben Sie das Recht auf Information - ich helfe Ihnen dabei.",
                    "Gerne erkläre ich Ihnen die politischen Prozesse im Landkreis."
                ]
            },
            'stellenportal': {
                'unternehmen': [
                    "Als Arbeitgeber suchen Sie die besten Mitarbeiter - ich helfe Ihnen dabei.",
                    "Gerne unterstütze ich Sie bei der Personalsuche.",
                    "Ich begleite Sie gerne durch den Bewerbungsprozess."
                ],
                'allgemein': [
                    "Eine neue Stelle ist ein wichtiger Schritt - ich helfe Ihnen gerne dabei.",
                    "Gerne unterstütze ich Sie bei Ihrer Jobsuche.",
                    "Ich begleite Sie gerne durch den Bewerbungsprozess."
                ]
            }
        };
        
        const agentIntros = intros[agent] || intros['buergerdienste'];
        const personaIntros = agentIntros[persona] || agentIntros['allgemein'];
        
        return personaIntros[Math.floor(Math.random() * personaIntros.length)];
    }
    
    explainProcess(agent, queryLower, persona) {
        const explanations = {
            'buergerdienste': {
                'familie': "Hier ist der typische Ablauf für Familienangelegenheiten:\n1. 📋 Antrag ausfüllen\n2. 📄 Dokumente zusammenstellen\n3. 📅 Termin vereinbaren\n4. ✅ Bearbeitung und Bescheid",
                'unternehmen': "Für gewerbliche Angelegenheiten läuft es meist so ab:\n1. 📋 Antrag stellen\n2. 📄 Nachweise einreichen\n3. ⏱️ Bearbeitungszeit abwarten\n4. ✅ Genehmigung erhalten",
                'bauherren': "Der Bauprozess läuft in diesen Schritten ab:\n1. 📋 Bauantrag einreichen\n2. 📄 Pläne und Nachweise\n3. 🔍 Prüfung durch Bauamt\n4. ✅ Baugenehmigung erhalten",
                'allgemein': "Der typische Ablauf ist:\n1. 📋 Antrag ausfüllen\n2. 📄 Dokumente bereitstellen\n3. 📅 Einreichen oder Termin\n4. ✅ Bearbeitung und Bescheid"
            },
            'ratsinfo': "Die politischen Prozesse im Landkreis:\n1. 📅 Sitzungstermine einsehen\n2. 📄 Tagesordnungen prüfen\n3. 🗳️ Beschlüsse verfolgen\n4. 📞 Bei Fragen nachfragen",
            'stellenportal': "Der Bewerbungsprozess:\n1. 🔍 Stellenausschreibungen durchsuchen\n2. 📋 Bewerbung vorbereiten\n3. 📤 Bewerbung einreichen\n4. 📞 Nachfassen bei Interesse"
        };
        
        const agentExplanations = explanations[agent] || explanations['buergerdienste'];
        const personaExplanations = agentExplanations[persona] || agentExplanations['allgemein'];
        
        return personaExplanations;
    }
    
    presentOptionsWithGuidance(data, persona) {
        if (data.length === 0) return "Leider habe ich keine passenden Informationen gefunden.";
        
        let options = "**Hier sind Ihre konkreten Optionen:**\n\n";
        
        data.forEach((item, index) => {
            const stepNumber = index + 1;
            const title = this.createDescriptiveLinkText(item.title, item.url);
            
            options += `**${stepNumber}. ${title}**\n`;
            
            // Erkläre, was der Bürger hier findet
            if (item.content && item.content.length > 100) {
                const summary = item.content.substring(0, 150) + '...';
                options += `   ${summary}\n`;
            }
            
            // Zeige konkrete Kontakte
            if (item.contacts && item.contacts.length > 0) {
                options += `   📞 **Direkter Kontakt:** `;
                item.contacts.forEach((contact, idx) => {
                    options += `${contact.value}`;
                    if (idx < item.contacts.length - 1) options += ` oder `;
                });
                options += `\n`;
            }
            
            // Zeige verfügbare Formulare
            if (item.forms && item.forms.length > 0) {
                options += `   📋 **Formulare:** `;
                item.forms.forEach((form, idx) => {
                    options += `${form.title}`;
                    if (idx < item.forms.length - 1) options += `, `;
                });
                options += `\n`;
            }
            
            options += `   🔗 **Direktlink:** ${item.url}\n\n`;
        });
        
        return options;
    }
    
    generateFollowUpQuestions(agent, queryLower, persona) {
        const followUps = {
            'buergerdienste': {
                'familie': [
                    "Brauchen Sie Hilfe bei der Antragstellung?",
                    "Haben Sie Fragen zu den erforderlichen Dokumenten?",
                    "Möchten Sie einen Termin vereinbaren?",
                    "Soll ich Ihnen weitere Familienangelegenheiten zeigen?"
                ],
                'unternehmen': [
                    "Haben Sie Fragen zum Antragsverfahren?",
                    "Benötigen Sie Hilfe bei der Dokumentenzusammenstellung?",
                    "Möchten Sie weitere gewerbliche Services sehen?",
                    "Soll ich Ihnen Fördermöglichkeiten zeigen?"
                ],
                'bauherren': [
                    "Haben Sie Fragen zum Bauverfahren?",
                    "Benötigen Sie Hilfe bei der Antragstellung?",
                    "Möchten Sie weitere Bauangelegenheiten sehen?",
                    "Soll ich Ihnen Kontakte zur Bauaufsicht geben?"
                ],
                'allgemein': [
                    "Haben Sie Fragen zum Verfahren?",
                    "Benötigen Sie Hilfe bei der Antragstellung?",
                    "Möchten Sie weitere Informationen?",
                    "Soll ich Ihnen Kontakte geben?"
                ]
            },
            'ratsinfo': [
                "Möchten Sie über eine bestimmte Sitzung informiert werden?",
                "Haben Sie Fragen zu einem Beschluss?",
                "Soll ich Ihnen die nächsten Termine zeigen?",
                "Möchten Sie Kontakt zu einem Gremium?"
            ],
            'stellenportal': [
                "Haben Sie Fragen zu einer bestimmten Stelle?",
                "Möchten Sie Hilfe bei der Bewerbung?",
                "Soll ich Ihnen weitere Stellen zeigen?",
                "Benötigen Sie Kontakte zur Personalabteilung?"
            ]
        };
        
        const agentFollowUps = followUps[agent] || followUps['buergerdienste'];
        const personaFollowUps = agentFollowUps[persona] || agentFollowUps['allgemein'];
        
        const selectedQuestions = personaFollowUps.slice(0, 2);
        
        return `**Wie kann ich Ihnen weiterhelfen?**\n\n${selectedQuestions.map(q => `• ${q}`).join('\n')}`;
    }
    
    createDescriptiveLinkText(title, url) {
        // Erstelle aussagekräftige Link-Texte basierend auf Inhalt
        const titleLower = title.toLowerCase();
        const urlLower = url.toLowerCase();
        
        // Spezifische Mappings für bessere Lesbarkeit
        if (titleLower.includes('bauantrag') || titleLower.includes('baugenehmigung')) {
            return '🏗️ Bauantrag-Formular und Verfahren';
        }
        if (titleLower.includes('geburtsurkunde')) {
            return '👶 Geburtsurkunde beantragen';
        }
        if (titleLower.includes('ratsinfo') || titleLower.includes('kreistag')) {
            return '🏛️ Kreistagsinformationen und Sitzungen';
        }
        if (titleLower.includes('jugend') || titleLower.includes('familie')) {
            return '👨‍👩‍👧‍👦 Jugendamt und Familienberatung';
        }
        if (titleLower.includes('stellen') || titleLower.includes('bewerbung')) {
            return '💼 Stellenausschreibungen und Bewerbungen';
        }
        if (titleLower.includes('kontakt') || titleLower.includes('ansprechpartner')) {
            return '📞 Ansprechpartner und Kontakte';
        }
        
        // Fallback: Verwende den Titel, aber kürzer
        return title.length > 60 ? title.substring(0, 60) + '...' : title;
    }
    
    extractLinks(data) {
        const links = [];
        
        data.forEach(item => {
            // Hauptlink
            links.push({
                title: this.createDescriptiveLinkText(item.title, item.url),
                url: item.url,
                type: 'main'
            });
            
            // Formular-Links
            if (item.forms && item.forms.length > 0) {
                item.forms.forEach(form => {
                    links.push({
                        title: `📋 ${form.title}`,
                        url: form.url,
                        type: 'form'
                    });
                });
            }
        });
        
        return links;
    }
    
    getAgentInfo(agent) {
        const agentInfos = {
            'buergerdienste': {
                description: 'Bürgerdiensten und Verwaltungsangelegenheiten',
                suggestion: 'Ich kann Ihnen bei Formularen, Anträgen und Dienstleistungen helfen.'
            },
            'ratsinfo': {
                description: 'politischen Informationen und Kreistagsangelegenheiten',
                suggestion: 'Ich zeige Ihnen Sitzungstermine, Beschlüsse und politische Prozesse.'
            },
            'stellenportal': {
                description: 'Stellenausschreibungen und Bewerbungen',
                suggestion: 'Ich helfe Ihnen bei der Jobsuche und Bewerbungsprozessen.'
            },
            'kontakte': {
                description: 'Kontakten und Ansprechpartnern',
                suggestion: 'Ich gebe Ihnen die richtigen Kontakte für Ihr Anliegen.'
            },
            'jugend': {
                description: 'Jugend- und Familienangelegenheiten',
                suggestion: 'Ich unterstütze Sie bei Fragen rund um Familie und Jugend.'
            },
            'soziales': {
                description: 'sozialen Angelegenheiten und Unterstützung',
                suggestion: 'Ich helfe Ihnen bei sozialen Fragen und Hilfsangeboten.'
            }
        };
        
        return agentInfos[agent] || agentInfos['buergerdienste'];
    }
    
    // Multi-Language Support Methods (Phase 1.1)
    detectLanguage(query) {
        const queryLower = query.toLowerCase();
        
        // Prüfe auf Keywords für verschiedene Sprachen
        for (const [lang, patterns] of Object.entries(this.languagePatterns)) {
            for (const pattern of patterns) {
                if (queryLower.includes(pattern)) {
                    return lang;
                }
            }
        }
        
        return 'de'; // Default zu Deutsch
    }
    
    getGreeting(language = 'de') {
        const greetings = {
            'de': 'Moin! Wie kann ich Ihnen helfen?',
            'en': 'Hello! How can I help you?',
            'tr': 'Merhaba! Size nasil yardimci olabilirim?',
            'ar': 'Marhaba! Kayfa yumkinuni musaada?',
            'fr': 'Bonjour! Comment puis-je vous aider?',
            'es': 'Hola! Como puedo ayudarte?',
            'ru': 'Privet! Kak ya mogu pomoch?',
            'pl': 'Czesc! Jak moge pomoc?'
        };
        return greetings[language] || greetings['de'];
    }
    
    getFallbackMessage(language = 'de') {
        const messages = {
            'de': 'Gerne helfe ich Ihnen bei Ihrem Anliegen. Bitte beschreiben Sie, wobei ich Ihnen helfen kann.',
            'en': 'I would be happy to help you with your request. Please describe how I can assist you.',
            'tr': 'Talebinizde size yardimci olmaktan memnuniyet duyarim. Lutfen nasil yardimci olabilecegimi aciklayin.',
            'ar': 'Sa-urid musaadataka fi talabik. Min fadlik wasif kayfa yumkinuni musaada.',
            'fr': 'Je serais heureux de vous aider avec votre demande. Veuillez decrire comment je peux vous assister.',
            'es': 'Estaria encantado de ayudarte con tu solicitud. Por favor describe como puedo asistirte.',
            'ru': 'Ya budu rad pomoch vam s vashim zaprosom. Pozhaluysta opishite, kak ya mogu pomoch.',
            'pl': 'Chcialbym pomoc z twoja prosba. Prosze opisz, jak moge pomoc.'
        };
        return messages[language] || messages['de'];
    }
    
    // Hauptmethode für Multi-Language Support (Phase 1.2)
    generateResponse(query, userMessage) {
        // Erkenne Sprache automatisch
        const detectedLanguage = this.detectLanguage(query);
        const languageName = this.supportedLanguages[detectedLanguage];
        
        console.log(`🌍 Sprache erkannt: ${detectedLanguage} (${languageName})`);
        
        // Generiere Antwort basierend auf Sprache
        const response = this.generateKAYAResponse(query, detectedLanguage);
        
        return {
            response: response,
            detectedLanguage: detectedLanguage,
            languageName: languageName,
            timestamp: new Date().toISOString()
        };
    }
    
    generateKAYAResponse(query, language = 'de') {
        // Verwende sprach-spezifische Begrüßung
        const greeting = this.getGreeting(language);
        
        // Erkenne Persona
        const persona = this.detectCitizenPersona(query);
        
        // Finde passenden Agent
        const agent = this.findBestAgent(query);
        
        if (agent) {
            // Generiere Agent-spezifische Antwort
            const agentResponse = this.generateAgentResponse(agent, query, language);
            return `${greeting}\n\n${agentResponse.response}`;
        } else {
            // Fallback-Antwort
            return `${greeting}\n\n${this.getFallbackMessage(language)}`;
        }
    }
    
    // Erweiterte Persona-Score-Berechnung (Phase 5.1)
    calculatePersonaScores(query) {
        const scores = {};
        const words = query.split(/\s+/);
        
        for (const [personaName, personaData] of Object.entries(this.citizenPersonas)) {
            let score = 0;
            
            // Keyword-Matching mit Fuzzy-Matching
            for (const word of words) {
                let bestMatch = 0;
                
                for (const keyword of personaData.keywords) {
                    // Exakte Übereinstimmung
                    if (word === keyword) {
                        bestMatch = Math.max(bestMatch, 2.0);
                    } else {
                        // Fuzzy-Matching
                        const fuzzyScore = this.fuzzyMatch(word, keyword);
                        if (fuzzyScore > 0.7) {
                            bestMatch = Math.max(bestMatch, fuzzyScore * 1.5);
                        }
                        
                        // Phonetische Ähnlichkeit
                        const phoneticScore = this.phoneticSimilarity(word, keyword);
                        if (phoneticScore > 0) {
                            bestMatch = Math.max(bestMatch, phoneticScore);
                        }
                    }
                }
                
                score += bestMatch;
            }
            
            // Context-Matching
            for (const word of words) {
                if (personaData.contexts.includes(word)) {
                    score += 1.0;
                }
            }
            
            // Phrase-Matching mit Fuzzy-Matching
            for (const phrase of personaData.phrases) {
                const phraseWords = phrase.split(/\s+/);
                let phraseScore = 0;
                
                for (const phraseWord of phraseWords) {
                    for (const word of words) {
                        const fuzzyScore = this.fuzzyMatch(word, phraseWord);
                        if (fuzzyScore > 0.8) {
                            phraseScore += fuzzyScore;
                        }
                    }
                }
                
                if (phraseScore > 0) {
                    score += phraseScore * 2.0; // Höhere Gewichtung für Phrasen
                }
            }
            
            scores[personaName] = score;
        }
        
        return scores;
    }
    
    // Proaktive Problem-Lösungs-Dialoge (Phase 5.2)
    createProactiveSolutionDialog(agent, persona, query, data) {
        const solutionTemplates = {
            'buergerdienste': {
                'familie': {
                    'kita': this.createKitaSolutionDialog(data),
                    'schule': this.createSchuleSolutionDialog(data),
                    'jugend': this.createJugendSolutionDialog(data),
                    'default': this.createFamilieSolutionDialog(data)
                },
                'unternehmen': {
                    'gewerbe': this.createGewerbeSolutionDialog(data),
                    'stellen': this.createStellenSolutionDialog(data),
                    'default': this.createUnternehmenSolutionDialog(data)
                },
                'bauherren': {
                    'bauantrag': this.createBauantragSolutionDialog(data),
                    'genehmigung': this.createGenehmigungSolutionDialog(data),
                    'default': this.createBauherrenSolutionDialog(data)
                },
                'senioren': {
                    'pflege': this.createPflegeSolutionDialog(data),
                    'betreuung': this.createBetreuungSolutionDialog(data),
                    'default': this.createSeniorenSolutionDialog(data)
                },
                'default': this.createDefaultSolutionDialog(data),
                'allgemein': this.createDefaultSolutionDialog(data)
            },
            'ratsinfo': this.createRatsinfoSolutionDialog(data),
            'stellenportal': this.createStellenportalSolutionDialog(data),
            'kontakte': this.createKontakteSolutionDialog(data),
            'jugend': this.createJugendSolutionDialog(data),
            'soziales': this.createSozialesSolutionDialog(data)
        };

        const agentSolutions = solutionTemplates[agent] || solutionTemplates['buergerdienste'];
        
        if (typeof agentSolutions === 'function') {
            return agentSolutions();
        }
        
        const personaSolutions = agentSolutions[persona] || agentSolutions['default'];
        
        if (typeof personaSolutions === 'function') {
            return personaSolutions();
        }
        
        const specificSolution = personaSolutions[this.detectSpecificTopic(query)] || personaSolutions['default'];
        
        if (typeof specificSolution === 'function') {
            return specificSolution();
        }
        
        return specificSolution || this.createDefaultSolutionDialog(data);
    }

    // Spezifische Lösung-Dialoge (Phase 5.2)
    createKitaSolutionDialog(data) {
        return `**🏫 Kita-Anmeldung - Schritt für Schritt erklärt:**

Ich helfe Ihnen gerne bei der Kita-Anmeldung! Hier ist der komplette Ablauf:

**📋 Schritt 1: Vorbereitung**
• Geburtsurkunde des Kindes
• Nachweis über Erwerbstätigkeit/Studium
• Wohnsitznachweis

**📅 Schritt 2: Antragstellung**
• Online-Antrag über das Kita-Portal
• Oder persönlich im Jugendamt
• Wunsch-Kitas angeben (bis zu 3)

**⏱️ Schritt 3: Wartezeit**
• Bearbeitungszeit: 4-6 Wochen
• Sie erhalten einen Bescheid
• Bei Ablehnung: Widerspruch möglich

**✅ Schritt 4: Platzvergabe**
• Bei Zusage: Vertrag unterschreiben
• Einzahlung der Kaution
• Starttermin vereinbaren

**💡 Pro-Tipp:** Melden Sie sich frühzeitig an - die besten Plätze sind schnell vergeben!

Haben Sie bereits eine bestimmte Kita im Blick? Ich kann Ihnen bei der Auswahl helfen!`;
    }

    createSchuleSolutionDialog(data) {
        return `**🎓 Schuleinschreibung - Alles was Sie wissen müssen:**

Die Schuleinschreibung ist ein wichtiger Schritt! Hier begleite ich Sie:

**📋 Schritt 1: Anmeldung**
• Termin beim Schulamt vereinbaren
• Geburtsurkunde mitbringen
• Impfpass vorlegen
• Gesundheitszeugnis (falls erforderlich)

**🏫 Schritt 2: Schulwahl**
• Sprengel-Schule (automatisch zugewiesen)
• Oder Antrag auf andere Schule
• Besondere pädagogische Konzepte berücksichtigen

**📅 Schritt 3: Termine**
• Anmeldung: Januar/Februar
• Schuleingangsuntersuchung: März/April
• Einschulung: September

**💡 Wichtige Hinweise:**
• Früh anmelden - Plätze sind begrenzt
• Bei besonderen Bedürfnissen: Förderbedarf prüfen lassen
• Geschwisterkinder haben Vorrang

**🤔 Haben Sie Fragen zu:**
• Schulformen (Grundschule, Gymnasium, etc.)?
• Besonderen pädagogischen Konzepten?
• Förderbedarf Ihres Kindes?`;
    }

    createBauantragSolutionDialog(data) {
        return `**🏗️ Bauantrag stellen - Kompletter Leitfaden:**

Ein Bauantrag kann kompliziert sein - ich führe Sie durch den Prozess:

**📋 Schritt 1: Vorbereitung**
• Bauzeichnungen (Architekt erforderlich)
• Grundstücksnachweis
• Baubeschreibung
• Statische Berechnungen

**📄 Schritt 2: Antrag einreichen**
• Formulare ausfüllen
• Alle Unterlagen zusammenstellen
• Gebühren bezahlen
• Einreichung beim Bauamt

**🔍 Schritt 3: Prüfung**
• Bauamt prüft Pläne
• Nachbarn werden informiert
• Öffentliche Auslegung (1 Monat)
• Stellungnahmen werden berücksichtigt

**✅ Schritt 4: Genehmigung**
• Baugenehmigung erhalten
• Baubeginn innerhalb 3 Jahre
• Bauaufsicht kontrolliert

**⏱️ Bearbeitungszeit:** 2-4 Monate

**💡 Pro-Tipps:**
• Architekt frühzeitig beauftragen
• Nachbarn vorher informieren
• Alle Vorschriften beachten

**🤔 Benötigen Sie Hilfe bei:**
• Architektensuche?
• Kostenkalkulation?
• Baugenehmigungsverfahren?`;
    }

    createPflegeSolutionDialog(data) {
        return `**👴 Pflegegeld beantragen - Unterstützung für Sie:**

Pflegegeld kann eine große Hilfe sein! Hier der komplette Weg:

**📋 Schritt 1: Antragstellung**
• Antrag bei der Pflegekasse
• Arztzeugnis über Pflegebedürftigkeit
• Pflegegrad-Bescheid erforderlich

**🏥 Schritt 2: Begutachtung**
• MDK (Medizinischer Dienst) kommt vorbei
• Pflegegrad wird festgestellt (1-5)
• Bescheid erhalten Sie per Post

**💰 Schritt 3: Leistungen**
• Pflegegeld: 316€ - 901€ (je nach Grad)
• Pflegesachleistungen möglich
• Entlastungsbetrag: 125€ monatlich

**📅 Schritt 4: Antragstellung**
• Formulare ausfüllen
• Nachweise einreichen
• Bearbeitung: 4-6 Wochen

**💡 Wichtige Hinweise:**
• Antrag sofort stellen
• Rückwirkung nur 3 Monate
• Regelmäßige Überprüfung

**🤔 Benötigen Sie Hilfe bei:**
• Antragstellung?
• Pflegegrad-Einstufung?
• Zusätzlichen Leistungen?`;
    }

    createGewerbeSolutionDialog(data) {
        return `**🏢 Gewerbeanmeldung - Ihr Weg in die Selbstständigkeit:**

Gerne begleite ich Sie bei der Gewerbeanmeldung:

**📋 Schritt 1: Vorbereitung**
• Gewerbeart festlegen
• Geschäftsräume finden
• Finanzierung klären
• Businessplan erstellen

**📄 Schritt 2: Anmeldung**
• Gewerbeschein beantragen
• Steuernummer beantragen
• IHK/Handwerkskammer-Mitgliedschaft
• Berufshaftpflichtversicherung

**💰 Schritt 3: Finanzen**
• Geschäftskonto eröffnen
• Buchhaltung einrichten
• Steuerberater beauftragen
• Fördermittel prüfen

**✅ Schritt 4: Start**
• Gewerbe starten
• Rechnungen schreiben
• Buchhaltung führen

**⏱️ Bearbeitungszeit:** 1-2 Wochen

**💡 Pro-Tipps:**
• Beratung vor Anmeldung nutzen
• Alle Vorschriften beachten
• Netzwerk aufbauen

**🤔 Benötigen Sie Hilfe bei:**
• Gewerbeart-Wahl?
• Fördermitteln?
• Steuerlichen Fragen?`;
    }

    // Topic-Erkennung für spezifische Lösungen (Phase 5.2)
    detectSpecificTopic(query) {
        const queryLower = query.toLowerCase();
        
        const topicKeywords = {
            'kita': ['kita', 'kindergarten', 'krippe', 'betreuung', 'tagesmutter'],
            'schule': ['schule', 'einschulung', 'grundschule', 'gymnasium', 'schüler'],
            'bauantrag': ['bauantrag', 'baugenehmigung', 'bauen', 'haus', 'wohnung'],
            'pflege': ['pflege', 'pflegegeld', 'pflegestufe', 'betreuung', 'senioren'],
            'gewerbe': ['gewerbe', 'selbstständig', 'firma', 'unternehmen', 'gründung'],
            'stellen': ['stelle', 'job', 'arbeit', 'bewerbung', 'stellenausschreibung']
        };
        
        for (const [topic, keywords] of Object.entries(topicKeywords)) {
            for (const keyword of keywords) {
                if (queryLower.includes(keyword)) {
                    return topic;
                }
            }
        }
        
        return 'default';
    }
    
    // Weitere Dialog-Funktionen (Phase 5.2)
    createJugendSolutionDialog(data) {
        return `**👶 Jugendhilfe - Unterstützung für Familien:**

Ich helfe Ihnen bei allen Fragen rund um Jugend und Familie:

**📋 Häufige Anliegen:**
• Erziehungsberatung
• Jugendhilfe
• Sorgerecht
• Unterhalt
• Betreuung

**💡 Wie kann ich helfen:**
• Beratungstermine vermitteln
• Anträge erklären
• Kontakte geben
• Prozesse erläutern

Haben Sie ein spezifisches Anliegen?`;
    }

    createStellenSolutionDialog(data) {
        return `**💼 Stellenausschreibungen - Ihre Karriere:**

Gerne helfe ich Ihnen bei der Jobsuche:

**📋 Schritt 1: Stellen finden**
• Aktuelle Ausschreibungen durchsuchen
• Filter nach Bereich/Standort
• Bewerbungsfristen beachten

**📄 Schritt 2: Bewerbung**
• Lebenslauf aktualisieren
• Anschreiben anpassen
• Zeugnisse zusammenstellen

**📅 Schritt 3: Bewerbung einreichen**
• Online-Bewerbung
• Oder per Post
• Nachfassen nach 2 Wochen

**💡 Pro-Tipps:**
• Regelmäßig nach neuen Stellen schauen
• Netzwerk nutzen
• Weiterbildungen erwähnen

Welche Art von Stelle suchen Sie?`;
    }

    createGenehmigungSolutionDialog(data) {
        return `**📋 Baugenehmigung - Der Weg zur Genehmigung:**

Eine Baugenehmigung ist der Schlüssel zum Bauen:

**📋 Schritt 1: Antrag vorbereiten**
• Bauzeichnungen
• Grundstücksnachweis
• Baubeschreibung
• Statische Berechnungen

**📄 Schritt 2: Einreichung**
• Formulare ausfüllen
• Gebühren bezahlen
• Beim Bauamt einreichen

**🔍 Schritt 3: Prüfung**
• Bauamt prüft
• Nachbarn informieren
• Öffentliche Auslegung

**✅ Schritt 4: Genehmigung**
• Baugenehmigung erhalten
• Bauen beginnen

**⏱️ Bearbeitungszeit:** 2-4 Monate

Benötigen Sie Hilfe bei der Antragstellung?`;
    }

    createBetreuungSolutionDialog(data) {
        return `**👴 Betreuung für Senioren - Unterstützung im Alltag:**

Betreuung kann das Leben erleichtern:

**📋 Betreuungsarten:**
• Tagesbetreuung
• Vollzeitbetreuung
• Ambulante Betreuung
• Stationäre Betreuung

**💰 Kosten:**
• Pflegeversicherung übernimmt Teil
• Eigenanteil je nach Einkommen
• Sozialhilfe möglich

**📅 Antragstellung:**
• Bei Pflegekasse
• Arztzeugnis erforderlich
• MDK-Begutachtung

**💡 Wichtige Hinweise:**
• Frühzeitig planen
• Verschiedene Angebote vergleichen
• Qualität prüfen

Benötigen Sie Hilfe bei der Antragstellung?`;
    }

    createSeniorenSolutionDialog(data) {
        return `**👴 Seniorenangebote - Unterstützung im Alter:**

Ich helfe Ihnen bei allen Seniorenangelegenheiten:

**📋 Angebote:**
• Pflegegeld
• Betreuung
• Wohnen im Alter
• Mobilität

**💰 Leistungen:**
• Pflegeversicherung
• Sozialhilfe
• Zuschüsse
• Steuerliche Vorteile

**📅 Anträge:**
• Bei Pflegekasse
• Beim Sozialamt
• Beim Finanzamt

**💡 Pro-Tipps:**
• Alle Leistungen prüfen
• Beratung nutzen
• Frühzeitig planen

Welches Anliegen haben Sie?`;
    }

    createUnternehmenSolutionDialog(data) {
        return `**🏢 Unternehmensangelegenheiten - Ihr Business:**

Gerne unterstütze ich Sie bei gewerblichen Fragen:

**📋 Häufige Anliegen:**
• Gewerbeanmeldung
• Steuern
• Fördermittel
• Personal

**💰 Finanzen:**
• Geschäftskonto
• Buchhaltung
• Steuerberater
• Fördermittel

**📅 Termine:**
• IHK-Termine
• Steuerberatung
• Behördenbesuche

**💡 Pro-Tipps:**
• Beratung nutzen
• Netzwerk aufbauen
• Weiterbildungen

Welches gewerbliche Anliegen haben Sie?`;
    }

    createFamilieSolutionDialog(data) {
        return `**👨‍👩‍👧‍👦 Familienangelegenheiten - Unterstützung für Sie:**

Ich helfe Ihnen bei allen Familienfragen:

**📋 Häufige Anliegen:**
• Kinderbetreuung
• Schule
• Jugendhilfe
• Sorgerecht

**💰 Unterstützung:**
• Kindergeld
• Elterngeld
• Zuschüsse
• Steuerliche Vorteile

**📅 Anträge:**
• Bei Familienkasse
• Beim Jugendamt
• Beim Finanzamt

**💡 Pro-Tipps:**
• Alle Leistungen prüfen
• Beratung nutzen
• Frühzeitig planen

Welches Familienanliegen haben Sie?`;
    }

    createDefaultSolutionDialog(data) {
        return `**📋 Bürgerdienste - Wie kann ich helfen:**

Ich unterstütze Sie gerne bei Ihrem Anliegen:

**📋 Häufige Anliegen:**
• Anträge stellen
• Dokumente beantragen
• Termine vereinbaren
• Informationen einholen

**💡 Wie kann ich helfen:**
• Prozesse erklären
• Anträge führen
• Kontakte geben
• Termine vermitteln

**📅 Nächste Schritte:**
• Antrag ausfüllen
• Dokumente zusammenstellen
• Termin vereinbaren
• Einreichen

Haben Sie ein spezifisches Anliegen?`;
    }

    createRatsinfoSolutionDialog(data) {
        return `**🏛️ Ratsinfo - Transparenz für Bürger:**

Ich informiere Sie gerne über politische Prozesse:

**📋 Informationen:**
• Sitzungstermine
• Tagesordnungen
• Beschlüsse
• Gremien

**📅 Termine:**
• Kreistagssitzungen
• Ausschusssitzungen
• Bürgerfragestunden

**💡 Transparenz:**
• Öffentliche Sitzungen
• Protokolle einsehbar
• Beschlüsse nachvollziehbar

**🤔 Haben Sie Fragen zu:**
• Einer bestimmten Sitzung?
• Einem Beschluss?
• Politischen Prozessen?`;
    }

    createStellenportalSolutionDialog(data) {
        return `**💼 Stellenportal - Ihre Karriere:**

Gerne helfe ich Ihnen bei der Jobsuche:

**📋 Stellenangebote:**
• Aktuelle Ausschreibungen
• Verschiedene Bereiche
• Vollzeit/Teilzeit
• Ausbildung/Studium

**📄 Bewerbung:**
• Lebenslauf
• Anschreiben
• Zeugnisse
• Online-Bewerbung

**📅 Prozess:**
• Bewerbung einreichen
• Vorstellungsgespräch
• Einstellung

**💡 Pro-Tipps:**
• Regelmäßig schauen
• Netzwerk nutzen
• Weiterbildungen

Welche Art von Stelle suchen Sie?`;
    }

    createKontakteSolutionDialog(data) {
        return `**📞 Kontakte - Die richtigen Ansprechpartner:**

Ich gebe Ihnen gerne die richtigen Kontakte:

**📋 Ansprechpartner:**
• Fachbereiche
• Zuständigkeiten
• Kontaktdaten
• Öffnungszeiten

**📅 Termine:**
• Sprechzeiten
• Terminvereinbarung
• Wartezeiten
• Notfälle

**💡 Service:**
• Telefonische Beratung
• Online-Services
• Vor-Ort-Termine
• E-Mail-Kontakt

**🤔 Benötigen Sie Kontakt zu:**
• Einem bestimmten Bereich?
• Einem Ansprechpartner?
• Einer Dienststelle?`;
    }

    createSozialesSolutionDialog(data) {
        return `**🤝 Soziale Angelegenheiten - Unterstützung für Sie:**

Ich helfe Ihnen bei sozialen Fragen:

**📋 Angebote:**
• Sozialhilfe
• Wohngeld
• Kindergeld
• Elterngeld

**💰 Leistungen:**
• Geldleistungen
• Sachleistungen
• Beratung
• Unterstützung

**📅 Anträge:**
• Formulare ausfüllen
• Nachweise einreichen
• Termine vereinbaren
• Bearbeitung abwarten

**💡 Wichtige Hinweise:**
• Alle Leistungen prüfen
• Beratung nutzen
• Frühzeitig beantragen

Welches soziale Anliegen haben Sie?`;
    }
    
    createBauherrenSolutionDialog(data) {
        return `**🏗️ Bauherren - Ihr Weg zum Traumhaus:**

Ich helfe Ihnen gerne beim Bauen! Hier ist Ihr kompletter Leitfaden:

**📋 Schritt 1: Grundstück prüfen**
• Bebauungsplan einsehen
• Baulastverzeichnis prüfen
• Grundstücksgrenzen klären
• Erschließung prüfen

**📅 Schritt 2: Bauantrag stellen**
• Bauzeichnungen erstellen lassen
• Statik berechnen lassen
• Antrag beim Bauamt einreichen
• Gebühren bezahlen

**⏱️ Schritt 3: Genehmigung abwarten**
• Bearbeitungszeit: 1-3 Monate
• Nachfragen beantworten
• Auflagen erfüllen
• Baugenehmigung erhalten

**✅ Schritt 4: Baubeginn**
• Baustelleneinrichtung
• Erdarbeiten
• Rohbau
• Ausbau

**💡 Wichtige Hinweise:**
• Frühzeitig planen
• Kosten kalkulieren
• Zeitpuffer einplanen
• Experten hinzuziehen

Welchen Schritt möchten Sie angehen?`;
    }
    
    findBestAgent(query) {
        const queryLower = query.toLowerCase();
        
        // Einfache Agent-Erkennung basierend auf Keywords
        if (queryLower.includes('bau') || queryLower.includes('bauantrag') || queryLower.includes('genehmigung')) {
            return 'buergerdienste';
        }
        if (queryLower.includes('ratsinfo') || queryLower.includes('kreistag') || queryLower.includes('sitzung')) {
            return 'ratsinfo';
        }
        if (queryLower.includes('stelle') || queryLower.includes('job') || queryLower.includes('bewerbung')) {
            return 'stellenportal';
        }
        if (queryLower.includes('kontakt') || queryLower.includes('ansprechpartner')) {
            return 'kontakte';
        }
        if (queryLower.includes('jugend') || queryLower.includes('familie') || queryLower.includes('kind')) {
            return 'jugend';
        }
        if (queryLower.includes('sozial') || queryLower.includes('hilfe') || queryLower.includes('unterstützung')) {
            return 'soziales';
        }
        
        return 'buergerdienste'; // Default
    }
    
    // Hauptmethode für KAYA-Antworten (Chat-Fix)
    async generateResponse(message, originalMessage) {
        try {
            // 1. Sprache erkennen
            const detectedLanguage = this.detectLanguage(message);
            const languageName = this.supportedLanguages[detectedLanguage] || 'Deutsch';
            
            // 2. Besten Agent finden
            const bestAgent = this.findBestAgent(message);
            
            // 3. Agent-Daten laden
            const agentData = this.agentHandler.getAgentData(bestAgent);
            
            // 4. Persona erkennen
            const personaScores = this.calculatePersonaScores(message);
            const bestPersona = Object.keys(personaScores).reduce((a, b) => 
                personaScores[a] > personaScores[b] ? a : b
            );
            
            // 5. Empathische Antwort generieren
            const empatheticResponse = this.createEmpatheticResponse(
                message, 
                bestAgent, 
                bestPersona, 
                agentData, 
                detectedLanguage
            );
            
            return {
                response: empatheticResponse,
                agent: bestAgent,
                persona: bestPersona,
                detectedLanguage: detectedLanguage,
                languageName: languageName,
                confidence: personaScores[bestPersona] || 0,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Fehler in generateResponse:', error);
            
            // Fallback-Antwort
            return {
                response: 'Entschuldigung, es gab einen Fehler. Bitte versuchen Sie es erneut.',
                agent: 'buergerdienste',
                persona: 'default',
                detectedLanguage: 'de',
                languageName: 'Deutsch',
                confidence: 0,
                timestamp: new Date().toISOString(),
                error: error.message
            };
        }
    }
    
    // Sprache erkennen
    detectLanguage(text) {
        const textLower = text.toLowerCase();
        let maxScore = 0;
        let detectedLang = 'de';
        
        for (const [lang, patterns] of Object.entries(this.languagePatterns)) {
            let score = 0;
            for (const pattern of patterns) {
                if (textLower.includes(pattern)) {
                    score++;
                }
            }
            if (score > maxScore) {
                maxScore = score;
                detectedLang = lang;
            }
        }
        
        return detectedLang;
    }
    
    // Empathische Antwort erstellen
    createEmpatheticResponse(message, agent, persona, data, language) {
        const greeting = this.getGreeting(language);
        
        // Einfache, menschliche Antwort basierend auf der Nachricht
        let response = this.createHumanLikeResponse(message, language);
        
        return `${greeting} ${response}`;
    }
    
    // Menschliche Antwort erstellen
    createHumanLikeResponse(message, language) {
        const messageLower = message.toLowerCase();
        
        // Antrag-spezifische Antwort
        if (messageLower.includes('antrag') || messageLower.includes('formular') || messageLower.includes('beantragen')) {
            return this.getAntragResponse(language);
        }
        
        // Kita-Anmeldung
        if (messageLower.includes('kita') || messageLower.includes('kindergarten') || messageLower.includes('betreuung')) {
            return this.getKitaResponse(language);
        }
        
        // Bauantrag
        if (messageLower.includes('bau') || messageLower.includes('bauantrag') || messageLower.includes('bauen')) {
            return this.getBauResponse(language);
        }
        
        // Jobsuche
        if (messageLower.includes('job') || messageLower.includes('stelle') || messageLower.includes('arbeit') || messageLower.includes('bewerbung')) {
            return this.getJobResponse(language);
        }
        
        // Allgemeine Hilfe
        return this.getGeneralResponse(language);
    }
    
    // Antrag-spezifische Antwort
    getAntragResponse(language) {
        const responses = {
            'de': `Ah, Sie brauchen einen Antrag! Ich helfe Ihnen gerne dabei. 

**Welche Art von Antrag benötigen Sie?**
• Bauantrag
• Kita-Anmeldung  
• Gewerbeanmeldung
• Sozialhilfe
• Wohngeld

**Der allgemeine Ablauf:**
1. Formular ausfüllen
2. Notwendige Dokumente sammeln
3. Termin vereinbaren
4. Antrag einreichen

Welchen spezifischen Antrag möchten Sie stellen? Dann kann ich Ihnen genau sagen, was Sie brauchen!`,
            
            'tr': `Ah, bir başvuru yapmanız gerekiyor! Size yardım etmekten memnuniyet duyarım.

**Hangi tür başvuruya ihtiyacınız var?**
• İnşaat başvurusu
• Kreş kaydı
• Ticaret kaydı
• Sosyal yardım
• Konut yardımı

**Genel süreç:**
1. Formu doldurun
2. Gerekli belgeleri toplayın
3. Randevu alın
4. Başvuruyu yapın

Hangi başvuruyu yapmak istiyorsunuz? Size tam olarak neye ihtiyacınız olduğunu söyleyebilirim!`,
            
            'en': `Ah, you need to submit an application! I'd be happy to help you with that.

**What type of application do you need?**
• Building permit
• Daycare registration
• Business registration
• Social assistance
• Housing benefit

**General process:**
1. Fill out the form
2. Collect required documents
3. Schedule an appointment
4. Submit the application

Which specific application would you like to make? Then I can tell you exactly what you need!`
        };
        
        return responses[language] || responses['de'];
    }
    
    // Kita-spezifische Antwort
    getKitaResponse(language) {
        const responses = {
            'de': `Ich helfe Ihnen gerne bei der Kita-Anmeldung! Das ist ein wichtiger Schritt für Ihr Kind. 

**Was Sie brauchen:**
• Geburtsurkunde des Kindes
• Nachweis über Erwerbstätigkeit oder Studium
• Wohnsitznachweis

**Der Ablauf:**
1. Online-Antrag über das Kita-Portal stellen
2. Wunsch-Kitas angeben (bis zu 3)
3. Bearbeitungszeit: 4-6 Wochen
4. Bei Zusage: Vertrag unterschreiben

Haben Sie schon eine bestimmte Kita im Blick?`,
            
            'tr': `Kreş kaydında size yardım etmekten memnuniyet duyarım! Bu çocuğunuz için önemli bir adım.

**İhtiyacınız olanlar:**
• Çocuğun doğum belgesi
• İstihdam veya öğrenim belgesi
• İkamet belgesi

**Süreç:**
1. Kreş portalı üzerinden online başvuru
2. İstediğiniz kreşleri belirtin (en fazla 3)
3. İşlem süresi: 4-6 hafta
4. Kabul durumunda: Sözleşme imzalayın

Zaten gözünüzde bir kreş var mı?`,
            
            'en': `I'd be happy to help you with daycare registration! This is an important step for your child.

**What you need:**
• Child's birth certificate
• Proof of employment or studies
• Proof of residence

**The process:**
1. Submit online application via daycare portal
2. Specify preferred daycares (up to 3)
3. Processing time: 4-6 weeks
4. If accepted: Sign contract

Do you already have a specific daycare in mind?`
        };
        
        return responses[language] || responses['de'];
    }
    
    // Bau-spezifische Antwort
    getBauResponse(language) {
        const responses = {
            'de': `Ah, Sie möchten bauen! Das ist aufregend. Ich begleite Sie gerne durch den Prozess.

**Erste Schritte:**
• Bebauungsplan einsehen
• Grundstücksgrenzen klären
• Bauzeichnungen erstellen lassen
• Antrag beim Bauamt einreichen

**Wichtige Hinweise:**
• Bearbeitungszeit: 1-3 Monate
• Kosten kalkulieren
• Zeitpuffer einplanen

Wo möchten Sie bauen?`,
            
            'tr': `Ah, inşaat yapmak istiyorsunuz! Bu heyecan verici. Süreçte size eşlik etmekten memnuniyet duyarım.

**İlk adımlar:**
• İmar planını inceleyin
• Parsel sınırlarını netleştirin
• İnşaat çizimlerini yaptırın
• İnşaat dairesine başvuru yapın

**Önemli notlar:**
• İşlem süresi: 1-3 ay
• Maliyetleri hesaplayın
• Zaman payı bırakın

Nerede inşaat yapmak istiyorsunuz?`,
            
            'en': `Ah, you want to build! That's exciting. I'd be happy to guide you through the process.

**First steps:**
• Check zoning plan
• Clarify property boundaries
• Have building plans created
• Submit application to building authority

**Important notes:**
• Processing time: 1-3 months
• Calculate costs
• Plan time buffer

Where would you like to build?`
        };
        
        return responses[language] || responses['de'];
    }
    
    // Job-spezifische Antwort
    getJobResponse(language) {
        const responses = {
            'de': `Ich helfe Ihnen gerne bei der Jobsuche! Es gibt viele Möglichkeiten im Landkreis Oldenburg.

**Wo Sie suchen können:**
• Stellenportal des Landkreises
• Öffentliche Stellenausschreibungen
• Verwaltungspositionen
• Soziale Einrichtungen

**Tipps für Ihre Bewerbung:**
• Anschreiben individuell gestalten
• Lebenslauf aktuell halten
• Zeugnisse bereithalten
• Nachfragen bei Interesse

Welche Art von Stelle suchen Sie?`,
            
            'tr': `İş aramada size yardım etmekten memnuniyet duyarım! Oldenburg bölgesinde birçok fırsat var.

**Nerede arayabilirsiniz:**
• Bölge iş portalı
• Kamu iş ilanları
• Yönetim pozisyonları
• Sosyal kurumlar

**Başvuru ipuçları:**
• Başvuru mektubunu kişiselleştirin
• CV'nizi güncel tutun
• Sertifikaları hazır bulundurun
• İlgilendiğinizde soru sorun

Hangi tür iş arıyorsunuz?`,
            
            'en': `I'd be happy to help you with your job search! There are many opportunities in the Oldenburg district.

**Where you can search:**
• District job portal
• Public job postings
• Administrative positions
• Social institutions

**Application tips:**
• Personalize cover letter
• Keep CV current
• Have certificates ready
• Ask questions when interested

What type of position are you looking for?`
        };
        
        return responses[language] || responses['de'];
    }
    
    // Allgemeine Antwort
    getGeneralResponse(language) {
        const responses = {
            'de': `Ich bin hier, um Ihnen zu helfen! Als kommunaler Assistent kenne ich mich mit allen Anliegen im Landkreis Oldenburg aus.

**Ich kann Ihnen helfen bei:**
• Anträgen und Formularen
• Terminvereinbarungen
• Kontakten zu den richtigen Ansprechpartnern
• Informationen zu Dienstleistungen

Was genau brauchen Sie? Erzählen Sie mir einfach, womit ich Ihnen helfen kann!`,
            
            'tr': `Size yardım etmek için buradayım! Belediye asistanı olarak Oldenburg bölgesindeki tüm konularda bilgiliyim.

**Size yardım edebileceğim konular:**
• Başvurular ve formlar
• Randevu ayarlama
• Doğru kişilerle iletişim
• Hizmetler hakkında bilgi

Tam olarak neye ihtiyacınız var? Size nasıl yardım edebileceğimi söyleyin!`,
            
            'en': `I'm here to help you! As a municipal assistant, I'm familiar with all matters in the Oldenburg district.

**I can help you with:**
• Applications and forms
• Appointment scheduling
• Contacts to the right people
• Information about services

What exactly do you need? Just tell me how I can help you!`
        };
        
        return responses[language] || responses['de'];
    }
    
    // Begrüßung je nach Sprache
    getGreeting(language) {
        const greetings = {
            'de': 'Moin!',
            'en': 'Hello!',
            'tr': 'Merhaba!',
            'ar': 'مرحبا!',
            'fr': 'Bonjour!',
            'es': '¡Hola!',
            'ru': 'Привет!',
            'pl': 'Cześć!'
        };
        return greetings[language] || greetings['de'];
    }
}

module.exports = KAYACharacterHandler;
