# 🚨 IMMEDIATE CORS FIX - Step by Step

## Problem Identified

The error shows your Vercel environment variable includes `/api` suffix:

- **Current**: `https://autoincome.theretirementpaycheck.com/api`
- **Should be**: `https://autoincome.theretirementpaycheck.com`

## ✅ IMMEDIATE FIXES (Do These NOW)

### 1. Fix Vercel Environment Variable

```bash
# In Vercel Dashboard:
# Go to: Project Settings → Environment Variables
# Change NEXT_PUBLIC_SERVER_URL from:
https://autoincome.theretirementpaycheck.com/api
# To:
https://autoincome.theretirementpaycheck.com
```

### 2. Redeploy Frontend

After changing the environment variable, trigger a new deployment in Vercel.

### 3. Update Backend on VPS

```bash
# SSH to your VPS
ssh your-vps

# Navigate to your backend directory
cd /path/to/your/backend

# Pull latest changes (if using git)
git pull

# Or copy the updated server.js file

# Restart your backend
pm2 restart voice-agent-backend
# OR if not using PM2:
# pkill -f "node server.js"
# nohup node server.js &
```

### 4. Test CORS Fix

```bash
# Test health endpoint
curl -v https://autoincome.theretirementpaycheck.com/health

# Test CORS preflight
curl -X OPTIONS https://autoincome.theretirementpaycheck.com/start-automation \
  -H "Origin: https://voice-agent-elevenlab.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

## 🔧 Backend Changes Made

1. ✅ Enhanced CORS configuration
2. ✅ Added explicit OPTIONS handler
3. ✅ Added debug logging
4. ✅ Fixed endpoint from `/api/startautomation` to `/start-automation`

## 🌐 Frontend Changes Made

1. ✅ Auto-removal of `/api` suffix from environment variable
2. ✅ Better error handling
3. ✅ 10-minute timeout for automation

## 🧪 Expected Result

After these fixes:

- ✅ No more CORS errors
- ✅ Correct URL: `https://autoincome.theretirementpaycheck.com/start-automation`
- ✅ 10-minute timeout for browser automation
- ✅ Proper error messages

## 🚨 If Still Not Working

### Check VPS Backend Logs

```bash
# If using PM2
pm2 logs voice-agent-backend

# If running directly
tail -f /path/to/your/backend/logs
```

### Verify Domain & SSL

```bash
# Check if domain resolves
nslookup autoincome.theretirementpaycheck.com

# Check SSL certificate
curl -I https://autoincome.theretirementpaycheck.com/health
```

### Test Backend Directly

```bash
# Test on VPS locally first
curl http://localhost:3001/health

# Then test via domain
curl https://autoincome.theretirementpaycheck.com/health
```

## 📞 Support Commands

```bash
# Check if backend is running
ps aux | grep node

# Check open ports
sudo netstat -tlpn | grep 3001

# Check Nginx status
sudo systemctl status nginx

# Check firewall
sudo ufw status
```
