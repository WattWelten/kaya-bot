const DataCompressor = require('./data_compressor.js');
const compressor = new DataCompressor();

async function testCompression() {
    console.log('🚀 Starte intelligente Datenkompression...');
    
    // Erstelle Backup
    compressor.createBackup('../ki_backend/2025-10-09', '../ki_backend/backup');
    
    // Komprimiere alle Agent-Daten
    const results = await compressor.compressAllAgentData('../ki_backend/2025-10-09', '../ki_backend/2025-10-09-compressed');
    
    console.log('\n📊 Kompressions-Ergebnisse:');
    results.forEach(result => {
        if (result.success) {
            console.log(`${result.agent}: ${result.ratio}% Reduktion (${(result.compressedSize/1024/1024).toFixed(2)} MB)`);
        } else {
            console.log(`${result.agent}: FEHLER - ${result.error}`);
        }
    });
    
    const totalOriginal = results.reduce((sum, r) => sum + (r.originalSize || 0), 0);
    const totalCompressed = results.reduce((sum, r) => sum + (r.compressedSize || 0), 0);
    const totalRatio = ((totalOriginal - totalCompressed) / totalOriginal * 100).toFixed(1);
    
    console.log(`\n🎯 GESAMT: ${totalRatio}% Reduktion`);
    console.log(`📦 Von ${(totalOriginal/1024/1024).toFixed(2)} MB auf ${(totalCompressed/1024/1024).toFixed(2)} MB`);
}

testCompression().catch(console.error);


