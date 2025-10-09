class AdvancedPersonaDetection {
    constructor() {
        this.personas = {
            'first_time_visitor': {
                name: 'Erstbesucher',
                characteristics: ['unsicher', 'viele fragen', 'braucht orientierung'],
                approach: 'sehr geduldig, erklärend, strukturiert',
                questions: ['Ist das Ihr erster Besuch bei uns?', 'Kann ich Ihnen den Ablauf erklären?']
            },
            'regular_customer': {
                name: 'Stammkunde',
                characteristics: ['kennt abläufe', 'direkt', 'effizient'],
                approach: 'schnell, zielgerichtet, weniger erklärungen',
                questions: ['Wie gewohnt?', 'Haben Sie alle Unterlagen dabei?']
            },
            'confused_citizen': {
                name: 'Verwirrter Bürger',
                characteristics: ['verwirrt', 'unsicher', 'braucht hilfe'],
                approach: 'sehr geduldig, schritt-für-schritt, bestätigungen',
                questions: ['Verstehe ich Sie richtig?', 'Soll ich das nochmal erklären?']
            },
            'urgent_case': {
                name: 'Eilfall',
                characteristics: ['eilig', 'dringend', 'stress'],
                approach: 'schnell, priorisiert, lösungsorientiert',
                questions: ['Wie dringend ist das?', 'Bis wann brauchen Sie das?']
            },
            'elderly_citizen': {
                name: 'Älterer Bürger',
                characteristics: ['langsam', 'vorsichtig', 'braucht zeit'],
                approach: 'langsam, deutlich, wiederholungen',
                questions: ['Haben Sie genug Zeit?', 'Soll ich das nochmal wiederholen?']
            },
            'young_family': {
                name: 'Junge Familie',
                characteristics: ['kinder', 'terminprobleme', 'flexibel'],
                approach: 'familienfreundlich, terminflexibel, praktisch',
                questions: ['Wie ist es mit den Kindern?', 'Welche Termine passen Ihnen?']
            },
            'business_owner': {
                name: 'Geschäftsinhaber',
                characteristics: ['geschäftlich', 'effizient', 'kostenbewusst'],
                approach: 'professionell, kostentransparent, zeiteffizient',
                questions: ['Für Ihr Unternehmen?', 'Welche Kosten entstehen?']
            },
            'farmer': {
                name: 'Landwirt/Bauer',
                characteristics: ['landwirtschaft', 'tiere', 'eu-anträge', 'agrar'],
                approach: 'praktisch, landwirtschaftsbezogen, saisonal',
                questions: ['Für Ihren Hof?', 'Welche Tiere halten Sie?', 'EU-Anträge?']
            },
            'craftsman': {
                name: 'Handwerker',
                characteristics: ['handwerk', 'meister', 'kammer', 'ausbildung'],
                approach: 'handwerksbezogen, praktisch, kammerorientiert',
                questions: ['Welches Handwerk?', 'Meisterprüfung?', 'Handwerkskammer?']
            },
            'student': {
                name: 'Studierende',
                characteristics: ['studium', 'bafög', 'wohnheim', 'semester'],
                approach: 'studentenfreundlich, bafög-orientiert, flexibel',
                questions: ['Welche Hochschule?', 'BAföG-Antrag?', 'Wohnheimplatz?']
            },
            'unemployed': {
                name: 'Arbeitslose',
                characteristics: ['arbeitssuchend', 'alg', 'jobcenter', 'weiterbildung'],
                approach: 'unterstützend, jobcenter-orientiert, motivierend',
                questions: ['Jobcenter-Kontakt?', 'ALG-Antrag?', 'Weiterbildung?']
            },
            'pensioner': {
                name: 'Rentner',
                characteristics: ['rente', 'pension', 'senioren', 'pflege'],
                approach: 'seniorenfreundlich, rentenorientiert, geduldig',
                questions: ['Rentenantrag?', 'Pflegebedarf?', 'Seniorenservices?']
            },
            'single_parent': {
                name: 'Alleinerziehende',
                characteristics: ['alleinerziehend', 'kindergeld', 'unterhalt', 'betreuung'],
                approach: 'familienunterstützend, kindergeld-orientiert, flexibel',
                questions: ['Kindergeld-Antrag?', 'Unterhaltsvorschuss?', 'Betreuung?']
            },
            'disabled_person': {
                name: 'Behinderte Person',
                characteristics: ['behinderung', 'schwerbehindertenausweis', 'eingliederungshilfe'],
                approach: 'barrierefrei, unterstützend, inklusiv',
                questions: ['Schwerbehindertenausweis?', 'Eingliederungshilfe?', 'Barrierefreiheit?']
            },
            'refugee': {
                name: 'Geflüchtete',
                characteristics: ['asyl', 'flüchtling', 'integration', 'sprachkurs'],
                approach: 'integrationsunterstützend, mehrsprachig, geduldig',
                questions: ['Asylverfahren?', 'Sprachkurs?', 'Integration?']
            },
            'eu_citizen': {
                name: 'EU-Bürger',
                characteristics: ['eu', 'aufenthaltsrecht', 'freizügigkeit', 'arbeit'],
                approach: 'eu-rechtlich, aufenthaltsorientiert, integrationsunterstützend',
                questions: ['Aufenthaltsrecht?', 'Arbeitserlaubnis?', 'Familiennachzug?']
            },
            'small_business': {
                name: 'Kleinunternehmer',
                characteristics: ['kleinunternehmer', 'steuern', 'gewerbe', 'buchhaltung'],
                approach: 'steuerorientiert, gewerblich, buchhalterisch',
                questions: ['Kleinunternehmerregelung?', 'Gewerbesteuer?', 'Buchhaltung?']
            }
        };
        
        this.emotionalStates = {
            'frustrated': {
                name: 'Frustriert',
                indicators: ['ärgerlich', 'genervt', 'verärgert', 'wütend'],
                response: 'Verständnis zeigen, Lösungen anbieten, Entschuldigungen',
                tone: 'entschuldigend, verständnisvoll'
            },
            'confused': {
                name: 'Verwirrt',
                indicators: ['verstehe nicht', 'unsicher', 'ratlos', 'verwirrt'],
                response: 'Erklären, strukturieren, bestätigen',
                tone: 'geduldig, erklärend'
            },
            'anxious': {
                name: 'Ängstlich',
                indicators: ['sorge', 'angst', 'unsicher', 'bedenken'],
                response: 'Beruhigen, Sicherheit geben, Schritt-für-Schritt',
                tone: 'beruhigend, sicher'
            },
            'happy': {
                name: 'Zufrieden',
                indicators: ['freut', 'danke', 'super', 'toll'],
                response: 'Mitfreuen, positive Verstärkung',
                tone: 'freundlich, positiv'
            },
            'neutral': {
                name: 'Neutral',
                indicators: ['normal', 'standard', 'gewöhnlich'],
                response: 'Professionell, effizient',
                tone: 'freundlich, professionell'
            }
        };
        
        this.urgencyLevels = {
            'low': {
                name: 'Niedrig',
                indicators: ['später', 'irgendwann', 'keine eile'],
                response: 'Normaler Ablauf, Termine anbieten',
                priority: 1
            },
            'normal': {
                name: 'Normal',
                indicators: ['normal', 'standard', 'gewöhnlich'],
                response: 'Standard-Ablauf',
                priority: 2
            },
            'high': {
                name: 'Hoch',
                indicators: ['eilig', 'dringend', 'schnell', 'heute'],
                response: 'Priorität, schnelle Bearbeitung',
                priority: 3
            },
            'critical': {
                name: 'Kritisch',
                indicators: ['sofort', 'notfall', 'heute noch', 'frist'],
                response: 'Sofortige Bearbeitung, Notfall-Prozedur',
                priority: 4
            }
        };
    }
    
    // Hauptpersona-Detection
    detectPersona(messages, context) {
        const scores = {};
        
        // Analysiere alle Nachrichten
        for (const message of messages) {
            const text = message.content.toLowerCase();
            const sender = message.sender;
            
            // Erstbesucher-Indikatoren
            if (this.containsKeywords(text, ['erste mal', 'ersten besuch', 'wie funktioniert', 'was muss ich'])) {
                scores.first_time_visitor = (scores.first_time_visitor || 0) + 2;
            }
            
            // Stammkunde-Indikatoren
            if (this.containsKeywords(text, ['wie immer', 'wie gewohnt', 'letztes mal', 'schon gemacht'])) {
                scores.regular_customer = (scores.regular_customer || 0) + 2;
            }
            
            // Verwirrter Bürger-Indikatoren
            if (this.containsKeywords(text, ['verstehe nicht', 'verwirrt', 'unsicher', 'ratlos'])) {
                scores.confused_citizen = (scores.confused_citizen || 0) + 3;
            }
            
            // Eilfall-Indikatoren
            if (this.containsKeywords(text, ['eilig', 'dringend', 'schnell', 'heute noch'])) {
                scores.urgent_case = (scores.urgent_case || 0) + 3;
            }
            
            // Älterer Bürger-Indikatoren
            if (this.containsKeywords(text, ['langsam', 'zeit', 'wiederholen', 'deutlich'])) {
                scores.elderly_citizen = (scores.elderly_citizen || 0) + 2;
            }
            
            // Junge Familie-Indikatoren
            if (this.containsKeywords(text, ['kind', 'kinder', 'familie', 'betreuung', 'kita'])) {
                scores.young_family = (scores.young_family || 0) + 2;
            }
            
            // Geschäftsinhaber-Indikatoren
            if (this.containsKeywords(text, ['geschäft', 'unternehmen', 'selbständig', 'gewerbe', 'firma'])) {
                scores.business_owner = (scores.business_owner || 0) + 2;
            }
        }
        
        // Context-basierte Anpassungen
        if (context.emotionalState === 'confused') {
            scores.confused_citizen = (scores.confused_citizen || 0) + 1;
        }
        
        if (context.urgency === 'high') {
            scores.urgent_case = (scores.urgent_case || 0) + 1;
        }
        
        // Bestimme Hauptpersona
        const mainPersona = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b, 'first_time_visitor');
        
        return {
            persona: mainPersona,
            confidence: scores[mainPersona] || 0,
            allScores: scores,
            details: this.personas[mainPersona]
        };
    }
    
    // Emotionale Zustände erkennen
    detectEmotionalState(messages) {
        const scores = {};
        
        for (const message of messages) {
            const text = message.content.toLowerCase();
            
            for (const [state, data] of Object.entries(this.emotionalStates)) {
                if (this.containsKeywords(text, data.indicators)) {
                    scores[state] = (scores[state] || 0) + 1;
                }
            }
        }
        
        const mainState = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b, 'neutral');
        
        return {
            state: mainState,
            confidence: scores[mainState] || 0,
            allScores: scores,
            details: this.emotionalStates[mainState]
        };
    }
    
    // Dringlichkeit erkennen
    detectUrgency(messages) {
        const scores = {};
        
        for (const message of messages) {
            const text = message.content.toLowerCase();
            
            for (const [level, data] of Object.entries(this.urgencyLevels)) {
                if (this.containsKeywords(text, data.indicators)) {
                    scores[level] = (scores[level] || 0) + 1;
                }
            }
        }
        
        const mainUrgency = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b, 'normal');
        
        return {
            level: mainUrgency,
            confidence: scores[mainUrgency] || 0,
            allScores: scores,
            details: this.urgencyLevels[mainUrgency]
        };
    }
    
    // Keywords in Text finden
    containsKeywords(text, keywords) {
        return keywords.some(keyword => text.includes(keyword));
    }
    
    // Proaktive Fragen basierend auf Persona generieren
    generateProactiveQuestions(persona, context) {
        const questions = [];
        
        switch (persona.persona) {
            case 'first_time_visitor':
                questions.push('Ist das Ihr erster Besuch bei uns?');
                questions.push('Kann ich Ihnen den Ablauf erklären?');
                questions.push('Haben Sie alle notwendigen Unterlagen dabei?');
                break;
                
            case 'confused_citizen':
                questions.push('Verstehe ich Sie richtig?');
                questions.push('Soll ich das nochmal Schritt für Schritt erklären?');
                questions.push('Haben Sie noch Fragen dazu?');
                break;
                
            case 'urgent_case':
                questions.push('Wie dringend ist das?');
                questions.push('Bis wann brauchen Sie das?');
                questions.push('Kann ich Ihnen einen Express-Termin anbieten?');
                break;
                
            case 'elderly_citizen':
                questions.push('Haben Sie genug Zeit?');
                questions.push('Soll ich das nochmal wiederholen?');
                questions.push('Brauchen Sie Hilfe beim Ausfüllen?');
                break;
                
            case 'young_family':
                questions.push('Wie ist es mit der Kinderbetreuung?');
                questions.push('Welche Termine passen Ihnen?');
                questions.push('Brauchen Sie familienfreundliche Öffnungszeiten?');
                break;
                
            case 'business_owner':
                questions.push('Ist das für Ihr Unternehmen?');
                questions.push('Welche Kosten entstehen?');
                questions.push('Brauchen Sie eine Rechnung?');
                break;
        }
        
        return questions;
    }
    
    // Antwort-Strategie basierend auf Persona
    getResponseStrategy(persona, emotionalState, urgency) {
        const strategy = {
            tone: 'freundlich',
            approach: 'standard',
            questions: [],
            priority: 'normal',
            specialConsiderations: []
        };
        
        // Persona-basierte Anpassungen
        if (persona.persona === 'confused_citizen') {
            strategy.tone = 'geduldig';
            strategy.approach = 'erklärend';
            strategy.specialConsiderations.push('Schritt-für-Schritt Erklärung');
        }
        
        if (persona.persona === 'urgent_case') {
            strategy.tone = 'effizient';
            strategy.approach = 'lösungsorientiert';
            strategy.priority = 'high';
            strategy.specialConsiderations.push('Schnelle Bearbeitung');
        }
        
        if (persona.persona === 'elderly_citizen') {
            strategy.tone = 'geduldig';
            strategy.approach = 'langsam';
            strategy.specialConsiderations.push('Wiederholungen');
        }
        
        // Emotional State Anpassungen
        if (emotionalState.state === 'frustrated') {
            strategy.tone = 'entschuldigend';
            strategy.specialConsiderations.push('Verständnis zeigen');
        }
        
        if (emotionalState.state === 'anxious') {
            strategy.tone = 'beruhigend';
            strategy.specialConsiderations.push('Sicherheit geben');
        }
        
        // Urgency Anpassungen
        if (urgency.level === 'high' || urgency.level === 'critical') {
            strategy.priority = 'high';
            strategy.specialConsiderations.push('Priorität');
        }
        
        return strategy;
    }
    
    // Vollständige Persona-Analyse
    analyzePersona(messages, context) {
        const persona = this.detectPersona(messages, context);
        const emotionalState = this.detectEmotionalState(messages);
        const urgency = this.detectUrgency(messages);
        const strategy = this.getResponseStrategy(persona, emotionalState, urgency);
        
        return {
            persona,
            emotionalState,
            urgency,
            strategy,
            proactiveQuestions: this.generateProactiveQuestions(persona, context),
            timestamp: new Date()
        };
    }
}

module.exports = AdvancedPersonaDetection;


