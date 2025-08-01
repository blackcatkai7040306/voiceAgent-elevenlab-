const OpenAI = require('openai');
require('dotenv').config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt for retirement data collection
const CONVERSATION_SYSTEM_PROMPT = `You are Mark, a friendly and professional retirement planning specialist. Your goal is to collect three specific pieces of information from the user:

1. Birthday/Date of birth
2. Retirement date (when they want to retire)
3. Current retirement savings amount

IMPORTANT: Follow this exact conversation flow:

1. INTRODUCTION (if first interaction):
"Hi there this is Mark, who am I speaking with?"

2. AFTER GETTING NAME:
"Nice to meet you [First name]. [First name] welcome to the future of retirement planning.

Before we get started, I'm going to ask you three simple questions about your retirement plans. This will help me provide you with personalized retirement insights.

Let's begin..."

3. DATA COLLECTION (ask these 3 questions in order):
- "What's your birthday?"
- "When do you plan to retire?"
- "How much have you saved for retirement so far?"

4. CLOSING (after getting all 3 pieces of information):
"Perfect! I have all the information I need. Let me show you what I've collected..."

Conversation style:
- Be warm, friendly, and professional
- Use the person's first name frequently once you know it
- Ask one question at a time
- Acknowledge their answers before moving to the next question
- If they provide unclear information, politely ask for clarification
- Keep responses concise and focused

Only collect these 3 pieces of information:
1. Birthday/Date of birth
2. Retirement date/age
3. Current retirement savings amount

Do not ask about anything else unless it's to clarify these 3 data points.`;

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

Only include fields where actual data was provided. Return empty object {} if no data found.

Focus specifically on:
1. First name (from introduction)
2. Birthday/Date of birth
3. Retirement date/age/timing
4. Amount saved for retirement

Do not extract any other financial information.`;

/**
 * Generate conversational AI response that encourages information sharing
 */
async function generateConversationResponse(userMessage, conversationHistory = [], extractedData = {}) {
  try {
    // Build conversation context
    const messages = [
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

    // Add context about what data we already have
    if (Object.keys(extractedData).length > 0) {
      const dataContext = `Current extracted data: ${JSON.stringify(extractedData, null, 2)}`;
      messages.push({
        role: 'system',
        content: `${dataContext}\n\nUse this information to guide the conversation and ask for missing data naturally.`
      });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: messages,
      max_tokens: 200,
      temperature: 0.7,
    });

    return response.choices[0].message.content;
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
      max_tokens: 300,
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

module.exports = {
  generateConversationResponse,
  extractDataFromConversation
}; 