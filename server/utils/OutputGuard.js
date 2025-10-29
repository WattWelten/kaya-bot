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
    rotatingClosers: [
        "Passt das so? Sonst feilen wir kurz nach.",
        "Soll ich das direkt verlinken oder per E-Mail schicken?",
        "Weiter mit: Unterlagen · Kosten · Termin."
    ]
};

/**
 * Wendet Output-Guard auf rohe LLM-Antwort an
 * 
 * @param {string} raw - Rohe LLM-Antwort
 * @param {object} state - State-Objekt mit lastFooters und lastClosers (Ring-Buffer)
 * @returns {string} - Bereinigte Antwort
 */
function applyOutputGuard(raw, state) {
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

    // 5) Closers rotieren (max. alle 3–4 Turns)
    // Nur wenn noch kein Closer im Text vorhanden ist
    if (!/(Unterlagen|Weiter mit|Termin|Passt das|Soll ich)/i.test(text)) {
        const seenClosers = state.lastClosers || [];
        const candidates = guardCfg.rotatingClosers.filter(c => !seenClosers.includes(c));
        const closer = candidates[0] || guardCfg.rotatingClosers[0] || "";
        if (closer) {
            text += (text.endsWith('\n') ? '' : '\n') + closer;
            // Ring-Buffer: Maximal die letzten 2 behalten
            state.lastClosers = [...seenClosers.slice(-2), closer];
        }
    }

    return text.trim();
}

module.exports = {
    applyOutputGuard,
    guardCfg
};

