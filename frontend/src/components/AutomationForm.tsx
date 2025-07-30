"use client"

import React, { useState } from "react"
import {
  Play,
  Square,
  AlertTriangle,
  Settings,
  DollarSign,
  Calendar,
  Clock,
  Cake,
} from "lucide-react"
import { AutomationStatus, AutomationFormData } from "@/types/automation"

interface AutomationFormProps {
  onStart: (formData: AutomationFormData) => void
  onStop: () => void
  status: AutomationStatus
  isConnected: boolean
  voiceData?: {
    birthday?: string
    retirementDate?: string
    savedAmount?: string
    age?: string
    retirementAge?: string
    longevityEstimate?: string
    investmentAmount?: string
  }
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
    investmentAmount: voiceData?.investmentAmount || "130000",
    retirementAge: voiceData?.retirementAge || "62",
    longevityEstimate: voiceData?.longevityEstimate || "100",
    birthday: voiceData?.birthday || "07/01/1967",
  })

  // Update form data when voice data changes
  React.useEffect(() => {
    if (voiceData && Object.keys(voiceData).length > 0) {
      setFormData((prev) => ({
        ...prev,
        investmentAmount: voiceData.investmentAmount || prev.investmentAmount,
        retirementAge: voiceData.retirementAge || prev.retirementAge,
        longevityEstimate:
          voiceData.longevityEstimate || prev.longevityEstimate,
        birthday: voiceData.birthday || prev.birthday,
      }))
    }
  }, [voiceData])

  const [showAdvanced, setShowAdvanced] = useState(false)

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
        {/* Voice Data Indicator */}
        {voiceData && Object.keys(voiceData).length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></div>
              <div>
                <h4 className="font-medium text-green-900">
                  Data from Voice Agent
                </h4>
                <p className="text-sm text-green-700">
                  The following information was extracted from your voice
                  conversation:
                  {voiceData.age && ` Age: ${voiceData.age} years old,`}
                  {voiceData.retirementDate &&
                    ` Retirement: ${voiceData.retirementDate},`}
                  {voiceData.savedAmount && ` Saved: ${voiceData.savedAmount}`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Investment Configuration Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
            Investment & Personal Configuration
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Row 1 */}
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
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Initial investment amount
              </p>
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
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Select your date of birth
              </p>
            </div>

            {/* Row 2 */}
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
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Target retirement age
              </p>
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
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Expected life span
              </p>
            </div>
          </div>
        </div>

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
