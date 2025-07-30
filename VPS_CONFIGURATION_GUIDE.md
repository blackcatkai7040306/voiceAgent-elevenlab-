# 🖥️ Ubuntu VPS Configuration Guide for Voice Agent Backend

## 🚨 Current Issue Fixed

- ✅ **API Endpoint**: Fixed `/api/startautomation` → `/start-automation`
- ✅ **Timeout**: Increased from 60s → 10 minutes for browser automation
- ✅ **Error Handling**: Improved backend timeout and error responses

## 🔧 VPS Configuration Requirements

### 1. **Firewall Configuration**

```bash
# Allow HTTP and HTTPS traffic
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3001/tcp  # Your backend port

# Check firewall status
sudo ufw status
```

### 2. **SSL Certificate (Required for HTTPS)**

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate for your domain
sudo certbot --nginx -d autoincome.theretirementpaycheck.com

# Auto-renewal (add to crontab)
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. **Nginx Configuration** (Recommended)

```nginx
# /etc/nginx/sites-available/voiceagent
server {
    listen 443 ssl;
    server_name autoincome.theretirementpaycheck.com;

    ssl_certificate /etc/letsencrypt/live/autoincome.theretirementpaycheck.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/autoincome.theretirementpaycheck.com/privkey.pem;

    # CORS headers
    add_header Access-Control-Allow-Origin "https://voice-agent-elevenlab.vercel.app" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
    add_header Access-Control-Allow-Credentials "true" always;

    # Handle preflight requests
    if ($request_method = 'OPTIONS') {
        return 204;
    }

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase timeout for automation requests
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name autoincome.theretirementpaycheck.com;
    return 301 https://$server_name$request_uri;
}
```

### 4. **Process Management with PM2**

```bash
# Install PM2
npm install -g pm2

# Start your backend with PM2
cd /path/to/your/backend
pm2 start server.js --name "voice-agent-backend"

# Save PM2 configuration
pm2 save
pm2 startup

# Monitor
pm2 status
pm2 logs voice-agent-backend
```

### 5. **Environment Variables on VPS**

```bash
# Create .env file in backend directory
cat > .env << EOF
NODE_ENV=production
PORT=3001
OPENAI_API_KEY=your_openai_key
DEEPGRAM_API_KEY=your_deepgram_key
ELEVENLABS_API_KEY=your_elevenlabs_key
EOF
```

## 🧪 Testing Commands

### Test Backend Directly

```bash
# Test health endpoint
curl https://autoincome.theretirementpaycheck.com/health

# Test with verbose output
curl -v https://autoincome.theretirementpaycheck.com/health

# Test automation endpoint (POST)
curl -X POST https://autoincome.theretirementpaycheck.com/start-automation \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Check Logs

```bash
# Backend logs
pm2 logs voice-agent-backend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
journalctl -u nginx -f
```

## 🔍 Troubleshooting

### Common Issues:

1. **Port 3001 blocked**: Add firewall rule
2. **SSL certificate expired**: Run `sudo certbot renew`
3. **CORS still failing**: Check Nginx CORS headers
4. **Backend not starting**: Check PM2 logs and environment variables

### Debug Steps:

1. Test health endpoint first
2. Check if backend is running: `pm2 status`
3. Verify SSL certificate: `sudo certbot certificates`
4. Test CORS with browser developer tools

## ✅ Success Checklist

- [ ] Backend running on port 3001
- [ ] SSL certificate installed and valid
- [ ] Firewall allows traffic on ports 80, 443, 3001
- [ ] Nginx configured with CORS headers
- [ ] PM2 managing backend process
- [ ] Health endpoint returns 200 OK
- [ ] CORS preflight requests work
- [ ] Automation endpoint accepts POST requests
