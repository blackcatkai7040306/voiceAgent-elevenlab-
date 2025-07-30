# WebSocket HTTPS/WSS Mixed Content Solution

## Problem

You're experiencing WebSocket connection issues because browsers block insecure WebSocket connections (`ws://`) when the frontend is served over HTTPS (`https://`). This is a security feature called "Mixed Content Policy".

## What I've Implemented

### 1. Enhanced Socket Connection (`frontend/src/hooks/useSocket.ts`)

- **Auto-protocol detection**: Automatically uses `wss://` for HTTPS and `ws://` for HTTP
- **Enhanced error handling**: Specific error messages for different connection issues
- **Better debugging**: Detailed console logs and error classification

### 2. Improved Status Display (`frontend/src/components/StatusIndicator.tsx`)

- **Detailed error messages**: Shows specific connection issues
- **Solution hints**: Provides guidance for common problems (CORS, timeout, mixed content)
- **Visual indicators**: Clear status display with appropriate colors

### 3. Environment Configuration

The system now supports flexible URL configuration through environment variables:

```env
# For HTTP development (default)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# For HTTPS development
NEXT_PUBLIC_SOCKET_URL=wss://localhost:3001

# For production
NEXT_PUBLIC_SOCKET_URL=wss://your-domain.com
```

## Solutions

### Option 1: Development with HTTP (Recommended for Local Dev)

**Frontend**: `http://localhost:3000`
**Backend**: `http://localhost:3001`
**WebSocket**: `ws://localhost:3001`

✅ No mixed content issues
✅ Simple setup
❌ Not suitable for production

### Option 2: Development with HTTPS

**Frontend**: `https://localhost:3000`
**Backend**: `https://localhost:3001`
**WebSocket**: `wss://localhost:3001`

✅ Production-like environment
❌ Requires SSL certificates for backend
❌ More complex setup

### Option 3: Production Deployment

**Frontend**: `https://your-domain.com`
**Backend**: `https://api.your-domain.com`
**WebSocket**: `wss://api.your-domain.com`

✅ Secure
✅ Production-ready
❌ Requires proper SSL setup

## Backend Requirements for HTTPS/WSS

If you choose Option 2 or 3, your backend needs to support HTTPS/WSS:

```javascript
// server.js modifications for HTTPS
const https = require("https")
const fs = require("fs")

// SSL certificate (for development, you can use self-signed)
const options = {
  key: fs.readFileSync("path/to/private-key.pem"),
  cert: fs.readFileSync("path/to/certificate.pem"),
}

const server = https.createServer(options, app)
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})
```

## Quick Fixes

### For Immediate Development

1. Serve your frontend over HTTP: `npm run dev` (default Next.js)
2. Keep backend on HTTP: `node server.js`
3. Use environment variable: `NEXT_PUBLIC_SOCKET_URL=http://localhost:3001`

### For Production Deployment

1. Deploy backend with SSL/TLS support
2. Use WSS URLs: `NEXT_PUBLIC_SOCKET_URL=wss://your-backend-domain.com`
3. Ensure CORS is properly configured for your frontend domain

## Testing Connection Issues

The enhanced status indicator will now show:

- ✅ **Connected**: Green status, everything working
- ❌ **Mixed Content Error**: HTTPS/WS issue with solution hints
- ❌ **CORS Error**: Backend CORS configuration issue
- ❌ **Timeout**: Backend server not reachable

## Environment Variables Reference

```env
# Basic setup (HTTP development)
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_SERVER_URL=http://localhost:3001

# HTTPS setup
NEXT_PUBLIC_API_URL=https://localhost:3001
NEXT_PUBLIC_SOCKET_URL=wss://localhost:3001
NEXT_PUBLIC_SERVER_URL=https://localhost:3001

# Production
NEXT_PUBLIC_API_URL=https://api.yoursite.com
NEXT_PUBLIC_SOCKET_URL=wss://api.yoursite.com
NEXT_PUBLIC_SERVER_URL=https://api.yoursite.com
```

The system will now automatically detect your current protocol and attempt to use the appropriate WebSocket protocol, while providing clear error messages when connections fail.
