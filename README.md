# Retirement Voice Agent

A simplified real-time voice agent that extracts retirement planning information using ElevenLabs (TTS), Deepgram (STT), and OpenAI (AI processing).

## Features

- **Real-time Voice Processing**: Uses Deepgram for speech-to-text
- **AI Conversation**: Uses OpenAI GPT-4 for natural conversation
- **Text-to-Speech**: Uses ElevenLabs for high-quality voice responses
- **Data Extraction**: Automatically extracts retirement planning information
- **Simple Interface**: Clean, focused UI for voice interaction

## Data Collected

The voice agent extracts three key pieces of retirement information:

1. **Birthday/Date of Birth**
2. **Retirement Date** (when user wants to retire)
3. **Current Retirement Savings** (amount saved for retirement)

## Quick Start

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Add your API keys to `.env`:
```env
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
VOICE_ID=your_voice_id
DEEPGRAM_API_KEY=your_deepgram_api_key
DEEPGRAM_PROJECT_ID=your_deepgram_project_id
```

5. Start the server:
```bash
npm start
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
echo "NEXT_PUBLIC_SERVER_URL=http://localhost:3001" > .env.local
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Start Conversation**: Click the microphone button to begin
2. **Speak Naturally**: Share your retirement information in conversation
3. **View Results**: See extracted data in real-time on the right panel
4. **Complete**: All three data points will show a green checkmark when collected

## Example Conversation

```
User: "Hi, I'm John. I was born on March 15th, 1980."
AI: "Nice to meet you John. When do you plan to retire?"

User: "I want to retire at age 65."
AI: "Great! How much have you saved for retirement so far?"

User: "I currently have $250,000 saved."
AI: "Perfect! I have all the information I need. Let me show you what I've collected..."
```

## API Keys Required

### OpenAI
- Get from: https://platform.openai.com/api-keys
- Used for: AI conversation and data extraction

### ElevenLabs
- Get from: https://elevenlabs.io/
- Used for: Text-to-speech conversion
- Also get Voice ID from dashboard

### Deepgram
- Get from: https://console.deepgram.com/
- Used for: Speech-to-text conversion
- Also get Project ID from dashboard

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

- **Frontend**: Deploy to Vercel
- **Backend**: Deploy to Ubuntu VPS

## Architecture

```
Frontend (Vercel) ←→ Backend (Ubuntu VPS)
                        ↓
                ┌─────────────────┐
                │   OpenAI API    │ (AI Processing)
                └─────────────────┘
                        ↓
                ┌─────────────────┐
                │  ElevenLabs API │ (Text-to-Speech)
                └─────────────────┘
                        ↓
                ┌─────────────────┐
                │  Deepgram API   │ (Speech-to-Text)
                └─────────────────┘
```

## Development

### Backend Structure
- `server.js` - Main Express server
- `openai-service.js` - AI conversation and data extraction
- `elevenlabs-service.js` - Text-to-speech conversion
- `deepgram-service.js` - Speech-to-text conversion

### Frontend Structure
- `VoiceAgent.tsx` - Main voice interaction component
- `voice-api.ts` - API communication layer
- `page.tsx` - Main application page

## Troubleshooting

### Common Issues

1. **Microphone Access**: Allow microphone permissions in browser
2. **CORS Errors**: Check backend CORS configuration
3. **API Errors**: Verify all API keys are correct
4. **Audio Issues**: Check browser audio settings

### Testing

- Backend health: `curl http://localhost:3001/health`
- Voice services: `curl http://localhost:3001/api/voice/test-connection`

## License

MIT License 