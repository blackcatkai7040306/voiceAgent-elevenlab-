"use client"

import React, { useState, useEffect } from "react"
import {
  Play,
  Square,
  AlertTriangle,
  Settings,
  DollarSign,
  Calendar,
  Clock,
  Cake,
  User,
} from "lucide-react"
import { AutomationStatus, AutomationFormData } from "@/types/automation"

interface VoiceExtractedData {
  firstName?: string
  dateOfBirth?: string
  retirementDate?: string
  currentRetirementSavings?: string | number
}

interface AutomationFormProps {
  onStart: (formData: AutomationFormData) => void
  onStop: () => void
  status: AutomationStatus
  isConnected: boolean
  voiceData?: VoiceExtractedData
}

export const AutomationForm: React.FC<AutomationFormProps> = ({
  onStart,
  onStop,
  status,
  isConnected,
  voiceData,
}) => {
  const [formData, setFormData] = useState<AutomationFormData>({
    description: "Income Conductor automation workflow",
    sessionId: Date.now().toString(),
    investmentAmount: "130000",
    retirementAge: "62",
    longevityEstimate: "100",
    birthday: "07/01/1967",
  })

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null)
  const [calculatedRetirementAge, setCalculatedRetirementAge] = useState<
    number | null
  >(null)
  const [displayRetirementDate, setDisplayRetirementDate] = useState<string>("")

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

  // Update form data when voice data changes
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

  // Helper function to convert MM/DD/YYYY to YYYY-MM-DD for date input
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return ""
    const [month, day, year] = dateString.split("/")
    if (month && day && year) {
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    }
    return ""
  }

  // Helper function to convert YYYY-MM-DD back to MM/DD/YYYY
  const formatDateForStorage = (dateString: string): string => {
    if (!dateString) return ""
    const [year, month, day] = dateString.split("-")
    if (year && month && day) {
      return `${month}/${day}/${year}`
    }
    return ""
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (status === "running") {
      onStop()
    } else {
      onStart(formData)
    }
  }

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const isRunning = status === "running"
  const canStart = isConnected && status === "idle"

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Automation Control
        </h3>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Settings className="w-4 h-4 mr-1" />
          {showAdvanced ? "Hide" : "Show"} Advanced
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Voice Extracted Data Display */}
        {voiceData && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
              <User className="w-5 h-5 mr-2 text-green-600" />
              Voice Agent Extracted Data
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
                  Calculated from birthday:{" "}
                  {voiceData.dateOfBirth || "Not provided"}
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
                    Current Savings
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
                  Amount saved for retirement
                </p>
              </div>
            </div>

            {/* Calculated Values Note */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Automation Values:</strong> Retirement Age (
                {calculatedRetirementAge || "TBD"}), Longevity Estimate (100),
                Birthday ({voiceData.dateOfBirth || "TBD"}), and Investment
                Amount ($
                {formData.investmentAmount
                  ? parseInt(formData.investmentAmount).toLocaleString()
                  : "TBD"}
                ) will be automatically input during browser automation.
              </p>
            </div>
          </div>
        )}

        {/* Manual Input Fallback (when no voice data) */}
        {!voiceData && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
              Manual Input Configuration
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Investment Amount ($)
                </label>
                <input
                  type="number"
                  value={formData.investmentAmount}
                  onChange={(e) =>
                    handleInputChange("investmentAmount", e.target.value)
                  }
                  className="input-field text-lg font-semibold h-12 px-4"
                  placeholder="130000"
                  min="1000"
                  step="1000"
                  disabled={isRunning}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Date of Birth
                </label>
                <div className="relative">
                  <Cake className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="date"
                    value={formatDateForInput(formData.birthday)}
                    onChange={(e) =>
                      handleInputChange(
                        "birthday",
                        formatDateForStorage(e.target.value)
                      )
                    }
                    className="input-field pl-10 text-lg font-semibold h-12"
                    min="1900-01-01"
                    max="2010-12-31"
                    disabled={isRunning}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Retirement Age
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="number"
                    value={formData.retirementAge}
                    onChange={(e) =>
                      handleInputChange("retirementAge", e.target.value)
                    }
                    className="input-field pl-10 text-lg font-semibold h-12"
                    placeholder="62"
                    min="50"
                    max="80"
                    disabled={isRunning}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Longevity Estimate
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="number"
                    value={formData.longevityEstimate}
                    onChange={(e) =>
                      handleInputChange("longevityEstimate", e.target.value)
                    }
                    className="input-field pl-10 text-lg font-semibold h-12"
                    placeholder="100"
                    min="70"
                    max="120"
                    disabled={isRunning}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Basic Settings */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Session Description
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            className="input-field h-12 px-4"
            placeholder="Describe this automation session..."
            disabled={isRunning}
          />
        </div>

        {/* Advanced Settings */}
        {showAdvanced && (
          <div className="border-t border-gray-200 pt-6 space-y-6">
            <h4 className="font-medium text-gray-900 mb-4">
              Advanced Configuration
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Session ID
                </label>
                <input
                  type="text"
                  value={formData.sessionId}
                  onChange={(e) =>
                    handleInputChange("sessionId", e.target.value)
                  }
                  className="input-field h-12 px-4"
                  disabled={isRunning}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Custom Parameter
                </label>
                <input
                  type="text"
                  value={formData.customParam || ""}
                  onChange={(e) =>
                    handleInputChange("customParam", e.target.value)
                  }
                  className="input-field h-12 px-4"
                  placeholder="Optional custom parameter..."
                  disabled={isRunning}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Additional Notes
              </label>
              <textarea
                value={formData.notes || ""}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                className="input-field px-4 py-3"
                rows={4}
                placeholder="Any additional notes for this session..."
                disabled={isRunning}
              />
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
                ? "bg-danger-500 hover:bg-danger-600 text-white"
                : canStart
                ? "bg-primary-500 hover:bg-primary-600 text-white"
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
                Start Automation
              </>
            )}
          </button>

          {status === "error" && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-secondary"
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
                ? "text-primary-600"
                : status === "completed"
                ? "text-success-600"
                : status === "error"
                ? "text-danger-600"
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
