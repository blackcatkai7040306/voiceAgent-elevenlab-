"use client"

import React, { useState, useEffect } from "react"
import {
  Play,
  Square,
  AlertTriangle,
  DollarSign,
  Calendar,
  Clock,
  Cake,
  User,
  MessageCircle,
} from "lucide-react"
import { AutomationStatus, AutomationFormData } from "@/types/automation"

interface VoiceExtractedData {
  firstName?: string
  dateOfBirth?: string
  retirementDate?: string
  currentRetirementSavings?: string | number
}

interface VoiceDataDisplayProps {
  onStart: (formData: AutomationFormData) => void
  onStop: () => void
  status: AutomationStatus
  isConnected: boolean
  voiceData?: VoiceExtractedData
}

export const VoiceDataDisplay: React.FC<VoiceDataDisplayProps> = ({
  onStart,
  onStop,
  status,
  isConnected,
  voiceData,
}) => {
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null)
  const [calculatedRetirementAge, setCalculatedRetirementAge] = useState<
    number | null
  >(null)
  const [displayRetirementDate, setDisplayRetirementDate] = useState<string>("")
  const [formData, setFormData] = useState<AutomationFormData>({
    description: "Income Conductor automation workflow",
    sessionId: Date.now().toString(),
    investmentAmount: "130000",
    retirementAge: "62",
    longevityEstimate: "100",
    birthday: "07/01/1967",
  })

  // Helper function to calculate age from birthday
  const calculateAge = (birthday: string): number => {
    if (!birthday) return 0
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
  }

  // Helper function to calculate retirement age from birthday and retirement date
  const calculateRetirementAge = (
    birthday: string,
    retirementDate: string
  ): number => {
    if (!birthday || !retirementDate) return 0
    const birthDate = new Date(birthday)
    const retireDate = new Date(retirementDate)
    return retireDate.getFullYear() - birthDate.getFullYear()
  }

  // Helper function to format retirement date (add January if no month specified)
  const formatRetirementDate = (retirementDate: string): string => {
    if (!retirementDate) return ""

    // If it's just a year (e.g., "2030"), add January 1st
    if (retirementDate.match(/^\d{4}$/)) {
      return `January 1, ${retirementDate}`
    }

    // If it's already a full date, format it nicely
    try {
      const date = new Date(retirementDate)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return retirementDate
    }
  }

  // Update calculations when voice data changes
  useEffect(() => {
    if (voiceData) {
      const updates: Partial<AutomationFormData> = {}

      // Set birthday and calculate age
      if (voiceData.dateOfBirth) {
        updates.birthday = voiceData.dateOfBirth
        const age = calculateAge(voiceData.dateOfBirth)
        setCalculatedAge(age)

        // Calculate retirement age if we have retirement date
        if (voiceData.retirementDate) {
          const retirementAge = calculateRetirementAge(
            voiceData.dateOfBirth,
            voiceData.retirementDate
          )
          setCalculatedRetirementAge(retirementAge)
          updates.retirementAge = retirementAge.toString()
        }
      }

      // Set investment amount (saved amount)
      if (voiceData.currentRetirementSavings) {
        const amount =
          typeof voiceData.currentRetirementSavings === "string"
            ? voiceData.currentRetirementSavings.replace(/[^0-9]/g, "")
            : voiceData.currentRetirementSavings.toString()
        updates.investmentAmount = amount
      }

      // Format and display retirement date
      if (voiceData.retirementDate) {
        setDisplayRetirementDate(formatRetirementDate(voiceData.retirementDate))
      }

      // Update form data
      setFormData((prev) => ({ ...prev, ...updates }))
    }
  }, [voiceData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (status === "running") {
      onStop()
    } else {
      onStart(formData)
    }
  }

  const isRunning = status === "running"
  const canStart = isConnected && status === "idle"
  const hasVoiceData =
    voiceData &&
    (voiceData.dateOfBirth ||
      voiceData.retirementDate ||
      voiceData.currentRetirementSavings)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Voice Agent Data
        </h3>
        <a
          href="/agent"
          className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          <MessageCircle className="w-4 h-4 mr-1" />
          Start Voice Chat
        </a>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Voice Extracted Data Display */}
        {hasVoiceData ? (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
              <User className="w-5 h-5 mr-2 text-green-600" />
              Extracted from Voice Chat
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Current Age (Calculated) */}
              <div className="bg-white p-4 rounded-lg border border-green-100">
                <div className="flex items-center mb-2">
                  <Cake className="w-4 h-4 text-green-600 mr-2" />
                  <label className="text-sm font-medium text-gray-700">
                    Current Age
                  </label>
                </div>
                <div className="text-2xl font-bold text-green-700">
                  {calculatedAge !== null
                    ? `${calculatedAge} years old`
                    : "Not calculated"}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  From birthday: {voiceData.dateOfBirth || "Not provided"}
                </p>
              </div>

              {/* Retirement Date */}
              <div className="bg-white p-4 rounded-lg border border-green-100">
                <div className="flex items-center mb-2">
                  <Calendar className="w-4 h-4 text-green-600 mr-2" />
                  <label className="text-sm font-medium text-gray-700">
                    Retirement Date
                  </label>
                </div>
                <div className="text-lg font-bold text-green-700">
                  {displayRetirementDate ||
                    voiceData.retirementDate ||
                    "Not provided"}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {calculatedRetirementAge !== null &&
                    `Age ${calculatedRetirementAge} at retirement`}
                </p>
              </div>

              {/* Saved Amount */}
              <div className="bg-white p-4 rounded-lg border border-green-100">
                <div className="flex items-center mb-2">
                  <DollarSign className="w-4 h-4 text-green-600 mr-2" />
                  <label className="text-sm font-medium text-gray-700">
                    Saved Amount
                  </label>
                </div>
                <div className="text-2xl font-bold text-green-700">
                  {voiceData.currentRetirementSavings
                    ? `$${
                        typeof voiceData.currentRetirementSavings === "string"
                          ? parseInt(
                              voiceData.currentRetirementSavings.replace(
                                /[^0-9]/g,
                                ""
                              )
                            ).toLocaleString()
                          : voiceData.currentRetirementSavings.toLocaleString()
                      }`
                    : "Not provided"}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Current retirement savings
                </p>
              </div>
            </div>

            {/* Automation Values Note */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Automation will use:</strong> Retirement Age (
                {calculatedRetirementAge || "TBD"}), Longevity Estimate (100),
                Birthday ({voiceData.dateOfBirth || "TBD"}), and Investment
                Amount ($
                {formData.investmentAmount
                  ? parseInt(formData.investmentAmount).toLocaleString()
                  : "TBD"}
                )
              </p>
            </div>
          </div>
        ) : (
          /* No Voice Data - Show Placeholder */
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-xl border border-gray-200 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
              <MessageCircle className="w-5 h-5 mr-2 text-gray-600" />
              Voice Data Not Available
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Age Placeholder */}
              <div className="bg-white p-4 rounded-lg border border-gray-100">
                <div className="flex items-center mb-2">
                  <Cake className="w-4 h-4 text-gray-400 mr-2" />
                  <label className="text-sm font-medium text-gray-700">
                    Current Age
                  </label>
                </div>
                <div className="text-xl font-bold text-gray-400">
                  Not defined yet
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Complete voice chat to get age
                </p>
              </div>

              {/* Retirement Date Placeholder */}
              <div className="bg-white p-4 rounded-lg border border-gray-100">
                <div className="flex items-center mb-2">
                  <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                  <label className="text-sm font-medium text-gray-700">
                    Retirement Date
                  </label>
                </div>
                <div className="text-xl font-bold text-gray-400">
                  Not defined yet
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Complete voice chat to get retirement date
                </p>
              </div>

              {/* Saved Amount Placeholder */}
              <div className="bg-white p-4 rounded-lg border border-gray-100">
                <div className="flex items-center mb-2">
                  <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                  <label className="text-sm font-medium text-gray-700">
                    Saved Amount
                  </label>
                </div>
                <div className="text-xl font-bold text-gray-400">
                  Not defined yet
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Complete voice chat to get savings amount
                </p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Complete the voice chat first</strong> to extract your
                personal data
              </p>
              <a
                href="/agent"
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Start Voice Chat
              </a>
            </div>
          </div>
        )}

        {/* Connection Warning */}
        {!isConnected && (
          <div className="flex items-center p-3 bg-warning-50 border border-warning-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-warning-600 mr-3 flex-shrink-0" />
            <div className="text-sm text-warning-800">
              <p className="font-medium">Connection Required</p>
              <p>
                Please ensure the automation server is running and connected
                before starting.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={!canStart && !isRunning}
            className={`flex items-center px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
              isRunning
                ? "bg-red-500 hover:bg-red-600 text-white"
                : canStart && hasVoiceData
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isRunning ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Stop Automation
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                {hasVoiceData
                  ? "Start Automation"
                  : "Complete Voice Chat First"}
              </>
            )}
          </button>

          {status === "error" && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        {/* Current Status */}
        <div className="text-sm text-gray-600 border-t border-gray-200 pt-4">
          <span className="font-medium">Status:</span>{" "}
          <span
            className={`capitalize ${
              status === "running"
                ? "text-blue-600"
                : status === "completed"
                ? "text-green-600"
                : status === "error"
                ? "text-red-600"
                : "text-gray-600"
            }`}
          >
            {status}
          </span>
        </div>
      </form>
    </div>
  )
}
