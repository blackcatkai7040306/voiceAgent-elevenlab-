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

  const calculateAge = (birthday: string): number => {
    try {
      const birthDate = new Date(birthday)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--
      }

      return age
    } catch {
      return 0
    }
  }

  const calculateRetirementAge = (
    birthday: string,
    retirementDate: string
  ): number => {
    try {
      const birthDate = new Date(birthday)
      const retireDate = new Date(retirementDate)
      let retirementAge = retireDate.getFullYear() - birthDate.getFullYear()
      const monthDiff = retireDate.getMonth() - birthDate.getMonth()

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && retireDate.getDate() < birthDate.getDate())
      ) {
        retirementAge--
      }

      return retirementAge
    } catch {
      return 65 // Default retirement age
    }
  }

  const formatRetirementDate = (retirementDate: string): string => {
    try {
      // If user provided just a year or age, format it properly
      if (/^\d{4}$/.test(retirementDate)) {
        // Just a year provided, set to January 1st
        return `01/01/${retirementDate}`
      }

      if (/^\d{2}$/.test(retirementDate)) {
        // Just age provided, calculate year
        const currentYear = new Date().getFullYear()
        const targetYear =
          currentYear +
          parseInt(retirementDate) -
          calculateAge(extractedData.dateOfBirth || "")
        return `01/01/${targetYear}`
      }

      // Try to parse existing date
      const date = new Date(retirementDate)
      if (isNaN(date.getTime())) {
        // If parsing fails, try to extract year and default to January
        const yearMatch = retirementDate.match(/\d{4}/)
        if (yearMatch) {
          return `01/01/${yearMatch[0]}`
        }
        return `01/01/${new Date().getFullYear() + 30}` // Default 30 years from now
      }

      // If month is missing, default to January
      const month = date.getMonth() + 1
      const day = date.getDate()
      const year = date.getFullYear()

      return `${month.toString().padStart(2, "0")}/${day
        .toString()
        .padStart(2, "0")}/${year}`
    } catch {
      return `01/01/${new Date().getFullYear() + 30}`
    }
  }

  const handleSendToAutomation = () => {
    const birthday = extractedData.dateOfBirth || ""
    const retirementDate = formatRetirementDate(
      extractedData.retirementDate || ""
    )
    const savedAmount = extractedData.currentRetirementSavings?.toString() || ""

    // Calculate derived values
    const age = calculateAge(birthday)
    const retirementAge = calculateRetirementAge(birthday, retirementDate)

    // Navigate to main automation page with all required data
    const params = new URLSearchParams({
      // For display in UI
      birthday: birthday,
      retirementDate: retirementDate,
      savedAmount: savedAmount,
      age: age.toString(),

      // For automation process (internal use)
      retirementAge: retirementAge.toString(),
      longevityEstimate: "100", // Default value
      investmentAmount: savedAmount, // Same as saved amount
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
                The agent will extract your Date of Birth, Retirement Date, and
                Saved Amount for Retirement
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
                was born on July 1st, 1967. I'd like to retire in January 2030
                and I have saved $130,000 for retirement so far."
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
