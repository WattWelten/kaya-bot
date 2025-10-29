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
            this.extractFromElement(body, $, baseUrl, data);
        } else {
            this.extractFromElement(mainContent, $, baseUrl, data);
        }
        
        return data;
    }

    extractFromElement($element, $, baseUrl, data) {
        // Extrahiere Links (mit Content-Context)
        $element.find('a[href]').each(function() {
            const $el = $(this);
            const href = $el.attr('href');
            const text = $el.text().trim();
            
            if (href && text && href.startsWith('http')) {
                // Füge umgebenden Text als Context hinzu (erweiterter Radius)
                let context = '';
                
                // 1. Nimm Text von Parent (wenn nicht zu lang)
                const $parent = $el.parent();
                const parentText = $parent.text().replace(/\s+/g, ' ').trim();
                if (parentText.length > text.length && parentText.length < 800) {
                    context = parentText.replace(new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '').trim();
                }
                
                // 2. Nimm Parent-Section (erweiteter Radius)
                if (context.length < 50) { // Senke Schwelle auf 50 für mehr Content
                    const $section = $parent.closest('section, article, .content-section, .post-content, .entry-content, .content, main');
                    if ($section.length) {
                        const sectionText = $section.text().replace(/\s+/g, ' ').trim();
                        if (sectionText.length > 100 && sectionText.length < 3000) {
                            // Extrahiere relevante Teile (vor/nach Link)
                            const linkIndex = sectionText.indexOf(text);
                            if (linkIndex >= 0) {
                                const beforeText = sectionText.substring(Math.max(0, linkIndex - 400), linkIndex).trim();
                                const afterText = sectionText.substring(linkIndex + text.length, Math.min(sectionText.length, linkIndex + text.length + 400)).trim();
                                context = (beforeText + ' ' + afterText).replace(/\s+/g, ' ').trim();
                            } else {
                                // Wenn Link-Text nicht gefunden, nimm ersten Teil der Section
                                context = sectionText.substring(0, Math.min(500, sectionText.length)).trim();
                            }
                        }
                    }
                }
                
                // 3. Nimm vorherige/nächste Sibling-Elemente (erweitert)
                if (context.length < 50) {
                    const $prev = $el.prevAll('p, div, span, li').first();
                    const $next = $el.nextAll('p, div, span, li').first();
                    const prevText = $prev.length ? $prev.text().trim().replace(/\s+/g, ' ').substring(0, 400) : '';
                    const nextText = $next.length ? $next.text().trim().replace(/\s+/g, ' ').substring(0, 400) : '';
                    context = (prevText + ' ' + nextText).trim();
                }
                
                // 4. Fallback: Nimm alle Siblings im gleichen Container
                if (context.length < 30) {
                    const siblings = $parent.children().not($el).map(function() {
                        return $(this).text().trim();
                    }).get().filter(t => t.length > 10).join(' ').replace(/\s+/g, ' ').trim();
                    if (siblings.length > 20 && siblings.length < 800) {
                        context = siblings;
                    }
                }
                
                // 5. Zusätzlicher Fallback: Nimm gesamten Parent-Container-Text (lockerer)
                if (context.length < 30) {
                    const containerText = $parent.text().replace(/\s+/g, ' ').trim();
                    if (containerText.length > 30 && containerText.length < 1500) {
                        // Entferne Link-Text aus Container-Text
                        const cleaned = containerText.replace(new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '').trim();
                        if (cleaned.length >= 30) {
                            context = cleaned;
                        } else {
                            context = containerText.substring(0, 300); // Nimm ersten Teil
                        }
                    }
                }
                
                // 6. Letzter Fallback: Nimm Parent-Parent Text (noch mehr Context)
                if (context.length < 30) {
                    const $grandParent = $parent.parent();
                    if ($grandParent.length) {
                        const gpText = $grandParent.text().replace(/\s+/g, ' ').trim();
                        if (gpText.length > 50 && gpText.length < 2000) {
                            context = gpText.substring(0, 400).trim();
                        }
                    }
                }
                
                // Link mit Content hinzufügen (auch wenn Context nur 30 Zeichen - aggressive Extraktion)
                // Verwende auch kürzeren Context als Content (alles ist besser als nichts)
                const finalContext = context.length >= 30 ? context : text; // Mindestens Link-Text selbst
                
                data.push({
                    type: 'link',
                    url: href,
                    title: text,
                    content: finalContext.length >= 30 ? finalContext : text, // Mindest 30 Zeichen, oder Link-Text
                    plain_text: finalContext.length >= 30 ? finalContext : text,
                    source: baseUrl
                });
            }
        });
        
        // Extrahiere Kontakte
        $element.find('*').each(function() {
            const $el = $(this);
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
        $element.find('form').each(function() {
            const $el = $(this);
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
        $element.find('a[href$=".pdf"], a[href*=".pdf"]').each(function() {
            const $el = $(this);
            const href = $el.attr('href');
            const text = $el.text().trim();
            
            data.push({
                type: 'pdf',
                url: new URL(href, baseUrl).href,
                title: text || 'PDF-Dokument',
                source: baseUrl
            });
        });
        
        // Strukturierte Content-Extraktion (Sections, Paragraphs, Headings)
        // WICHTIG: Sections UND Fallback können beide Content liefern
        const contentSections = this.extractContentSections($, baseUrl);
        if (Array.isArray(contentSections) && contentSections.length > 0) {
            data.push(...contentSections);
        }
        
        // Fallback IMMER hinzufügen (aggressive Content-Extraktion für 95%+ Ziel)
        const fallbackContent = this.extractFallbackContent($element, $, baseUrl);
        if (fallbackContent && fallbackContent.content && fallbackContent.content.length >= 100) {
            // Sehr lockerer Duplikat-Check: Nur wenn >95% identischer Content UND gleiche URL
            const isDuplicate = contentSections?.some(s => {
                if (s.url !== fallbackContent.url) return false;
                const sContent = s.content || '';
                const fContent = fallbackContent.content || '';
                if (Math.abs(sContent.length - fContent.length) > 50) return false; // Zu unterschiedlich in Länge
                // Prüfe ob Content zu >95% identisch ist (über 200 Zeichen)
                if (sContent.length < 200 || fContent.length < 200) return false; // Zu kurz für Vergleich
                const longer = sContent.length > fContent.length ? sContent : fContent;
                const shorter = sContent.length <= fContent.length ? sContent : fContent;
                const similarity = (shorter.length / longer.length);
                return similarity > 0.95 && sContent.substring(0, 200) === fContent.substring(0, 200);
            });
            if (!isDuplicate) {
                data.push(fallbackContent);
            }
        }
    }

    extractContentSections($, baseUrl) {
        const sections = [];
        const $body = $('body').clone();
        
        // Entferne Navigation, Header, Footer, Sidebars und nicht-inhaltliche Bereiche (erweitert)
        const navigationSelectors = [
            'nav', 'header', 'footer', '.navigation', '.menu', '.navbar', '.nav',
            '.breadcrumb', '.sidebar', '.footer', '.header', '#navigation', '#nav',
            '.skip-link', '.skip', '.site-header', '.site-footer',
            '.main-navigation', '.site-nav', '.primary-nav', '.secondary-nav',
            '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
            '[role="complementary"]', '.widget', '.aside', 'aside',
            '.cookie-notice', '.cookie-banner', '#cookie', '.social-links'
        ];
        navigationSelectors.forEach(selector => $body.find(selector).remove());
        $body.find('script, style, noscript, iframe, embed, object').remove();
        
        // 1) Articles (höchste Priorität) - mehrere Articles pro Seite möglich
        const self = this;
        
        $body.find('article').each(function() {
            const section = self.extractSection($(this), $, baseUrl, 'article');
            if (section && section.content && section.content.length >= 100) {
                // Jedes Article als eigener Content-Eintrag (auch wenn gleiche URL)
                // Keine Duplikat-Prüfung hier - alle Articles sind wertvoll
                sections.push(section);
            }
        });
        
        // 2) Sections (mehrere Sections pro Seite) - alle Sections sind wertvoll
        $body.find('section').each(function() {
            const section = self.extractSection($(this), $, baseUrl, 'section');
            if (section && section.content && section.content.length >= 100) {
                // Sehr lockerer Duplikat-Check: Nur wenn >95% identisch mit Article
                const isDuplicate = sections.some(s => {
                    if (s.sectionType !== 'article') return false;
                    if (s.url !== section.url) return false;
                    const sContent = s.content || '';
                    const sectionContent = section.content || '';
                    if (Math.abs(sContent.length - sectionContent.length) > 100) return false;
                    if (sContent.length < 200 || sectionContent.length < 200) return false;
                    const longer = sContent.length > sectionContent.length ? sContent : sectionContent;
                    const shorter = sContent.length <= sectionContent.length ? sContent : sectionContent;
                    const similarity = (shorter.length / longer.length);
                    return similarity > 0.95 && sContent.substring(0, 200) === sectionContent.substring(0, 200);
                });
                if (!isDuplicate) {
                    sections.push(section);
                }
            }
        });
        
        // 3) Content-Bereiche (erweiterte Selektoren) - IMMER versuchen (mehr Content = besser)
        $body.find('main, .content, #content, .main-content, .content-area, .content-wrapper, .page-content, .entry-content, .post-content').each(function() {
            const section = self.extractSection($(this), $, baseUrl, 'main');
            if (section && section.content && section.content.length >= 100) {
                // Sehr lockerer Duplikat-Check: Nur wenn >95% identisch
                const isDuplicate = sections.some(s => {
                    if (s.url !== section.url) return false;
                    const sContent = s.content || '';
                    const sectionContent = section.content || '';
                    if (Math.abs(sContent.length - sectionContent.length) > 50) return false;
                    if (sContent.length < 200 || sectionContent.length < 200) return false;
                    const longer = sContent.length > sectionContent.length ? sContent : sectionContent;
                    const shorter = sContent.length <= sectionContent.length ? sContent : sectionContent;
                    const similarity = (shorter.length / longer.length);
                    return similarity > 0.95 && sContent.substring(0, 200) === sectionContent.substring(0, 200);
                });
                if (!isDuplicate) {
                    sections.push(section);
                }
            }
        });
        
        // 4) Heading-basierte Abschnitte (mehrere pro Seite)
        $body.find('h2, h3').each(function() {
            const $heading = $(this);
            const headingId = $heading.attr('id') || '';
            const headingText = $heading.text().trim();
            
            // Überspringe nur wenn Heading bereits explizit als Section-Titel vorhanden ist
            // (lockerer Check - erlaubt mehr Headings)
            const headingInSection = sections.some(s => 
                s.title === headingText && 
                headingId && s.url && s.url.includes('#' + headingId)
            );
            
            if (!headingInSection) {
                const $next = $heading.nextUntil('h1, h2, h3');
                const text = $next.map(function() {
                    return $(this).text();
                }).get().join(' ').replace(/\s+/g, ' ').trim();
                
                if (text && text.length > 80) { // Senke auf 80 Zeichen für mehr Headings
                    sections.push({
                        type: 'content',
                        url: baseUrl + (headingId ? '#' + headingId : ''),
                        title: headingText || 'Inhalt',
                        content: text,
                        plain_text: text,
                        source: baseUrl,
                        sectionType: 'heading'
                    });
                }
            }
        });
        
        return sections;
    }
    
    extractSection($element, $, baseUrl, sectionType) {
        const $clone = $element.clone();
        $clone.find('script, style, nav, .navigation, .menu, .footer, header, footer, .breadcrumb, .skip-link, aside, .sidebar').remove();
        
        const title = $clone.find('h1, h2, h3').first().text().trim() || $clone.attr('aria-label') || 'Inhalt';
        
        // Extrahiere Paragraphs (erhöhte Mindestlänge)
        const paragraphs = [];
        $clone.find('p').each(function() {
            const text = $(this).text().replace(/\s+/g, ' ').trim();
            if (text.length > 30) paragraphs.push(text);
        });
        
        // Extrahiere strukturierte Listen als Content
        const listItems = [];
        $clone.find('ul li, ol li').each(function() {
            const text = $(this).text().replace(/\s+/g, ' ').trim();
            if (text.length > 30) listItems.push('• ' + text);
        });
        
        // Extrahiere Tabellen als Content
        const tableContent = [];
        $clone.find('table').each(function() {
            const $table = $(this);
            const tableText = $table.find('td, th').map(function() {
                return $(this).text().trim();
            }).get().filter(t => t.length > 5).join(' | ').replace(/\s+/g, ' ');
            if (tableText.length > 50) {
                tableContent.push(tableText);
            }
        });
        
        // Extrahiere Definition Lists als Content
        const dlItems = [];
        $clone.find('dl').each(function() {
            const $dl = $(this);
            $dl.find('dt, dd').each(function() {
                const text = $(this).text().replace(/\s+/g, ' ').trim();
                if (text.length > 20) dlItems.push(text);
            });
        });
        
        // Extrahiere Blockquotes als Content
        const blockquotes = [];
        $clone.find('blockquote').each(function() {
            const text = $(this).text().replace(/\s+/g, ' ').trim();
            if (text.length > 50) blockquotes.push('"' + text + '"');
        });
        
        let content = paragraphs.join('\n\n');
        if (listItems.length > 0) {
            content += (content ? '\n\n' : '') + listItems.join('\n');
        }
        if (tableContent.length > 0) {
            content += (content ? '\n\n' : '') + 'Tabellen: ' + tableContent.join('\n\n');
        }
        if (dlItems.length > 0) {
            content += (content ? '\n\n' : '') + 'Definitionen: ' + dlItems.join(' - ');
        }
        if (blockquotes.length > 0) {
            content += (content ? '\n\n' : '') + 'Zitate: ' + blockquotes.join('\n\n');
        }
        
        // Fallback: Wenn zu wenig Paragraphs, hole Text aus divs
        if (content.length < 100) {
            const divTexts = [];
            $clone.find('div, span').each(function() {
                const $div = $(this);
                // Überspringe wenn Navigation/Button/Link-Container
                if ($div.hasClass('nav') || $div.hasClass('menu') || $div.hasClass('button') || $div.find('a').length > 3) {
                    return;
                }
                const text = $div.text().replace(/\s+/g, ' ').trim();
                if (text.length > 100 && text.length < 2000) {
                    divTexts.push(text);
                }
            });
            if (divTexts.length > 0) {
                content = (content || '') + (content ? '\n\n' : '') + divTexts.slice(0, 5).join('\n\n');
            }
        }
        
        // Fallback: Gesamter Text (filtert Navigation raus)
        if (content.length < 100) {
            content = $clone.clone().find('script, style, nav, a, button, .nav, .menu').remove().end().text().replace(/\s+/g, ' ').trim();
        }
        
        if (content.length < 100) return null;
        
        return {
                type: 'content',
                url: baseUrl,
            title: title,
                content: content,
                plain_text: content,
            source: baseUrl,
            sectionType: sectionType,
            paragraphCount: paragraphs.length
        };
    }
    
    extractFallbackContent($element, $, baseUrl) {
        const $clean = $element.clone();
        $clean.find('nav, header, footer, .navigation, .menu, .footer, script, style, .breadcrumb, aside, .sidebar').remove();
        
        // Alle Paragraphs aus main/body extrahieren
        const paragraphs = [];
        $clean.find('p').each(function() {
            const text = $(this).text().replace(/\s+/g, ' ').trim();
            if (text.length > 30) paragraphs.push(text);
        });
        
        // Strukturierte Listen als Content
        const listItems = [];
        $clean.find('ul li, ol li').each(function() {
            const text = $(this).text().replace(/\s+/g, ' ').trim();
            if (text.length > 30) listItems.push('• ' + text);
        });
        
        // Tabellen als Content
        const tableContent = [];
        $clean.find('table').each(function() {
            const $table = $(this);
            const tableText = $table.find('td, th').map(function() {
                return $(this).text().trim();
            }).get().filter(t => t.length > 5).join(' | ').replace(/\s+/g, ' ');
            if (tableText.length > 50) {
                tableContent.push(tableText);
            }
        });
        
        // Definition Lists als Content
        const dlItems = [];
        $clean.find('dl').each(function() {
            const $dl = $(this);
            $dl.find('dt, dd').each(function() {
                const text = $(this).text().replace(/\s+/g, ' ').trim();
                if (text.length > 20) dlItems.push(text);
            });
        });
        
        // Blockquotes als Content
        const blockquotes = [];
        $clean.find('blockquote').each(function() {
            const text = $(this).text().replace(/\s+/g, ' ').trim();
            if (text.length > 50) blockquotes.push('"' + text + '"');
        });
        
        let content = paragraphs.join('\n\n');
        if (listItems.length > 0) {
            content += (content ? '\n\n' : '') + listItems.join('\n');
        }
        if (tableContent.length > 0) {
            content += (content ? '\n\n' : '') + 'Tabellen: ' + tableContent.join('\n\n');
        }
        if (dlItems.length > 0) {
            content += (content ? '\n\n' : '') + 'Definitionen: ' + dlItems.join(' - ');
        }
        if (blockquotes.length > 0) {
            content += (content ? '\n\n' : '') + 'Zitate: ' + blockquotes.join('\n\n');
        }
        
        // Wenn noch zu wenig: Text aus divs (ohne Navigation)
        if (content.length < 100 && paragraphs.length === 0) {
            const divTexts = [];
            $clean.find('div').each(function() {
                const $div = $(this);
                if ($div.hasClass('nav') || $div.hasClass('menu') || $div.find('a').length > 5) {
                    return;
                }
                const text = $div.text().replace(/\s+/g, ' ').trim();
                if (text.length > 100 && text.length < 3000) {
                    divTexts.push(text);
                }
            });
            if (divTexts.length > 0) {
                content = divTexts.slice(0, 5).join('\n\n');
            }
        }
        
        if (content.length < 100) return null;
        
        const title = $clean.find('h1, h2, h3').first().text().trim() || baseUrl.split('/').pop() || 'Inhalt';
        
        return {
            type: 'content',
            url: baseUrl,
            title: title,
            content: content,
            plain_text: content,
            source: baseUrl,
            sectionType: 'fallback'
        };
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}

module.exports = WebCrawler;

