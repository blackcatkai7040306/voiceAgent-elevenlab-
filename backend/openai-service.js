const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '', // In production, use environment variables
});

// System prompt for encouraging conversation and information gathering
const CONVERSATION_SYSTEM_PROMPT = `You are an empathetic and engaging financial planning assistant. Your mission is to naturally encourage users to share their personal financial information while maintaining a warm, conversational tone.

Key objectives:
1. Make users feel comfortable sharing personal information
2. Ask follow-up questions that feel natural and show genuine interest
3. Share relatable examples or scenarios to encourage openness
4. Acknowledge and validate what users share
5. Gradually guide conversation toward gathering all needed data

Required information to collect:
- Date of birth (for age calculation)
- Desired retirement age
- Life expectancy estimate or health factors
- Current income and expenses
- Investment goals and risk tolerance
- Family situation and dependents
- Current savings and assets

Conversation style:
- Be warm, understanding, and conversational
- Use personal anecdotes or general examples when appropriate
- Ask one question at a time to avoid overwhelming
- Show curiosity about their situation
- Validate their concerns and goals
- Make the conversation feel collaborative, not interrogative

Always respond in a natural, human-like way that encourages continued sharing.`;

// Data extraction prompt for structured output
const DATA_EXTRACTION_PROMPT = `Analyze the conversation and extract any financial planning data mentioned. 

Extract and return JSON with these fields (only include fields with actual data):
{
  "dateOfBirth": "MM/DD/YYYY or descriptive date",
  "age": "number if mentioned",
  "retirementAge": "number",
  "longevityEstimate": "number or health description",
  "currentIncome": "number or range",
  "monthlyExpenses": "number or range",
  "currentSavings": "number or range",
  "investmentGoals": "description",
  "riskTolerance": "low/medium/high or description",
  "familyStatus": "description",
  "dependents": "number or description",
  "healthFactors": "description affecting longevity",
  "additionalInfo": "any other relevant financial details"
}

Only include fields where actual data was provided. Return empty object {} if no data found.`;

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
      max_tokens: 300,
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
      max_tokens: 500,
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

/**
 * Generate follow-up questions to encourage more information sharing
 */
async function generateFollowUpQuestions(extractedData = {}, conversationHistory = []) {
  try {
    const missingDataPrompt = `Based on the extracted data: ${JSON.stringify(extractedData, null, 2)}

Generate 2-3 natural, conversational follow-up questions that would help gather missing financial planning information. 
Make the questions feel like genuine interest, not an interrogation.

Return as JSON array:
["question 1", "question 2", "question 3"]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: missingDataPrompt },
        { role: 'user', content: 'Generate follow-up questions' }
      ],
      max_tokens: 200,
      temperature: 0.8,
      response_format: { type: "json_object" }
    });

    const questions = JSON.parse(response.choices[0].message.content);
    return questions.questions || [];
  } catch (error) {
    console.error('Error generating follow-up questions:', error);
    return [];
  }
}

module.exports = {
  generateConversationResponse,
  extractDataFromConversation,
  generateFollowUpQuestions
}; 