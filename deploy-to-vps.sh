#!/bin/bash

# 🚀 VPS Deployment Script for Voice Agent Backend
# Run this script on your Ubuntu VPS

echo "🖥️ Starting VPS deployment for Voice Agent Backend..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# 1. Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js (if not installed)
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    print_status "Node.js already installed: $(node --version)"
fi

# 3. Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    sudo npm install -g pm2
else
    print_status "PM2 already installed: $(pm2 --version)"
fi

# 4. Install Nginx
if ! command -v nginx &> /dev/null; then
    print_status "Installing Nginx..."
    sudo apt install -y nginx
else
    print_status "Nginx already installed"
fi

# 5. Configure firewall
print_status "Configuring firewall..."
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 3001/tcp    # Backend port
sudo ufw --force enable

# 6. Install Certbot for SSL
if ! command -v certbot &> /dev/null; then
    print_status "Installing Certbot..."
    sudo apt install -y certbot python3-certbot-nginx
else
    print_status "Certbot already installed"
fi

# 7. Create application directory
APP_DIR="/var/www/voice-agent-backend"
print_status "Creating application directory: $APP_DIR"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# 8. Set up environment variables
print_status "Setting up environment variables..."
cat > $APP_DIR/.env << EOF
NODE_ENV=production
PORT=3001
# Add your API keys here:
# OPENAI_API_KEY=your_openai_key_here
# DEEPGRAM_API_KEY=your_deepgram_key_here
# ELEVENLABS_API_KEY=your_elevenlabs_key_here
EOF

print_warning "Please edit $APP_DIR/.env and add your API keys!"

# 9. Create Nginx configuration
print_status "Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/voice-agent << EOF
server {
    listen 80;
    server_name autoincome.theretirementpaycheck.com;
    
    # Redirect HTTP to HTTPS (will be configured after SSL setup)
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name autoincome.theretirementpaycheck.com;
    
    # SSL certificates (will be configured by certbot)
    # ssl_certificate /etc/letsencrypt/live/autoincome.theretirementpaycheck.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/autoincome.theretirementpaycheck.com/privkey.pem;
    
    # CORS headers
    add_header Access-Control-Allow-Origin "https://voice-agent-elevenlab.vercel.app" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With" always;
    add_header Access-Control-Allow-Credentials "true" always;
    
    # Handle preflight requests
    if (\$request_method = 'OPTIONS') {
        add_header Access-Control-Allow-Origin "https://voice-agent-elevenlab.vercel.app";
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With";
        add_header Access-Control-Allow-Credentials "true";
        add_header Content-Length 0;
        add_header Content-Type text/plain;
        return 204;
    }
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Increase timeout for automation requests
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
        
        # Buffer settings for large responses
        proxy_buffering off;
        proxy_buffer_size 128k;
        proxy_buffers 100 128k;
    }
}
EOF

# 10. Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/voice-agent /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

print_status "VPS setup completed!"
print_warning "Next steps:"
echo "1. Copy your backend code to: $APP_DIR"
echo "2. Run: cd $APP_DIR && npm install"
echo "3. Edit $APP_DIR/.env with your API keys"
echo "4. Get SSL certificate: sudo certbot --nginx -d autoincome.theretirementpaycheck.com"
echo "5. Start with PM2: pm2 start server.js --name voice-agent-backend"
echo "6. Save PM2 config: pm2 save && pm2 startup"

print_status "Test your setup:"
echo "curl http://localhost:3001/health"
echo "curl https://autoincome.theretirementpaycheck.com/health"
EOF