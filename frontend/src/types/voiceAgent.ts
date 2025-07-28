export interface ExtractedUserData {
  dateOfBirth?: string
  age?: number
  retirementAge?: number
  longevityEstimate?: number | string
  currentIncome?: number | string
  monthlyExpenses?: number | string
  currentSavings?: number | string
  investmentAmount?: number
  investmentGoals?: string
  riskTolerance?: string
  familyStatus?: string
  dependents?: number | string
  healthFactors?: string
  additionalInfo?: {
    [key: string]: any
  }
}

export interface VoiceAgentProps {
  onDataExtracted: (data: ExtractedUserData) => void
  onConversationUpdate: (conversation: string[]) => void
  isRecording: boolean
  setIsRecording: (recording: boolean) => void
}

export interface UserDataExtractorProps {
  extractedData: ExtractedUserData
  conversation: string[]
  isDataComplete: boolean
  onSendToAutomation: () => void
}

export interface DeepgramConfig {
  apiKey: string
  model: string
  language: string
  punctuate: boolean
  interim_results: boolean
}

export interface ElevenLabsConfig {
  apiKey: string
  voiceId: string
  model: string
  voice_settings: {
    stability: number
    similarity_boost: number
  }
}

export interface ConversationMessage {
  type: "user" | "assistant"
  content: string
  timestamp: Date
  audioUrl?: string
}

export interface VoiceProcessingResult {
  transcript: string
  extractedData: Partial<ExtractedUserData>
  confidence: number
}
