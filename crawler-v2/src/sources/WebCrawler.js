const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const Logger = require('../utils/Logger');

class WebCrawler {
    constructor() {
        this.logger = new Logger('WebCrawler');
        this.browser = null;
    }

    async init() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }
    }

    async crawl(url) {
        await this.init();
        this.logger.info(`🌐 Crawle URL: ${url}`);
        
        const page = await this.browser.newPage();
        
        try {
            // Setze User-Agent und Timeout
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            await page.setDefaultTimeout(30000);
            
            // Navigiere zur Seite
            await page.goto(url, { waitUntil: 'networkidle2' });
            
            // Warte auf Content
            await page.waitForSelector('body', { timeout: 10000 });
            
            // Extrahiere HTML-Content
            const html = await page.content();
            
            // Parse mit Cheerio
            const $ = cheerio.load(html);
            
            // Extrahiere strukturierte Daten
            const data = this.extractStructuredData($, url);
            
            this.logger.info(`✅ Erfolgreich gecrawlt: ${data.length} Einträge`);
            return data;
            
        } catch (error) {
            this.logger.error(`❌ Crawl-Fehler für ${url}:`, error);
            return [];
        } finally {
            await page.close();
        }
    }

    extractStructuredData($, baseUrl) {
        const data = [];
        
        // Extrahiere Hauptinhalt
        const mainContent = $('main, .content, #content, .main-content').first();
        if (mainContent.length === 0) {
            // Fallback: Verwende body
            const body = $('body');
            this.extractFromElement(body, baseUrl, data);
        } else {
            this.extractFromElement(mainContent, baseUrl, data);
        }
        
        return data;
    }

    extractFromElement($element, baseUrl, data) {
        // Extrahiere Links
        $element.find('a[href]').each((i, el) => {
            const $el = $(el);
            const href = $el.attr('href');
            const text = $el.text().trim();
            
            if (href && text && href.startsWith('http')) {
                data.push({
                    type: 'link',
                    url: href,
                    title: text,
                    source: baseUrl
                });
            }
        });
        
        // Extrahiere Kontakte
        $element.find('*').each((i, el) => {
            const $el = $(el);
            const text = $el.text();
            
            // E-Mail-Adressen
            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
            const emails = text.match(emailRegex);
            if (emails) {
                emails.forEach(email => {
                    data.push({
                        type: 'contact',
                        contactType: 'email',
                        value: email,
                        source: baseUrl
                    });
                });
            }
            
            // Telefonnummern
            const phoneRegex = /(\+?49\s?)?(\(?0?\)?[1-9]\d{1,4}\)?[\s\-]?\d{1,4}[\s\-]?\d{1,4}[\s\-]?\d{1,4})/g;
            const phones = text.match(phoneRegex);
            if (phones) {
                phones.forEach(phone => {
                    data.push({
                        type: 'contact',
                        contactType: 'phone',
                        value: phone.trim(),
                        source: baseUrl
                    });
                });
            }
        });
        
        // Extrahiere Formulare
        $element.find('form').each((i, el) => {
            const $el = $(el);
            const action = $el.attr('action');
            const method = $el.attr('method') || 'GET';
            
            data.push({
                type: 'form',
                url: action ? new URL(action, baseUrl).href : baseUrl,
                method: method,
                source: baseUrl
            });
        });
        
        // Extrahiere PDF-Links
        $element.find('a[href$=".pdf"], a[href*=".pdf"]').each((i, el) => {
            const $el = $(el);
            const href = $el.attr('href');
            const text = $el.text().trim();
            
            data.push({
                type: 'pdf',
                url: new URL(href, baseUrl).href,
                title: text || 'PDF-Dokument',
                source: baseUrl
            });
        });
        
        // Extrahiere Hauptinhalt
        const content = $element.text().replace(/\s+/g, ' ').trim();
        if (content.length > 100) {
            data.push({
                type: 'content',
                url: baseUrl,
                title: $element.find('h1, h2, h3').first().text().trim() || 'Inhalt',
                content: content,
                plain_text: content,
                source: baseUrl
            });
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}

module.exports = WebCrawler;

