const fs = require('fs-extra');
const path = require('path');

/**
 * KAYA Cost Tracker
 * 
 * Tracking von API-Kosten:
 * - OpenAI GPT-4o-mini: $0.150/1M input tokens, $0.600/1M output tokens
 * - OpenAI Whisper: $0.006/Minute
 * - ElevenLabs: $5/30k Zeichen (Starter)
 * 
 * Budget Alerts:
 * - Warning bei 80% des Budgets
 * - Stop bei 100% des Budgets
 */

class CostTracker {
    constructor() {
        this.costFilePath = path.join(__dirname, '../data/cost_tracking.json');
        
        // Kosten-Raten (pro Einheit)
        this.costRates = {
            openai: {
                input: 0.00000015, // $0.150 / 1M tokens = $0.00000015 per token
                output: 0.0000006  // $0.600 / 1M tokens = $0.0000006 per token
            },
            whisper: {
                perMinute: 0.006 // $0.006 per minute
            },
            elevenlabs: {
                perCharacter: 5 / 30000 // $5 / 30k Zeichen
            }
        };
        
        // Budget Limits
        this.budgetLimits = {
            daily: parseFloat(process.env.DAILY_BUDGET || 10), // $10 pro Tag
            monthly: parseFloat(process.env.MONTHLY_BUDGET || 300) // $300 pro Monat
        };
        
        // Statistiken
        this.stats = {
            daily: {
                date: new Date().toISOString().split('T')[0],
                openaiCost: 0,
                whisperCost: 0,
                elevenlabsCost: 0,
                totalCost: 0,
                openaiTokens: 0,
                whisperMinutes: 0,
                elevenlabsCharacters: 0,
                requestCount: 0
            },
            monthly: {
                month: new Date().toISOString().substring(0, 7),
                openaiCost: 0,
                whisperCost: 0,
                elevenlabsCost: 0,
                totalCost: 0,
                openaiTokens: 0,
                whisperMinutes: 0,
                elevenlabsCharacters: 0,
                requestCount: 0
            },
            totalRequests: 0,
            lastReset: new Date().toISOString()
        };
        
        this.loadStats();
        
        console.log('💰 Cost Tracker initialisiert');
        console.log(`   Daily Budget: $${this.budgetLimits.daily}`);
        console.log(`   Monthly Budget: $${this.budgetLimits.monthly}`);
    }
    
    /**
     * OpenAI Kosten tracken
     */
    trackOpenAI(inputTokens, outputTokens) {
        const inputCost = inputTokens * this.costRates.openai.input;
        const outputCost = outputTokens * this.costRates.openai.output;
        const totalCost = inputCost + outputCost;
        
        this.stats.daily.openaiCost += totalCost;
        this.stats.daily.totalCost += totalCost;
        this.stats.monthly.openaiCost += totalCost;
        this.stats.monthly.totalCost += totalCost;
        this.stats.daily.openaiTokens += inputTokens + outputTokens;
        this.stats.monthly.openaiTokens += inputTokens + outputTokens;
        this.stats.totalRequests++;
        this.stats.daily.requestCount++;
        this.stats.monthly.requestCount++;
        
        this.saveStats();
        
        console.log(`💰 OpenAI Kosten: $${totalCost.toFixed(4)} (${inputTokens + outputTokens} tokens)`);
        
        return totalCost;
    }
    
    /**
     * Whisper Kosten tracken
     */
    trackWhisper(durationMinutes) {
        const cost = durationMinutes * this.costRates.whisper.perMinute;
        
        this.stats.daily.whisperCost += cost;
        this.stats.daily.totalCost += cost;
        this.stats.monthly.whisperCost += cost;
        this.stats.monthly.totalCost += cost;
        this.stats.daily.whisperMinutes += durationMinutes;
        this.stats.monthly.whisperMinutes += durationMinutes;
        
        this.saveStats();
        
        console.log(`💰 Whisper Kosten: $${cost.toFixed(4)} (${durationMinutes.toFixed(2)} Minuten)`);
        
        return cost;
    }
    
    /**
     * ElevenLabs Kosten tracken
     */
    trackElevenLabs(characterCount) {
        const cost = characterCount * this.costRates.elevenlabs.perCharacter;
        
        this.stats.daily.elevenlabsCost += cost;
        this.stats.daily.totalCost += cost;
        this.stats.monthly.elevenlabsCost += cost;
        this.stats.monthly.totalCost += cost;
        this.stats.daily.elevenlabsCharacters += characterCount;
        this.stats.monthly.elevenlabsCharacters += characterCount;
        
        this.saveStats();
        
        console.log(`💰 ElevenLabs Kosten: $${cost.toFixed(4)} (${characterCount} Zeichen)`);
        
        return cost;
    }
    
    /**
     * Budget prüfen
     */
    checkBudget() {
        const today = new Date().toISOString().split('T')[0];
        const thisMonth = new Date().toISOString().substring(0, 7);
        
        // Tägliche Reset-Logik
        if (this.stats.daily.date !== today) {
            this.stats.daily = {
                date: today,
                openaiCost: 0,
                whisperCost: 0,
                elevenlabsCost: 0,
                totalCost: 0,
                openaiTokens: 0,
                whisperMinutes: 0,
                elevenlabsCharacters: 0,
                requestCount: 0
            };
        }
        
        // Monatliche Reset-Logik
        if (this.stats.monthly.month !== thisMonth) {
            this.stats.monthly = {
                month: thisMonth,
                openaiCost: 0,
                whisperCost: 0,
                elevenlabsCost: 0,
                totalCost: 0,
                openaiTokens: 0,
                whisperMinutes: 0,
                elevenlabsCharacters: 0,
                requestCount: 0
            };
        }
        
        // Budget-Status
        const dailyPercentage = (this.stats.daily.totalCost / this.budgetLimits.daily) * 100;
        const monthlyPercentage = (this.stats.monthly.totalCost / this.budgetLimits.monthly) * 100;
        
        const status = {
            canProceed: true,
            warning: false,
            blocked: false,
            message: 'OK'
        };
        
        // Daily Budget Check
        if (dailyPercentage >= 100) {
            status.canProceed = false;
            status.blocked = true;
            status.message = `Daily budget exceeded: $${this.stats.daily.totalCost.toFixed(2)} / $${this.budgetLimits.daily}`;
            console.error(`🚫 Daily Budget überschritten: ${dailyPercentage.toFixed(1)}%`);
        } else if (dailyPercentage >= 80) {
            status.warning = true;
            status.message = `Daily budget warning: ${dailyPercentage.toFixed(1)}% used`;
            console.warn(`⚠️ Daily Budget Warnung: ${dailyPercentage.toFixed(1)}%`);
        }
        
        // Monthly Budget Check
        if (monthlyPercentage >= 100) {
            status.canProceed = false;
            status.blocked = true;
            status.message = `Monthly budget exceeded: $${this.stats.monthly.totalCost.toFixed(2)} / $${this.budgetLimits.monthly}`;
            console.error(`🚫 Monthly Budget überschritten: ${monthlyPercentage.toFixed(1)}%`);
        } else if (monthlyPercentage >= 80) {
            status.warning = true;
            status.message = `Monthly budget warning: ${monthlyPercentage.toFixed(1)}% used`;
            console.warn(`⚠️ Monthly Budget Warnung: ${monthlyPercentage.toFixed(1)}%`);
        }
        
        return status;
    }
    
    /**
     * Stats laden
     */
    async loadStats() {
        try {
            await fs.ensureDir(path.dirname(this.costFilePath));
            
            if (await fs.pathExists(this.costFilePath)) {
                const data = await fs.readJson(this.costFilePath);
                this.stats = { ...this.stats, ...data };
            }
        } catch (error) {
            console.error('❌ Cost Stats laden fehlgeschlagen:', error);
        }
    }
    
    /**
     * Stats speichern
     */
    async saveStats() {
        try {
            await fs.ensureDir(path.dirname(this.costFilePath));
            await fs.writeJson(this.costFilePath, this.stats, { spaces: 2 });
        } catch (error) {
            console.error('❌ Cost Stats speichern fehlgeschlagen:', error);
        }
    }
    
    /**
     * Stats abrufen
     */
    getStats() {
        const today = new Date().toISOString().split('T')[0];
        const thisMonth = new Date().toISOString().substring(0, 7);
        
        // Reset-Logik anwenden
        this.checkBudget();
        
        return {
            daily: {
                ...this.stats.daily,
                percentage: ((this.stats.daily.totalCost / this.budgetLimits.daily) * 100).toFixed(1),
                limit: this.budgetLimits.daily,
                date: today
            },
            monthly: {
                ...this.stats.monthly,
                percentage: ((this.stats.monthly.totalCost / this.budgetLimits.monthly) * 100).toFixed(1),
                limit: this.budgetLimits.monthly,
                month: thisMonth
            },
            totalRequests: this.stats.totalRequests,
            lastReset: this.stats.lastReset
        };
    }
    
    /**
     * Stats zurücksetzen (für Testing)
     */
    async resetStats() {
        const today = new Date().toISOString().split('T')[0];
        const thisMonth = new Date().toISOString().substring(0, 7);
        
        this.stats = {
            daily: {
                date: today,
                openaiCost: 0,
                whisperCost: 0,
                elevenlabsCost: 0,
                totalCost: 0,
                openaiTokens: 0,
                whisperMinutes: 0,
                elevenlabsCharacters: 0,
                requestCount: 0
            },
            monthly: {
                month: thisMonth,
                openaiCost: 0,
                whisperCost: 0,
                elevenlabsCost: 0,
                totalCost: 0,
                openaiTokens: 0,
                whisperMinutes: 0,
                elevenlabsCharacters: 0,
                requestCount: 0
            },
            totalRequests: 0,
            lastReset: new Date().toISOString()
        };
        
        await this.saveStats();
        console.log('🔄 Cost Stats zurückgesetzt');
    }
}

module.exports = new CostTracker();

