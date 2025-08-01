const OpenAI = require('openai');
require('dotenv').config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Track last question asked per session
const sessionQuestions = new Map();

// System prompt for retirement data collection
const CONVERSATION_SYSTEM_PROMPT = `You are Mark, a friendly and professional retirement planning specialist. Your goal is to collect three specific pieces of information from the user:

1. Birthday/Date of birth
2. Retirement date (when they want to retire)
3. Current retirement savings amount

CRITICAL RULES:
1. NEVER repeat yourself or ask the same question twice
2. NEVER ask for information that was already provided
3. Keep responses SHORT and FOCUSED - one clear question at a time
4. Briefly acknowledge what you understood, then ask for the next piece of information
5. If you don't understand an answer, ask for clarification ONCE, then move on
6. Do not add unnecessary conversation or small talk

CONVERSATION FLOW:
1. FIRST INTERACTION ONLY:
"Hi there this is Mark, who am I speaking with?"

2. AFTER GETTING NAME (FIRST TIME ONLY):
"Nice to meet you [Name]. I need three quick pieces of information for your retirement planning."

3. DATA COLLECTION (ONE AT A TIME):
- Ask for ONE missing piece of information
- Acknowledge what was provided
- Move to the next missing piece
- If an answer is unclear, ask for clarification ONCE

4. AFTER GETTING ALL INFO:
"Perfect! I have everything I need: your birth date [DATE], retirement age [AGE], and savings of [AMOUNT]."

EXAMPLE GOOD RESPONSES:
- "I see you were born in 1980. When would you like to retire?"
- "Got it, retiring at 65. How much have you saved for retirement so far?"
- "I understand you have $250,000 saved. What's your date of birth?"

EXAMPLE BAD RESPONSES (DON'T DO THESE):
- Repeating the same question
- Asking for multiple pieces of information at once
- Adding unnecessary conversation
- Not acknowledging received information

Remember: Be direct, clear, and never repeat yourself.`;

// Data extraction prompt for structured output
const DATA_EXTRACTION_PROMPT = `Analyze the conversation and extract retirement planning data mentioned. 

Extract and return JSON with these fields (only include fields with actual data):
{
  "firstName": "user's first name if mentioned",
  "dateOfBirth": "MM/DD/YYYY format or descriptive date",
  "retirementDate": "retirement age, year, or descriptive timing (e.g., '65', '2030', 'in 5 years', 'age 62')",
  "currentRetirementSavings": "dollar amount saved for retirement"
}

For retirementDate, prioritize these formats:
- If user mentions age: use just the number (e.g., "65")
- If user mentions year: use just the year (e.g., "2030") 
- If user mentions "in X years": use that format (e.g., "in 5 years")
- If user mentions specific date: use MM/DD/YYYY format

Only include fields where actual data was provided. Return empty object {} if no data found.`;

/**
 * Generate conversational AI response that encourages information sharing
 */
async function generateConversationResponse(userMessage, conversationHistory = [], extractedData = {}, sessionId = null) {
  try {
    // Build conversation context
    let messages = [
      { role: 'system', content: CONVERSATION_SYSTEM_PROMPT }
    ];

    // Add conversation history
    conversationHistory.forEach(msg => {
      messages.push({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });

    // Add current user message
    messages.push({ role: 'user', content: userMessage });

    // Track missing fields and last question
    const missingFields = [];
    if (!extractedData.dateOfBirth) missingFields.push('date of birth');
    if (!extractedData.retirementDate) missingFields.push('retirement date/age');
    if (!extractedData.currentRetirementSavings) missingFields.push('current retirement savings');

    // Get last question asked for this session
    let lastQuestion = sessionId ? sessionQuestions.get(sessionId) : null;

    // Add context about what data we already have and what was last asked
    const dataContext = `
Current data:
${JSON.stringify(extractedData, null, 2)}

Missing information: ${missingFields.join(', ')}
${lastQuestion ? `Last question asked was about: ${lastQuestion}` : ''}

STRICT RULES:
1. If a field is already in "Current data", DO NOT ask for it again
2. If the last question was about "${lastQuestion}", DO NOT ask about it again unless the answer was unclear
3. Pick ONE missing field that hasn't been asked about recently
4. Keep response under 50 words
5. Must acknowledge any new information before asking next question
6. If all data is collected, just confirm the information`;

    messages.push({
      role: 'system',
      content: dataContext
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: messages,
      max_tokens: 100, // Even shorter responses
      temperature: 0.7,
      presence_penalty: 1.0, // Maximum penalty for repetition
      frequency_penalty: 1.0, // Maximum penalty for repetition
    });

    const aiResponse = response.choices[0].message.content;

    // Update last question asked based on the response
    if (sessionId) {
      let newQuestion = null;
      if (aiResponse.includes('birth')) newQuestion = 'date of birth';
      else if (aiResponse.includes('retire')) newQuestion = 'retirement date/age';
      else if (aiResponse.includes('save') || aiResponse.includes('savings')) newQuestion = 'current retirement savings';
      
      if (newQuestion) {
        sessionQuestions.set(sessionId, newQuestion);
      }
    }

    return aiResponse;
  } catch (error) {
    console.error('Error generating conversation response:', error);
    throw new Error('Failed to generate AI response');
  }
}

/**
 * Extract structured data from conversation using OpenAI
 */
async function extractDataFromConversation(userMessage, conversationHistory = []) {
  try {
    // Combine all conversation text
    const fullConversation = conversationHistory
      .map(msg => `${msg.type}: ${msg.content}`)
      .join('\n') + `\nuser: ${userMessage}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: DATA_EXTRACTION_PROMPT },
        { role: 'user', content: fullConversation }
      ],
      max_tokens: 150,
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const extractedData = JSON.parse(response.choices[0].message.content);
    return extractedData;
  } catch (error) {
    console.error('Error extracting data:', error);
    return {};
  }
}

// Clean up old session data periodically
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, timestamp] of sessionQuestions.entries()) {
    if (now - timestamp > 30 * 60 * 1000) { // 30 minutes
      sessionQuestions.delete(sessionId);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

module.exports = {
  generateConversationResponse,
  extractDataFromConversation
}; 