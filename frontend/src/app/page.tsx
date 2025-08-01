"use client"

import React, { useState } from "react"
import { Mic, MicOff, Phone, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { VoiceAgent } from "@/components/VoiceAgent"
import { ExtractedUserData } from "@/types/voiceAgent"

export default function HomePage() {
  const [isRecording, setIsRecording] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedUserData>({})
  const [conversation, setConversation] = useState<string[]>([])
  const [isDataComplete, setIsDataComplete] = useState(false)

  const handleDataExtracted = (data: ExtractedUserData) => {
    setExtractedData(data)

    // Check if all required data is present
    const isComplete =
      data.dateOfBirth && data.retirementDate && data.currentRetirementSavings
    setIsDataComplete(!!isComplete)
  }

  const handleConversationUpdate = (conversationHistory: string[]) => {
    setConversation(conversationHistory)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Phone className="w-8 h-8 text-indigo-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Retirement Voice Agent</h1>
                <p className="text-sm text-gray-600">
                  AI-powered retirement planning assistant
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Voice Agent Interface */}
          <div className="space-y-6">
            <VoiceAgent
              onDataExtracted={handleDataExtracted}
              onConversationUpdate={handleConversationUpdate}
              isRecording={isRecording}
              setIsRecording={setIsRecording}
            />
          </div>

          {/* Right Column - Extracted Data Display */}
          <div className="space-y-6">
            {/* Data Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                {isDataComplete ? (
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 mr-2 text-yellow-500" />
                )}
                Extracted Data
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="text-sm font-medium text-gray-700">First Name</span>
                  <span className="text-sm text-gray-900">
                    {extractedData.firstName || "Not provided"}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="text-sm font-medium text-gray-700">Date of Birth</span>
                  <span className="text-sm text-gray-900">
                    {extractedData.dateOfBirth || "Not provided"}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="text-sm font-medium text-gray-700">Retirement Date</span>
                  <span className="text-sm text-gray-900">
                    {extractedData.retirementDate || "Not provided"}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="text-sm font-medium text-gray-700">Current Savings</span>
                  <span className="text-sm text-gray-900">
                    {extractedData.currentRetirementSavings 
                      ? `$${extractedData.currentRetirementSavings.toLocaleString()}`
                      : "Not provided"
                    }
                  </span>
                </div>
              </div>

              {isDataComplete && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-green-800 font-medium">
                      All required data collected!
                    </span>
                  </div>
                  <p className="text-green-700 text-sm mt-1">
                    Your retirement information has been successfully extracted.
                  </p>
                </div>
              )}
            </div>

            {/* Conversation History */}
            {conversation.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Conversation History
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {conversation.map((message, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-gray-50 text-sm text-gray-700"
                    >
                      {message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            How to Use the Voice Agent
          </h3>
          <div className="prose prose-sm text-gray-600">
            <ol className="list-decimal list-inside space-y-2">
              <li>Click the microphone button to start talking with the AI assistant</li>
              <li>Share your retirement planning information naturally in conversation</li>
              <li>The agent will extract your Date of Birth, Retirement Date, and Current Savings</li>
              <li>Once all data is collected, you'll see a green checkmark indicating completion</li>
            </ol>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Example:</strong> "Hi, I'm John. I was born on March 15th, 1980. 
                I plan to retire at age 65 and I currently have $250,000 saved for retirement."
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
