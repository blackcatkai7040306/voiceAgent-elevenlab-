const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { 
  generateConversationResponse, 
  extractDataFromConversation
} = require('./openai-service');
const {
  textToSpeech,
  testConnection: testElevenLabsConnection
} = require('./elevenlabs-service');
const {
  speechToText,
  testConnection: testDeepgramConnection
} = require('./deepgram-service');

// ============================================
// SERVER CONFIGURATION
// ============================================

const app = express();
const PORT = process.env.PORT || 3001;

// In-memory session storage (replace with Redis in production)
const sessions = new Map();

// Clean up old sessions periodically (30 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.lastAccessed > 30 * 60 * 1000) {
      sessions.delete(sessionId);
    }
  }
}, 5 * 60 * 1000);

// ============================================
// MIDDLEWARE SETUP
// ============================================

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://voice-agent-elevenlab.vercel.app',
    'https://autoincome.theretirementpaycheck.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Session-ID',
    'X-Transcription',
    'X-AI-Response',
    'X-Extracted-Data'
  ],
  exposedHeaders: [
    'X-Transcription',
    'X-AI-Response',
    'X-Extracted-Data'
  ],
  optionsSuccessStatus: 200
}));

// Add explicit OPTIONS handler for preflight requests
app.options('*', cors());

app.use(express.json());

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

// ============================================
// API ROUTES
// ============================================

// Voice Processing API - Process voice input and return voice response
app.post('/api/voice/process', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided'
      });
    }

    console.log('🎙️ Processing voice input...');
    
    const sessionId = req.headers['x-session-id'];
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    const { conversationHistory = [], extractedData = {} } = req.body;
    const parsedHistory = typeof conversationHistory === 'string' 
      ? JSON.parse(conversationHistory) 
      : conversationHistory;
    const parsedData = typeof extractedData === 'string' 
      ? JSON.parse(extractedData) 
      : extractedData;

    // Step 1: Convert speech to text using Deepgram
    const transcription = await speechToText(req.file.buffer, req.file.originalname);
    
    if (!transcription || !transcription.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Could not transcribe audio. Please try speaking more clearly.'
      });
    }

    console.log('📝 Transcription:', transcription);

    // Step 2: Generate AI response using OpenAI
    const aiResponse = await generateConversationResponse(
      transcription,
      parsedHistory,
      parsedData,
      sessionId // Pass session ID
    );

    // Step 3: Extract any new data from the conversation
    const newExtractedData = await extractDataFromConversation(
      transcription,
      parsedHistory
    );

    // Merge with existing data
    const mergedData = { ...parsedData, ...newExtractedData };

    // Step 4: Convert AI response to speech using ElevenLabs
    const audioBuffer = await textToSpeech(aiResponse);

    // Send response with audio and data
    res.set({
      'Content-Type': 'audio/mpeg',
      'X-Transcription': encodeURIComponent(transcription),
      'X-AI-Response': encodeURIComponent(aiResponse),
      'X-Extracted-Data': encodeURIComponent(JSON.stringify(mergedData)),
      'Access-Control-Expose-Headers': 'X-Transcription,X-AI-Response,X-Extracted-Data'
    });

    res.send(audioBuffer);

  } catch (error) {
    console.error('❌ Voice processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process voice input'
    });
  }
});

// Text-to-Speech API - Convert text to speech
app.post('/api/voice/text-to-speech', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    console.log('🔊 Converting text to speech:', text.substring(0, 50) + '...');

    const audioBuffer = await textToSpeech(text);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length
    });

    res.send(audioBuffer);

  } catch (error) {
    console.error('❌ Text-to-speech error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to convert text to speech'
    });
  }
});

// Voice Services Connection Test API
app.get('/api/voice/test-connection', async (req, res) => {
  try {
    console.log('🔍 Testing voice services connections...');
    
    const [deepgramConnected, elevenLabsConnected] = await Promise.all([
      testDeepgramConnection(),
      testElevenLabsConnection()
    ]);
    
    const overallConnected = deepgramConnected && elevenLabsConnected;
    
    res.json({
      success: true,
      connected: overallConnected,
      services: {
        deepgram: {
          name: 'Deepgram (STT)',
          connected: deepgramConnected
        },
        elevenlabs: {
          name: 'ElevenLabs (TTS)',
          connected: elevenLabsConnected
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Voice services connection test error:', error);
    res.status(500).json({
      success: false,
      connected: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Voice Agent Server is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// ============================================
// SERVER STARTUP
// ============================================

app.listen(PORT, () => {
  console.log(`🚀 Voice Agent Server running on http://localhost:${PORT}`);
  console.log('🎙️ Voice processing endpoints available');
  console.log('🔊 ElevenLabs TTS and Deepgram STT services ready');
}); 