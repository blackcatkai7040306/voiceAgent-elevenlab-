"use client"

import React, { useState, useRef, useEffect } from "react"
import { Mic, MicOff, Phone, User, Calendar, Clock, Send } from "lucide-react"
import { VoiceAgent } from "@/components/VoiceAgent"
import { UserDataExtractor } from "@/components/UserDataExtractor"
import { ExtractedUserData } from "@/types/voiceAgent"

export default function AgentPage() {
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

  const handleSendToAutomation = () => {
    // Navigate to main automation page with extracted data
    const params = new URLSearchParams({
      birthday: extractedData.dateOfBirth || "",
      retirementDate: extractedData.retirementDate || "",
      currentRetirementSavings:
        extractedData.currentRetirementSavings?.toString() || "",
    })

    window.location.href = `/?${params.toString()}`
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
                <h1 className="text-xl font-bold text-gray-900">Voice Agent</h1>
                <p className="text-sm text-gray-600">
                  AI-powered financial planning assistant
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <a
                href="/"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back to Automation
              </a>
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
              onConversationUpdate={setConversation}
              isRecording={isRecording}
              setIsRecording={setIsRecording}
            />
          </div>

          {/* Right Column - Extracted Data & Controls */}
          <div className="space-y-6">
            <UserDataExtractor
              extractedData={extractedData}
              conversation={conversation}
              isDataComplete={isDataComplete}
              onSendToAutomation={handleSendToAutomation}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            How the Voice Agent Works
          </h3>
          <div className="prose prose-sm text-gray-600">
            <ol className="list-decimal list-inside space-y-2">
              <li>
                Click the microphone button to start talking with the AI
                assistant
              </li>
              <li>
                Share your financial planning information naturally in
                conversation
              </li>
              <li>
                The agent will extract your Date of Birth, Retirement Age, and
                Longevity Estimate
              </li>
              <li>
                Once all data is collected, you can send it to the automation
                system
              </li>
              <li>
                The automation will run the Income Conductor calculations
                automatically
              </li>
            </ol>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Example:</strong> "Hi, I'm planning for retirement. I
                was born on July 1st, 1967. I'd like to retire at 62 and I
                estimate I'll live to 100 years old."
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
