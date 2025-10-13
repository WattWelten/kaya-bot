# KAYA Deployment Guide

## 🚀 Railway Deployment

### 1. Railway CLI installieren
```bash
npm install -g @railway/cli
```

### 2. Login
```bash
railway login
```

### 3. Backend deployen
```bash
# Neues Projekt erstellen
railway new --name kaya-backend

# Repository verbinden
railway connect

# Root Directory setzen
railway variables set RAILWAY_ROOT_DIRECTORY=server

# Deploy
railway up
```

### 4. Frontend deployen
```bash
# Neues Projekt erstellen
railway new --name kaya-frontend

# Repository verbinden
railway connect

# Root Directory setzen
railway variables set RAILWAY_ROOT_DIRECTORY=frontend

# Environment Variables setzen
railway variables set VITE_API_URL=https://kaya-backend.railway.app
railway variables set VITE_WS_URL=wss://kaya-backend.railway.app

# Deploy
railway up
```

## 🐳 Docker Deployment

### Backend
```bash
cd server
docker build -t kaya-backend .
docker run -p 3001:3001 kaya-backend
```

### Frontend
```bash
cd frontend
docker build -t kaya-frontend .
docker run -p 3000:3000 kaya-frontend
```

## 🔧 Environment Variables

### Backend
```bash
NODE_ENV=production
PORT=3001
```

### Frontend
```bash
VITE_API_URL=https://api.example.com
VITE_WS_URL=wss://api.example.com
VITE_UNITY_PATH=/unity/kaya/Build/
```

## 📊 Monitoring

### Health Checks
- Backend: `GET /health`
- Frontend: `GET /`

### Logs
```bash
# Railway
railway logs

# Docker
docker logs container-name
```

## 🔒 Sicherheit

### CORS
- Backend: CORS für Frontend-Domain
- Frontend: CSP-Header konfiguriert

### HTTPS
- Railway: Automatisch aktiviert
- Docker: Reverse Proxy erforderlich

---

**KAYA Deployment v2.0.0** - Landkreis Oldenburg 2025