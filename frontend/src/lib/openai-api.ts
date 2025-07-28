import axios from "axios"
import { ConversationMessage, ExtractedUserData } from "@/types/voiceAgent"

const API_BASE_URL = "http://localhost:3001/api"

// API client instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for AI responses
  headers: {
    "Content-Type": "application/json",
  },
})

export interface ConversationResponse {
  success: boolean
  aiResponse: string
  extractedData: ExtractedUserData
  followUpQuestions: string[]
  timestamp: string
  error?: string
}

export interface DataExtractionResponse {
  success: boolean
  extractedData: ExtractedUserData
  timestamp: string
  error?: string
}

export interface FollowUpQuestionsResponse {
  success: boolean
  questions: string[]
  timestamp: string
  error?: string
}

/**
 * Generate AI conversation response using OpenAI
 */
export async function generateConversationResponse(
  userMessage: string,
  conversationHistory: ConversationMessage[] = [],
  extractedData: ExtractedUserData = {}
): Promise<ConversationResponse> {
  try {
    const response = await apiClient.post<ConversationResponse>(
      "/conversation",
      {
        userMessage,
        conversationHistory,
        extractedData,
      }
    )

    return response.data
  } catch (error) {
    console.error("Error calling conversation API:", error)
    throw new Error(
      axios.isAxiosError(error) && error.response?.data?.error
        ? error.response.data.error
        : "Failed to generate conversation response"
    )
  }
}

/**
 * Extract structured data from conversation using OpenAI
 */
export async function extractDataFromConversation(
  userMessage: string,
  conversationHistory: ConversationMessage[] = []
): Promise<DataExtractionResponse> {
  try {
    const response = await apiClient.post<DataExtractionResponse>(
      "/extract-data",
      {
        userMessage,
        conversationHistory,
      }
    )

    return response.data
  } catch (error) {
    console.error("Error calling data extraction API:", error)
    throw new Error(
      axios.isAxiosError(error) && error.response?.data?.error
        ? error.response.data.error
        : "Failed to extract data from conversation"
    )
  }
}

/**
 * Generate follow-up questions to encourage more information sharing
 */
export async function generateFollowUpQuestions(
  extractedData: ExtractedUserData = {},
  conversationHistory: ConversationMessage[] = []
): Promise<FollowUpQuestionsResponse> {
  try {
    const response = await apiClient.post<FollowUpQuestionsResponse>(
      "/follow-up-questions",
      {
        extractedData,
        conversationHistory,
      }
    )

    return response.data
  } catch (error) {
    console.error("Error calling follow-up questions API:", error)
    throw new Error(
      axios.isAxiosError(error) && error.response?.data?.error
        ? error.response.data.error
        : "Failed to generate follow-up questions"
    )
  }
}

/**
 * Test connection to OpenAI API
 */
export async function testOpenAIConnection(): Promise<boolean> {
  try {
    const response = await generateConversationResponse(
      "Hello, this is a test message.",
      [],
      {}
    )
    return response.success
  } catch (error) {
    console.error("OpenAI connection test failed:", error)
    return false
  }
}
