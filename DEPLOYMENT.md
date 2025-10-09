# KAYA-Bot für Landkreis Oldenburg

## 🚀 Deployment auf kaya.wattweiser.com

### Railway Deployment (Empfohlen)

1. **Railway Account erstellen:**
   - Gehe zu https://railway.app
   - Melde dich mit GitHub an

2. **Repository erstellen:**
   ```bash
   git init
   git add .
   git commit -m "Initial KAYA deployment"
   git branch -M main
   git remote add origin https://github.com/yourusername/kaya-bot.git
   git push -u origin main
   ```

3. **Railway Projekt erstellen:**
   - "New Project" → "Deploy from GitHub repo"
   - Repository auswählen
   - Auto-Deploy aktivieren

4. **Environment Variables setzen:**
   ```
   OPENAI_API_KEY=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
   ELEVENLABS_API_KEY=otF9rqKzRHFgfwf6serQ
   USE_LLM=true
   NODE_ENV=production
   PORT=3002
   ```

5. **Custom Domain hinzufügen:**
   - Railway Dashboard → Settings → Domains
   - "Add Domain" → kaya.wattweiser.com
   - DNS-Records von Railway kopieren

### DNS-Konfiguration bei United-Domains

**CNAME Record:**
```
Name: kaya
Type: CNAME
Value: [Railway-provided-domain]
TTL: 300
```

**Oder A Record:**
```
Name: kaya
Type: A
Value: [Railway-IP-Adresse]
TTL: 300
```

### Alternative: Vercel Deployment

1. **Vercel Account:**
   - https://vercel.com
   - GitHub verbinden

2. **Deploy:**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

3. **Custom Domain:**
   - Vercel Dashboard → Domains
   - kaya.wattweiser.com hinzufügen

### Alternative: Docker + VPS

1. **Docker Container erstellen:**
   ```bash
   docker build -t kaya-bot .
   docker run -d -p 80:3002 --name kaya kaya-bot
   ```

2. **Nginx Reverse Proxy:**
   ```nginx
   server {
       listen 80;
       server_name kaya.wattweiser.com;
       
       location / {
           proxy_pass http://localhost:3002;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

3. **SSL mit Let's Encrypt:**
   ```bash
   certbot --nginx -d kaya.wattweiser.com
   ```

## 🔧 Produktions-Konfiguration

### Environment Variables für Produktion:
```bash
NODE_ENV=production
PORT=3002
USE_LLM=true
OPENAI_API_KEY=sk-proj-...
ELEVENLABS_API_KEY=otF9rqKzRHFgfwf6serQ
CORS_ORIGIN=https://kaya.wattweiser.com
```

### Monitoring & Logging:
- Railway: Automatisches Monitoring
- Vercel: Built-in Analytics
- Docker: Logs mit `docker logs kaya`

## 📊 Performance-Optimierung

### Caching:
- Redis für Session-Caching
- CDN für statische Assets
- API-Response-Caching

### Skalierung:
- Railway: Auto-Scaling
- Vercel: Serverless-Scaling
- Docker: Load-Balancer

## 🔒 Sicherheit

### API-Security:
- Rate-Limiting
- CORS-Konfiguration
- Input-Validation

### SSL/TLS:
- Automatische SSL-Zertifikate
- HTTPS-Redirect
- HSTS-Header

## 📈 Monitoring

### Health-Check:
```
GET https://kaya.wattweiser.com/health
```

### Metrics:
- Response-Time
- Error-Rate
- API-Usage
- LLM-Costs

## 🎯 Empfehlung

**Für schnelles Deployment:** Railway
**Für maximale Performance:** Vercel
**Für vollständige Kontrolle:** Docker + VPS

Alle Optionen unterstützen:
- ✅ Custom Domain (kaya.wattweiser.com)
- ✅ SSL-Zertifikate
- ✅ Auto-Deployment
- ✅ Monitoring
- ✅ Skalierung





