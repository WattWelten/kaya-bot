const fs = require('fs');
const path = require('path');

/**
 * Link-Selector-Service
 * Wählt die besten Links für eine Intention+Query basierend auf Link-Datenbank
 */

class LinkSelector {
    constructor() {
        this.linkDatabase = null;
        this.loadDatabase();
    }
    
    loadDatabase() {
        try {
            const dbPath = path.join(__dirname, '..', 'link_database.json');
            const data = fs.readFileSync(dbPath, 'utf8');
            this.linkDatabase = JSON.parse(data);
            console.log('✅ Link-Datenbank geladen');
        } catch (error) {
            console.error('⚠️ Keine Link-Datenbank gefunden, nutze Fallback');
            this.linkDatabase = {};
        }
    }
    
    /**
     * Wählt die besten Links für eine Intention
     * 
     * @param {string} intention - Die erkannte Intention (z.B. 'kfz', 'bau')
     * @param {string} query - Die User-Query für Keyword-Matching
     * @returns {Array} - Array von {url, title} Objekten (max. 5)
     */
    selectLinks(intention, query) {
        const queryLower = query.toLowerCase();
        const links = [];
        
        // Mapping von Intention zu Datenbank-Kategorie
        const intentionMap = {
            'kfz_zulassung': 'kfz',
            'kfz': 'kfz',
            'fahrzeug': 'kfz',
            'auto': 'kfz',
            'zulassung': 'kfz',
            'kennzeichen': 'kfz',
            
            'fuehrerschein': 'fuehrerschein',
            'fahrerlaubnis': 'fuehrerschein',
            
            'bauantrag': 'bau',
            'bau': 'bau',
            'bauen': 'bau',
            'bauamt': 'bau',
            
            'gewerbe': 'gewerbe',
            'gewerbeanmeldung': 'gewerbe',
            
            'meldung': 'meldewesen',
            'ummeldung': 'meldewesen',
            'anmeldung': 'meldewesen',
            'abmeldung': 'meldewesen',
            
            'ausweis': 'ausweis',
            'reisepass': 'ausweis',
            'pass': 'ausweis',
            
            'jugend': 'jugend',
            'jugendamt': 'jugend',
            'kita': 'jugend',
            'kindergarten': 'jugend',
            
            'soziales': 'soziales',
            'grundsicherung': 'soziales',
            'jobcenter': 'soziales',
            
            'gesundheit': 'gesundheit',
            'gesundheitsamt': 'gesundheit',
            'impfung': 'gesundheit',
            
            'umwelt': 'umwelt',
            'abfall': 'umwelt',
            
            'bildung': 'bildung',
            'schule': 'bildung',
            'schulamt': 'bildung',
            
            'politik': 'politik',
            'kreistag': 'politik',
            'sitzung': 'politik',
            
            'kontakt': 'kontakt',
            'sprechzeit': 'kontakt',
            'oeffnungszeit': 'kontakt',
            
            'stelle': 'stellen',
            'job': 'stellen',
            'bewerbung': 'stellen'
        };
        
        const category = intentionMap[intention] || intention;
        
        // Lade Links für diese Kategorie
        const categoryLinks = this.linkDatabase[category] || {};
        
        // Score-Links basierend auf Query-Keywords
        const scoredLinks = [];
        
        Object.entries(categoryLinks).forEach(([subtype, linkData]) => {
            if (!linkData || !linkData.url) return;
            
            let score = 1; // Basis-Score
            
            // Subtype-Matching
            if (queryLower.includes('termin') && subtype.includes('termin')) {
                score += 5;
            }
            if (queryLower.includes('formular') && subtype.includes('formular')) {
                score += 5;
            }
            if (queryLower.includes('beratung') && subtype.includes('beratung')) {
                score += 5;
            }
            
            // Title-Matching
            const title = (linkData.title || '').toLowerCase();
            if (queryLower.split(' ').some(word => title.includes(word))) {
                score += 3;
            }
            
            scoredLinks.push({
                url: linkData.url,
                title: linkData.title || linkData.url,
                score,
                subtype
            });
        });
        
        // Sortiere nach Score und nimm Top 5
        scoredLinks.sort((a, b) => b.score - a.score);
        const topLinks = scoredLinks.slice(0, 5).map(link => ({
            url: link.url,
            title: link.title
        }));
        
        // Fallback: Startseite + Telefon wenn keine Links
        if (topLinks.length === 0) {
            topLinks.push({
                url: 'https://www.oldenburg-kreis.de/',
                title: 'Startseite Landkreis Oldenburg'
            });
            topLinks.push({
                url: 'tel:+494431850',
                title: 'Telefon: 04431 85-0'
            });
        }
        
        console.log(`🔗 Link-Selector: ${topLinks.length} Links für "${category}" (Intention: "${intention}")`);
        
        return topLinks;
    }
    
    /**
     * Get all available categories
     */
    getAvailableCategories() {
        return Object.keys(this.linkDatabase);
    }
}

module.exports = LinkSelector;

