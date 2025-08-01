# Voice Agent Deployment Guide

## Overview
This is a simplified voice agent system that extracts retirement planning information using ElevenLabs (TTS), Deepgram (STT), and OpenAI (AI processing).

## Backend Deployment (Ubuntu VPS)

### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2
```

### 2. Deploy Backend
```bash
# Clone repository
git clone <your-repo-url>
cd voiceAgent-elevenlab-/backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your API keys
nano .env

# Start with PM2
pm2 start server.js --name "voice-agent-backend"
pm2 save
pm2 startup
```

### 3. Environment Variables
Create `.env` file in backend directory:
```env
PORT=3001
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
VOICE_ID=your_voice_id
DEEPGRAM_API_KEY=your_deepgram_api_key
DEEPGRAM_PROJECT_ID=your_deepgram_project_id
```

### 4. Nginx Configuration
```bash
# Install nginx
sudo apt install nginx

# Create nginx config
sudo nano /etc/nginx/sites-available/voice-agent
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

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
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/voice-agent /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Frontend Deployment (Vercel)

### 1. Environment Variables
In Vercel dashboard, add these environment variables:
```
NEXT_PUBLIC_SERVER_URL=https://your-backend-domain.com
```

### 2. Deploy to Vercel
```bash
# In frontend directory
npm run build
# Deploy using Vercel CLI or GitHub integration
```

## API Keys Required

### OpenAI
- Get API key from: https://platform.openai.com/api-keys
- Add to backend `.env`: `OPENAI_API_KEY=sk-...`

### ElevenLabs
- Get API key from: https://elevenlabs.io/
- Get Voice ID from ElevenLabs dashboard
- Add to backend `.env`: 
  ```
  ELEVENLABS_API_KEY=your_key_here
  VOICE_ID=your_voice_id_here
  ```

### Deepgram
- Get API key from: https://console.deepgram.com/
- Get Project ID from Deepgram dashboard
- Add to backend `.env`:
  ```
  DEEPGRAM_API_KEY=your_key_here
  DEEPGRAM_PROJECT_ID=your_project_id_here
  ```

## Testing

### Backend Health Check
```bash
curl https://your-backend-domain.com/health
```

### Voice Service Test
```bash
curl https://your-backend-domain.com/api/voice/test-connection
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Update CORS origins in `server.js` with your Vercel domain
2. **Audio Issues**: Check microphone permissions in browser
3. **API Errors**: Verify all API keys are correct
4. **Connection Issues**: Check firewall settings on VPS

### Logs
```bash
# View PM2 logs
pm2 logs voice-agent-backend

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Security Considerations

1. **HTTPS**: Use Let's Encrypt for SSL certificates
2. **Firewall**: Configure UFW on Ubuntu
3. **API Keys**: Never commit `.env` files to git
4. **Rate Limiting**: Consider adding rate limiting for production

## Performance Optimization

1. **PM2**: Use PM2 cluster mode for multiple processes
2. **Nginx**: Enable gzip compression
3. **Caching**: Consider Redis for session management
4. **CDN**: Use Cloudflare for static assets 