/**
 * KAYA Link Validation Script
 * 
 * Prüft alle Links auf Gültigkeit (HTTP-Status-Check)
 */

const https = require('https');
const http = require('http');
const fs = require('fs');

// Alle Links aus llm_service.js und kaya_character_handler_v2.js extrahieren
const linksToCheck = [
    // Aus llm_service.js (KORRIGIERT)
    'https://www.oldenburg-kreis.de/planen-und-bauen/bauen-im-landkreis-oldenburg/antraege-und-formulare/',
    'https://www.oldenburg-kreis.de/wirtschaft-und-arbeit/jobcenter-landkreis-oldenburg/',
    'https://www.oldenburg-kreis.de/fuehrerscheinstelle/',
    'https://www.oldenburg-kreis.de/',
    
    // Weitere wichtige Links
    'https://www.oldenburg-kreis.de/gesundheit-und-soziales/',
    'https://www.oldenburg-kreis.de/wirtschaft-und-arbeit/',
    'https://www.oldenburg-kreis.de/bauen-und-wohnen/',
    'https://www.oldenburg-kreis.de/verkehr/',
    'https://www.oldenburg-kreis.de/jugend-und-familie/',
];

/**
 * Prüft einen einzelnen Link
 */
function checkLink(url) {
    return new Promise((resolve) => {
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;
        
        const request = client.get(url, { timeout: 5000 }, (response) => {
            const statusCode = response.statusCode;
            
            // Redirect verfolgen
            if (statusCode >= 300 && statusCode < 400 && response.headers.location) {
                resolve({
                    url,
                    status: statusCode,
                    redirect: response.headers.location,
                    valid: true,
                    message: `Redirect to: ${response.headers.location}`
                });
            } else {
                resolve({
                    url,
                    status: statusCode,
                    valid: statusCode >= 200 && statusCode < 300,
                    message: statusCode >= 200 && statusCode < 300 ? 'OK' : `Error: ${statusCode}`
                });
            }
            
            response.destroy();
        });
        
        request.on('error', (error) => {
            resolve({
                url,
                status: 0,
                valid: false,
                message: `Error: ${error.message}`
            });
        });
        
        request.on('timeout', () => {
            request.destroy();
            resolve({
                url,
                status: 0,
                valid: false,
                message: 'Timeout'
            });
        });
        
        request.setTimeout(5000);
    });
}

/**
 * Hauptfunktion
 */
async function validateAllLinks() {
    console.log('🔍 Starte Link-Validierung...\n');
    
    const results = [];
    
    for (const link of linksToCheck) {
        console.log(`Prüfe: ${link}`);
        const result = await checkLink(link);
        results.push(result);
        
        // Status-Anzeige
        if (result.valid) {
            console.log(`✅ ${result.status} - ${result.message || 'OK'}`);
        } else {
            console.log(`❌ ${result.status} - ${result.message || 'FAILED'}`);
        }
        
        // Kurze Pause zwischen Requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Zusammenfassung
    console.log('\n📊 ZUSAMMENFASSUNG:');
    console.log('==================');
    
    const valid = results.filter(r => r.valid);
    const invalid = results.filter(r => !r.valid);
    
    console.log(`✅ Gültige Links: ${valid.length}/${results.length}`);
    console.log(`❌ Ungültige Links: ${invalid.length}/${results.length}`);
    
    if (invalid.length > 0) {
        console.log('\n❌ UNGÜLTIGE LINKS:');
        invalid.forEach(r => {
            console.log(`  - ${r.url}`);
            console.log(`    Status: ${r.message}`);
        });
    }
    
    // JSON-Report speichern
    const report = {
        timestamp: new Date().toISOString(),
        total: results.length,
        valid: valid.length,
        invalid: invalid.length,
        results: results
    };
    
    fs.writeFileSync('link_validation_report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Report gespeichert: link_validation_report.json');
    
    return report;
}

// Script ausführen
if (require.main === module) {
    validateAllLinks().catch(console.error);
}

module.exports = { validateAllLinks, checkLink };

