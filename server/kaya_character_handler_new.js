const KAYAAgentHandler = require('./kaya_agent_handler');

class KAYACharacterHandler {
    constructor() {
        this.agentHandler = new KAYAAgentHandler();
        this.conversationMemory = new Map(); // Kontext-Gedächtnis für jeden User
        
        // Multi-Language Support
        this.supportedLanguages = {
            'de': 'Deutsch',
            'en': 'English', 
            'tr': 'Türkçe',
            'ar': 'العربية',
            'fr': 'Français',
            'es': 'Español',
            'ru': 'Русский',
            'pl': 'Polski'
        };
        
        // Language Detection Patterns
        this.languagePatterns = {
            'en': ['hello', 'hi', 'help', 'need', 'want', 'how', 'what', 'where', 'when', 'why', 'can', 'could', 'would', 'should', 'please', 'thank', 'thanks', 'sorry', 'excuse'],
            'tr': ['merhaba', 'selam', 'yardim', 'ihtiyac', 'istiyorum', 'nasil', 'ne', 'nerede', 'ne zaman', 'neden', 'lutfen', 'tesekkur', 'ozur', 'afedersiniz'],
            'ar': ['marhaba', 'ahlan', 'musaada', 'haja', 'urid', 'kayf', 'matha', 'ayn', 'mata', 'limatha', 'min fadlik', 'shukran', 'asif'],
            'fr': ['bonjour', 'salut', 'aide', 'besoin', 'vouloir', 'comment', 'quoi', 'ou', 'quand', 'pourquoi', 'sil vous plait', 'merci', 'desole'],
            'es': ['hola', 'ayuda', 'necesito', 'quiero', 'como', 'que', 'donde', 'cuando', 'por que', 'por favor', 'gracias', 'lo siento'],
            'ru': ['privet', 'pomoshch', 'nuzhno', 'khochu', 'kak', 'chto', 'gde', 'kogda', 'pochemu', 'pozhaluysta', 'spasibo', 'izvinite'],
            'pl': ['czesc', 'pomoc', 'potrzebuje', 'chce', 'jak', 'co', 'gdzie', 'kiedy', 'dlaczego', 'prosze', 'dziekuje', 'przepraszam']
        };
    }
    
    // Hauptmethode für KAYA-Antworten mit Kontext-Gedächtnis
    async generateResponse(message, originalMessage, userId = 'default') {
        try {
            // 1. Kontext laden oder erstellen
            const context = this.getOrCreateContext(userId);
            
            // 2. Sprache erkennen
            const detectedLanguage = this.detectLanguage(message);
            const languageName = this.supportedLanguages[detectedLanguage] || 'Deutsch';
            
            // 3. Kontext erweitern
            context.lastMessage = message;
            context.detectedLanguage = detectedLanguage;
            context.conversationHistory.push({
                message: message,
                timestamp: new Date().toISOString(),
                language: detectedLanguage
            });
            
            // 4. Intelligentes Funneling - aus unvollständigen Anfragen schlau werden
            const enhancedQuery = this.enhanceQueryWithContext(message, context);
            
            // 5. Besten Agent finden
            const bestAgent = this.findBestAgent(enhancedQuery);
            
            // 6. Agent-Daten laden
            const agentData = this.agentHandler.getAgentData(bestAgent);
            
            // 7. Persona erkennen
            const personaScores = this.calculatePersonaScores(enhancedQuery);
            const bestPersona = Object.keys(personaScores).reduce((a, b) => 
                personaScores[a] > personaScores[b] ? a : b
            );
            
            // 8. Menschliche Antwort mit Kontext generieren
            const empatheticResponse = this.createContextualResponse(
                message, 
                enhancedQuery,
                bestAgent, 
                bestPersona, 
                agentData, 
                detectedLanguage,
                context
            );
            
            // 9. Kontext speichern
            context.lastAgent = bestAgent;
            context.lastPersona = bestPersona;
            context.lastResponse = empatheticResponse;
            this.conversationMemory.set(userId, context);
            
            return {
                response: empatheticResponse,
                agent: bestAgent,
                persona: bestPersona,
                detectedLanguage: detectedLanguage,
                languageName: languageName,
                confidence: personaScores[bestPersona] || 0,
                timestamp: new Date().toISOString(),
                context: {
                    hasContext: context.conversationHistory.length > 1,
                    lastTopic: context.lastTopic,
                    location: context.location
                }
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
    
    // Kontext laden oder erstellen
    getOrCreateContext(userId) {
        if (!this.conversationMemory.has(userId)) {
            this.conversationMemory.set(userId, {
                conversationHistory: [],
                lastAgent: null,
                lastPersona: null,
                lastTopic: null,
                location: null,
                lastMessage: null,
                detectedLanguage: 'de',
                lastResponse: null
            });
        }
        return this.conversationMemory.get(userId);
    }
    
    // Intelligentes Funneling - aus unvollständigen Anfragen schlau werden
    enhanceQueryWithContext(message, context) {
        const messageLower = message.toLowerCase();
        let enhancedQuery = message;
        
        // 1. Ort-Erkennung
        if (messageLower.includes('wildeshausen') || messageLower.includes('wildeshausen')) {
            context.location = 'Wildeshausen';
            enhancedQuery += ' wildeshausen';
        }
        
        // 2. Kontext aus vorherigen Nachrichten
        if (context.conversationHistory.length > 0) {
            const lastMessage = context.conversationHistory[context.conversationHistory.length - 1].message;
            
            // Wenn jemand "Kita Antrag" sagt und dann "in Wildeshausen", dann ist es ein Kita-Antrag
            if (lastMessage.toLowerCase().includes('kita') && messageLower.includes('wildeshausen')) {
                enhancedQuery = 'kita anmeldung wildeshausen';
                context.lastTopic = 'kita';
            }
            
            // Wenn jemand "Bauantrag mit link" sagt, dann ist es ein Bauantrag
            if (messageLower.includes('bauantrag') && messageLower.includes('link')) {
                enhancedQuery = 'bauantrag formular link';
                context.lastTopic = 'bauantrag';
            }
        }
        
        // 3. Unvollständige Anfragen vervollständigen
        if (messageLower.includes('antrag') && !messageLower.includes('bau') && !messageLower.includes('kita')) {
            // Wenn jemand nur "Antrag" sagt, nach dem Kontext fragen
            if (context.lastTopic) {
                enhancedQuery = `${context.lastTopic} antrag`;
            }
        }
        
        return enhancedQuery;
    }
    
    // Kontextuelle Antwort erstellen
    createContextualResponse(message, enhancedQuery, agent, persona, data, language, context) {
        const greeting = this.getGreeting(language);
        
        // 1. Kontext-basierte Antwort
        if (context.hasContext && context.lastTopic) {
            return this.createContextualTopicResponse(context.lastTopic, context.location, language, data);
        }
        
        // 2. Spezifische Antwort basierend auf enhancedQuery
        const specificResponse = this.createSpecificResponse(enhancedQuery, language, data);
        
        // 3. Mit Links erweitern
        const responseWithLinks = this.addRelevantLinks(specificResponse, enhancedQuery, data);
        
        return `${greeting} ${responseWithLinks}`;
    }
    
    // Kontextuelle Themen-Antwort
    createContextualTopicResponse(topic, location, language, data) {
        const responses = {
            'kita': {
                'de': `Ah, Sie möchten eine Kita-Anmeldung${location ? ` in ${location}` : ''}! Das ist ein wichtiger Schritt für Ihr Kind.

**Was Sie brauchen:**
• Geburtsurkunde des Kindes
• Nachweis über Erwerbstätigkeit oder Studium
• Wohnsitznachweis

**Der Ablauf:**
1. Online-Antrag über das Kita-Portal stellen
2. Wunsch-Kitas angeben (bis zu 3)
3. Bearbeitungszeit: 4-6 Wochen
4. Bei Zusage: Vertrag unterschreiben

**Für ${location || 'den Landkreis Oldenburg'}:**
• Kita-Portal: https://kita-portal.landkreis-oldenburg.de
• Kontakt: 04431-85-0
• Öffnungszeiten: Mo-Fr 8:00-16:00

Haben Sie schon eine bestimmte Kita im Blick? Ich kann Ihnen auch bei der Auswahl helfen!`,
                
                'tr': `Ah, ${location ? `${location}'da` : 'Landkreis Oldenburg'da} kreş kaydı yapmak istiyorsunuz! Bu çocuğunuz için önemli bir adım.

**İhtiyacınız olanlar:**
• Çocuğun doğum belgesi
• İstihdam veya öğrenim belgesi
• İkamet belgesi

**Süreç:**
1. Kreş portalı üzerinden online başvuru
2. İstediğiniz kreşleri belirtin (en fazla 3)
3. İşlem süresi: 4-6 hafta
4. Kabul durumunda: Sözleşme imzalayın

**${location || 'Landkreis Oldenburg'} için:**
• Kreş Portalı: https://kita-portal.landkreis-oldenburg.de
• İletişim: 04431-85-0
• Çalışma saatleri: Pzt-Cum 8:00-16:00

Zaten gözünüzde bir kreş var mı?`,
                
                'en': `Ah, you want to register for daycare${location ? ` in ${location}` : ''}! This is an important step for your child.

**What you need:**
• Child's birth certificate
• Proof of employment or studies
• Proof of residence

**The process:**
1. Submit online application via daycare portal
2. Specify preferred daycares (up to 3)
3. Processing time: 4-6 weeks
4. If accepted: Sign contract

**For ${location || 'Landkreis Oldenburg'}:**
• Daycare Portal: https://kita-portal.landkreis-oldenburg.de
• Contact: 04431-85-0
• Opening hours: Mon-Fri 8:00-16:00

Do you already have a specific daycare in mind?`
            },
            
            'bauantrag': {
                'de': `Ah, Sie möchten einen Bauantrag stellen${location ? ` in ${location}` : ''}! Das ist aufregend. Ich begleite Sie gerne durch den Prozess.

**Erste Schritte:**
• Bebauungsplan einsehen
• Grundstücksgrenzen klären
• Bauzeichnungen erstellen lassen
• Antrag beim Bauamt einreichen

**Wichtige Hinweise:**
• Bearbeitungszeit: 1-3 Monate
• Kosten kalkulieren
• Zeitpuffer einplanen

**Formulare und Links:**
• Bauantrag-Formular: https://bauamt.landkreis-oldenburg.de/formulare
• Bebauungsplan: https://bebauungsplan.landkreis-oldenburg.de
• Kontakt Bauamt: 04431-85-200

Wo möchten Sie bauen? Ich kann Ihnen auch bei der Grundstückssuche helfen!`,
                
                'tr': `Ah, ${location ? `${location}'da` : 'Landkreis Oldenburg'da} inşaat başvurusu yapmak istiyorsunuz! Bu heyecan verici. Süreçte size eşlik etmekten memnuniyet duyarım.

**İlk adımlar:**
• İmar planını inceleyin
• Parsel sınırlarını netleştirin
• İnşaat çizimlerini yaptırın
• İnşaat dairesine başvuru yapın

**Önemli notlar:**
• İşlem süresi: 1-3 ay
• Maliyetleri hesaplayın
• Zaman payı bırakın

**Formlar ve Linkler:**
• İnşaat Başvuru Formu: https://bauamt.landkreis-oldenburg.de/formulare
• İmar Planı: https://bebauungsplan.landkreis-oldenburg.de
• İnşaat Dairesi İletişim: 04431-85-200

Nerede inşaat yapmak istiyorsunuz?`,
                
                'en': `Ah, you want to submit a building permit${location ? ` in ${location}` : ''}! That's exciting. I'd be happy to guide you through the process.

**First steps:**
• Check zoning plan
• Clarify property boundaries
• Have building plans created
• Submit application to building authority

**Important notes:**
• Processing time: 1-3 months
• Calculate costs
• Plan time buffer

**Forms and Links:**
• Building Permit Form: https://bauamt.landkreis-oldenburg.de/formulare
• Zoning Plan: https://bebauungsplan.landkreis-oldenburg.de
• Building Authority Contact: 04431-85-200

Where would you like to build?`
            }
        };
        
        return responses[topic]?.[language] || responses[topic]?.['de'] || this.getGeneralResponse(language);
    }
    
    // Spezifische Antwort erstellen
    createSpecificResponse(query, language, data) {
        const queryLower = query.toLowerCase();
        
        // Antrag-spezifische Antwort
        if (queryLower.includes('antrag') || queryLower.includes('formular') || queryLower.includes('beantragen')) {
            return this.getAntragResponse(language);
        }
        
        // Kita-Anmeldung
        if (queryLower.includes('kita') || queryLower.includes('kindergarten') || queryLower.includes('betreuung')) {
            return this.getKitaResponse(language);
        }
        
        // Bauantrag
        if (queryLower.includes('bau') || queryLower.includes('bauantrag') || queryLower.includes('bauen')) {
            return this.getBauResponse(language);
        }
        
        // Jobsuche
        if (queryLower.includes('job') || queryLower.includes('stelle') || queryLower.includes('arbeit') || queryLower.includes('bewerbung')) {
            return this.getJobResponse(language);
        }
        
        // Allgemeine Hilfe
        return this.getGeneralResponse(language);
    }
    
    // Relevante Links hinzufügen
    addRelevantLinks(response, query, data) {
        const queryLower = query.toLowerCase();
        
        // Links für verschiedene Themen
        if (queryLower.includes('bauantrag') || queryLower.includes('bau')) {
            response += `\n\n**📋 Wichtige Links:**
• Bauantrag-Formular: https://bauamt.landkreis-oldenburg.de/formulare
• Bebauungsplan: https://bebauungsplan.landkreis-oldenburg.de
• Kontakt Bauamt: 04431-85-200`;
        }
        
        if (queryLower.includes('kita') || queryLower.includes('kindergarten')) {
            response += `\n\n**📋 Wichtige Links:**
• Kita-Portal: https://kita-portal.landkreis-oldenburg.de
• Kontakt: 04431-85-0
• Öffnungszeiten: Mo-Fr 8:00-16:00`;
        }
        
        if (queryLower.includes('job') || queryLower.includes('stelle')) {
            response += `\n\n**📋 Wichtige Links:**
• Stellenportal: https://stellenportal.landkreis-oldenburg.de
• Kontakt Personal: 04431-85-100`;
        }
        
        return response;
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
            'tr': 'Merhaba!',
            'en': 'Hello!',
            'ar': 'مرحبا!',
            'fr': 'Bonjour!',
            'es': '¡Hola!',
            'ru': 'Привет!',
            'pl': 'Cześć!'
        };
        
        return greetings[language] || greetings['de'];
    }
    
    // Sprache erkennen
    detectLanguage(text) {
        const textLower = text.toLowerCase();
        let detectedLang = 'de'; // Default
        let maxScore = 0;
        
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
    
    // Besten Agent finden
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
    
    // Persona-Scores berechnen
    calculatePersonaScores(query) {
        const queryLower = query.toLowerCase();
        const scores = {
            'familie': 0,
            'unternehmen': 0,
            'senioren': 0,
            'bauherren': 0,
            'allgemein': 1
        };
        
        // Familie-Keywords
        if (queryLower.includes('kind') || queryLower.includes('kita') || queryLower.includes('familie') || 
            queryLower.includes('eltern') || queryLower.includes('betreuung') || queryLower.includes('jugend')) {
            scores.familie += 3;
        }
        
        // Unternehmen-Keywords
        if (queryLower.includes('gewerbe') || queryLower.includes('firma') || queryLower.includes('unternehmen') || 
            queryLower.includes('bewerbung') || queryLower.includes('stellen') || queryLower.includes('arbeit')) {
            scores.unternehmen += 3;
        }
        
        // Senioren-Keywords
        if (queryLower.includes('pflege') || queryLower.includes('senioren') || queryLower.includes('alt') || 
            queryLower.includes('hilfe') || queryLower.includes('betreuung') || queryLower.includes('rente')) {
            scores.senioren += 3;
        }
        
        // Bauherren-Keywords
        if (queryLower.includes('bau') || queryLower.includes('bauantrag') || queryLower.includes('bauen') || 
            queryLower.includes('grundstück') || queryLower.includes('haus') || queryLower.includes('wohnung')) {
            scores.bauherren += 3;
        }
        
        return scores;
    }
}

module.exports = KAYACharacterHandler;
