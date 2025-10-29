/**
 * OutputGuard: Wendet KAYA-Stilregeln auf das LLM-Resultat an.
 * Entfernt Floskeln, kürzt Antworten, dedupliziert Quellen und rotiert Closers.
 */

const guardCfg = {
    maxLines: 8,
    minGapForFooter: 5, // gleiche Footer/Hinweise erst nach 5 Turns wieder
    bannedPhrases: [
        "Ich hoffe, das hilft",
        "Gern geschehen",
        "Als KI-Modell",
        "Bei weiteren Fragen stehe ich zur Verfügung",
        "Ich freue mich, Ihnen helfen zu können",
        "Hoffe, das hilft",
        "Bei Fragen stehe ich zur Verfügung"
    ],
    // Closers komplett entfernt - waren unpassend/generisch
    // Closers werden nicht mehr automatisch hinzugefügt
    rotatingClosers: []
};

/**
 * Wendet Output-Guard auf rohe LLM-Antwort an
 * 
 * @param {string} raw - Rohe LLM-Antwort
 * @param {object} state - State-Objekt mit lastFooters und lastClosers (Ring-Buffer)
 * @param {boolean} isFirstMessage - Ist dies die erste Nachricht? (dann KEIN Closer)
 * @returns {string} - Bereinigte Antwort
 */
function applyOutputGuard(raw, state, isFirstMessage = false) {
    if (!raw || typeof raw !== 'string') {
        return raw || '';
    }

    // State initialisieren falls nicht vorhanden
    if (!state) {
        state = { lastFooters: [], lastClosers: [] };
    }
    if (!state.lastFooters) state.lastFooters = [];
    if (!state.lastClosers) state.lastClosers = [];

    // 1) Zeilen aufteilen und leere Zeilen entfernen
    const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);
    
    // 2) Floskeln aus jeder Zeile entfernen
    let text = lines.map(line => {
        let cleaned = line;
        guardCfg.bannedPhrases.forEach(phrase => {
            // Regex erstellen mit escaped special chars
            const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escaped, 'gi');
            cleaned = cleaned.replace(regex, '');
        });
        return cleaned.trim();
    }).filter(Boolean).join('\n');

    // 3) Kürzen auf maxLines (aber keine mitten-im-Satz-Schnitte)
    const trimmed = text.split('\n');
    if (trimmed.length > guardCfg.maxLines) {
        text = trimmed.slice(0, guardCfg.maxLines).join('\n');
    }

    // 4) Footer/Quellen-Deduplizierung (nur wenn neu)
    text = text.replace(/\n?(?:Quelle|Source):.*$/i, (match) => {
        if (!match) return match;
        const key = match.toLowerCase().trim();
        const seen = state.lastFooters || [];
        if (seen.includes(key)) {
            return ""; // gleiche Quelle nicht wiederholen
        }
        // Ring-Buffer: Maximal die letzten 4 behalten
        state.lastFooters = [...seen.slice(-4), key];
        return "\n" + match;
    });

    // 5) Closers entfernt - waren unpassend/generisch
    // Keine automatischen Closers mehr

    return text.trim();
}

module.exports = {
    applyOutputGuard,
    guardCfg
};

