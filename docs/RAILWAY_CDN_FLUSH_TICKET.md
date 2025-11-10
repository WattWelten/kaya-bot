# Railway CDN Flush Support Ticket

## Subject
CDN Cache not invalidating after deployment - need manual purge for Metal Edge CDN

## Details

**Project:** kaya-bot / kaya-frontend  
**Service:** kaya-bot (Frontend)  
**Domain:** app.kaya.wattweiser.com  
**Environment:** Production

## Problem Description

After multiple deployments with new build hashes, the production URL `app.kaya.wattweiser.com` continues to serve an outdated `index.html` file that references old JavaScript assets (`index-f609b524.js`).

**Expected behavior:**
- New deployment should invalidate CDN cache
- `index.html` should reference new hashed assets
- Browser should load updated JavaScript files

**Current behavior:**
- Railway build logs show correct new build: `index-e4122021.js`
- Production URL serves old `index-f609b524.js`
- Browser devtools confirm cached version is being served

## Troubleshooting Already Performed

1. ✅ Multiple redeployments triggered
2. ✅ `NO_CACHE=1` environment variable set
3. ✅ Domain removed and re-added
4. ✅ Service recreated from scratch
5. ✅ Git commits pushed (latest: `ea7e64ff`)
6. ✅ Browser cache cleared, incognito mode tested
7. ✅ Service Worker checked (not the issue)

## Evidence

**Build Logs (Railway Dashboard):**
```
dist/assets/index-e4122021.js           1.82 kB
dist/assets/AvatarCanvas-c089f132.js  870.89 kB
```
✅ Build is correct with new hash

**Production Test (app.kaya.wattweiser.com):**
```
Hash found: f609b524 (OLD!)
Unity code still present
Three.js code not found
```
❌ Production serves old cached version

## Request

Please manually purge the **Metal Edge CDN cache** for:
- Domain: `app.kaya.wattweiser.com`
- Path: `/` (root)
- All files under `/assets/*`

After cache purge, I expect the new deployment (`index-e4122021.js`) to be served correctly.

## Deployment Information

**Latest Deployment:** `36fbec20`  
**Build Date:** Oct 27, 2025, 1:55 PM  
**Region:** EU West (Amsterdam, Netherlands)  
**Build Hash:** ea7e64ff

## Contact Information

Please respond via Railway dashboard or confirm when cache has been purged.

---

Thank you for your assistance!

