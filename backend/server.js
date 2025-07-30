const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const { runAutomation } = require('./automation');
const { 
  generateConversationResponse, 
  extractDataFromConversation, 
  generateFollowUpQuestions 
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
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = 3001;

// ============================================
// MIDDLEWARE SETUP
// ============================================

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://voice-agent-elevenlab.vercel.app',
    'https://autoincome.theretirementpaycheck.com',
    'https://theretirementpaycheck.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

// Add explicit OPTIONS handler for preflight requests
app.options('*', cors());

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path} from ${req.get('Origin') || 'unknown origin'}`);
  next();
});

app.use(express.json());

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

// ============================================
// SOCKET.IO CONNECTION HANDLING
// ============================================

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
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
      parsedData
    );

    // Step 3: Extract any new data from the conversation
    const newExtractedData = await extractDataFromConversation(
      transcription,
      parsedHistory
    );

    // Merge with existing data
    const mergedData = { ...parsedData, ...newExtractedData };

    // Step 4: Generate follow-up questions
    const followUpQuestions = await generateFollowUpQuestions(
      mergedData,
      parsedHistory
    );

    // Step 5: Convert AI response to speech using ElevenLabs
    const audioBuffer = await textToSpeech(aiResponse);

    // Send response with audio and data
    res.set({
      'Content-Type': 'audio/mpeg',
      'X-Transcription': encodeURIComponent(transcription),
      'X-AI-Response': encodeURIComponent(aiResponse),
      'X-Extracted-Data': encodeURIComponent(JSON.stringify(mergedData)),
      'X-Follow-Up-Questions': encodeURIComponent(JSON.stringify(followUpQuestions)),
      'Access-Control-Expose-Headers': 'X-Transcription,X-AI-Response,X-Extracted-Data,X-Follow-Up-Questions'
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
    
    // Test both Deepgram (STT) and ElevenLabs (TTS) connections
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

// OpenAI Conversation API
app.post('/api/conversation', async (req, res) => {
  try {
    const { userMessage, conversationHistory = [], extractedData = {} } = req.body;
    
    if (!userMessage) {
      return res.status(400).json({
        success: false,
        error: 'User message is required'
      });
    }

    console.log('Processing conversation request:', {
      message: userMessage,
      historyLength: conversationHistory.length,
      extractedDataKeys: Object.keys(extractedData)
    });

    // Generate AI response
    const aiResponse = await generateConversationResponse(
      userMessage, 
      conversationHistory, 
      extractedData
    );

    // Extract data from the conversation
    const newExtractedData = await extractDataFromConversation(
      userMessage, 
      conversationHistory
    );

    // Merge with existing data
    const mergedData = { ...extractedData, ...newExtractedData };

    // Generate follow-up questions if needed
    const followUpQuestions = await generateFollowUpQuestions(
      mergedData, 
      conversationHistory
    );

    res.json({
      success: true,
      aiResponse,
      extractedData: mergedData,
      followUpQuestions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Conversation API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process conversation'
    });
  }
});

// Data Extraction API
app.post('/api/extract-data', async (req, res) => {
  try {
    const { userMessage, conversationHistory = [] } = req.body;
    
    if (!userMessage) {
      return res.status(400).json({
        success: false,
        error: 'User message is required'
      });
    }

    const extractedData = await extractDataFromConversation(
      userMessage, 
      conversationHistory
    );

    res.json({
      success: true,
      extractedData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Data extraction API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to extract data'
    });
  }
});

// Follow-up Questions API
app.post('/api/follow-up-questions', async (req, res) => {
  try {
    const { extractedData = {}, conversationHistory = [] } = req.body;

    const questions = await generateFollowUpQuestions(
      extractedData, 
      conversationHistory
    );

    res.json({
      success: true,
      questions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Follow-up questions API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate follow-up questions'
    });
  }
});

app.post('/start-automation', async (req, res) => {
  try {
    console.log('🚀 Starting automation with data:', req.body);
    console.log('⏱️ Automation may take 5-10 minutes for browser operations...');
    
    // Set a longer timeout for this specific request
    req.setTimeout(600000); // 10 minutes
    res.setTimeout(600000); // 10 minutes
    
    const result = await runAutomation(req.body, io);
    
    console.log('✅ Automation completed successfully');
    res.json({
      success: true,
      message: 'Automation completed successfully',
      result: result
    });
  } catch (error) {
    console.error('❌ Automation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Automation failed'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// ============================================
// SERVER STARTUP
// ============================================

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('📡 Socket.IO enabled for real-time progress updates');
  console.log('🤖 Automation server ready to receive requests');
  console.log('🧠 OpenAI conversation API endpoints available');
}); 