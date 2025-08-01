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

IMPORTANT RULES:
1. NEVER repeat the exact same question or response
2. If user already provided some information, don't ask for it again
3. Keep responses concise and varied
4. Acknowledge user's answers before asking the next question
5. If an answer is unclear, ask for clarification naturally

CONVERSATION FLOW:
1. INTRODUCTION (only if no prior conversation):
"Hi there this is Mark, who am I speaking with?"

2. AFTER GETTING NAME (only if starting fresh):
"Nice to meet you [First name]. I'll help you plan for retirement by asking a few quick questions."

3. DATA COLLECTION:
- Ask for missing information one at a time
- Vary your questions naturally
- Acknowledge previous answers
- Use the person's name occasionally

4. CLOSING (only after getting all 3 pieces of information):
"Perfect! I have all the information I need. Let me show you what I've collected..."

EXAMPLE VARIATIONS FOR QUESTIONS:
Birthday:
- "What's your birthday?"
- "Could you tell me your date of birth?"
- "When were you born?"

Retirement Date:
- "When do you plan to retire?"
- "At what age would you like to retire?"
- "What's your target retirement age?"

Savings:
- "How much have you saved for retirement so far?"
- "What's your current retirement savings?"
- "Could you share your retirement savings amount?"

Remember: Each response should be unique and contextual to the conversation.`;

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
    let messages = []

    // If conversation exists but extractedData is empty, something went wrong
    // Start fresh but don't repeat the greeting
    if (conversationHistory.length > 0 && Object.keys(extractedData).length === 0) {
      messages = [
        { 
          role: 'system', 
          content: 'Continue the retirement planning conversation naturally. Do not start over or repeat the greeting.' 
        }
      ]
    } else {
      messages = [
        { role: 'system', content: CONVERSATION_SYSTEM_PROMPT }
      ]
    }

    // Add conversation history
    conversationHistory.forEach(msg => {
      messages.push({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })
    })

    // Add current user message
    messages.push({ role: 'user', content: userMessage })

    // Add context about what data we already have
    if (Object.keys(extractedData).length > 0) {
      const dataContext = `Current extracted data: ${JSON.stringify(extractedData, null, 2)}`;
      messages.push({
        role: 'system',
        content: `${dataContext}\n\nUse this information to guide the conversation. Only ask for missing data. Vary your questions and responses.`
      })
    }

    // Get AI response with higher temperature for more variation
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: messages,
      max_tokens: 200,
      temperature: 0.8, // Increased for more variation
      presence_penalty: 0.6, // Penalize repeating the same content
      frequency_penalty: 0.6, // Encourage word choice variation
    })

    return response.choices[0].message.content
  } catch (error) {
    console.error('Error generating conversation response:', error)
    throw new Error('Failed to generate AI response')
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
      .join('\n') + `\nuser: ${userMessage}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: DATA_EXTRACTION_PROMPT },
        { role: 'user', content: fullConversation }
      ],
      max_tokens: 300,
      temperature: 0.1,
      response_format: { type: "json_object" }
    })

    const extractedData = JSON.parse(response.choices[0].message.content)
    return extractedData
  } catch (error) {
    console.error('Error extracting data:', error)
    return {}
  }
}

module.exports = {
  generateConversationResponse,
  extractDataFromConversation
}; 