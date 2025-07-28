const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const { runAutomation } = require('./automation');
const { 
  generateConversationResponse, 
  extractDataFromConversation, 
  generateFollowUpQuestions 
} = require('./openai-service');

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

app.use(cors());
app.use(express.json());

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
    console.log('Starting automation with data:', req.body);
    
    const result = await runAutomation(req.body, io);
    
    res.json({
      success: true,
      message: 'Automation completed successfully',
      result: result
    });
  } catch (error) {
    console.error('Automation error:', error);
    res.json({
      success: false,
      error: error.message
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