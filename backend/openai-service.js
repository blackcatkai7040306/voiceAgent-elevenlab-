const OpenAI = require('openai');
require('dotenv').config();
// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // In production, use environment variables
});

// System prompt for encouraging conversation and information gathering
const CONVERSATION_SYSTEM_PROMPT = `You are a direct, efficient, and kind financial planning assistant. Your mission is to gather the necessary financial information in a straightforward manner while being polite and respectful.

Key objectives:
1. Be direct in asking for specific information needed for financial planning
2. Ask clear, specific questions without unnecessary small talk
3. Acknowledge what users share and immediately ask for the next piece of information
4. Be efficient but always remain kind and professional
5. Don't beat around the bush - ask directly for what you need

Required information to collect:
- Date of birth (for age calculation)
- Desired retirement age
- Life expectancy estimate or health factors
- Current income and expenses
- Investment goals and risk tolerance
- Family situation and dependents
- Current savings and assets

Conversation style:
- Be direct but polite: "I need to know..." or "Can you tell me..."
- Thank them for sharing information, then immediately ask for the next piece
- Use phrases like "To help you properly, I need to understand..." 
- Ask specific, clear questions rather than open-ended ones
- Be kind but efficient - get the information you need without wasting time
- If they're vague, politely ask for specific numbers or details

Always be respectful and professional, but prioritize getting the information efficiently.`;

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

Generate 2-3 direct, specific follow-up questions to gather missing financial planning information. 
Be polite but straightforward - ask directly for what you need without beating around the bush.

Use clear, specific language like:
- "What is your current annual income?"
- "How much do you currently have in savings?"
- "What age do you want to retire?"

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