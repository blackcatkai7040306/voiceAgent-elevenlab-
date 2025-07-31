"use client"

import React, { useState, useEffect } from "react"
import { Bot, AlertCircle } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useSocket } from "@/hooks/useSocket"
import { automationApi } from "@/lib/api"
import { VoiceDataDisplay } from "@/components/VoiceDataDisplay"
import { ProgressTracker } from "@/components/ProgressTracker"
import { StatusIndicator } from "@/components/StatusIndicator"
import { ResultsDisplay } from "@/components/ResultsDisplay"
import {
  AutomationStatus,
  AutomationFormData,
  AutomationResult,
  ExtractedData,
} from "@/types/automation"

interface VoiceExtractedData {
  firstName?: string
  dateOfBirth?: string
  retirementDate?: string
  currentRetirementSavings?: string | number
}

export default function HomePage() {
  const searchParams = useSearchParams()
  const {
    isConnected,
    progress,
    currentStep,
    connectionError,
    usingFallback,
    clearProgress,
    reconnect,
  } = useSocket()
  const [status, setStatus] = useState<AutomationStatus>("idle")
  const [result, setResult] = useState<AutomationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractedData>({})
  const [voiceData, setVoiceData] = useState<VoiceExtractedData | null>(null)

  // Extract voice data from URL parameters
  useEffect(() => {
    const birthday = searchParams.get("birthday")
    const retirementDate = searchParams.get("retirementDate")
    const currentRetirementSavings = searchParams.get(
      "currentRetirementSavings"
    )
    const firstName = searchParams.get("firstName")

    if (birthday || retirementDate || currentRetirementSavings) {
      setVoiceData({
        firstName: firstName || undefined,
        dateOfBirth: birthday || undefined,
        retirementDate: retirementDate || undefined,
        currentRetirementSavings: currentRetirementSavings || undefined,
      })
    }
  }, [searchParams])

  // Process progress updates to extract data
  useEffect(() => {
    // Process all progress updates to accumulate extracted data
    const accumulatedData: ExtractedData = {}

    progress.forEach((update) => {
      if (update.details) {
        // Check for monthlyIncomeNet (new format)
        if (update.details.monthlyIncomeNet) {
          accumulatedData.monthlyIncomeNet = update.details.monthlyIncomeNet
        }

        // Check for target values (new format)
        if (update.details.targetValue1 && update.details.targetValue2) {
          accumulatedData.planValues = {
            value1: update.details.targetValue1,
            value2: update.details.targetValue2,
            value3: update.details.referenceValue3,
          }
        }

        // Check for startOfPlanValues object format (new format)
        if (
          update.details.startOfPlanValues &&
          typeof update.details.startOfPlanValues === "object" &&
          !Array.isArray(update.details.startOfPlanValues)
        ) {
          accumulatedData.planValues = {
            value1: update.details.startOfPlanValues.value1,
            value2: update.details.startOfPlanValues.value2,
            value3: update.details.startOfPlanValues.value3,
          }
        }

        // Backward compatibility - check for startOfPlanValues array format
        if (
          update.details.startOfPlanValues &&
          Array.isArray(update.details.startOfPlanValues)
        ) {
          accumulatedData.planValues = {
            value1: update.details.startOfPlanValues[0],
            value2: update.details.startOfPlanValues[1],
            value3: update.details.startOfPlanValues[2],
          }
        }
      }
    })

    // Only update if we have meaningful data
    if (accumulatedData.monthlyIncomeNet || accumulatedData.planValues) {
      setExtractedData(accumulatedData)
    }
  }, [progress])

  // Handle automation completion/failure via socket
  useEffect(() => {
    const lastUpdate = progress[progress.length - 1]
    if (!lastUpdate) return

    if (lastUpdate.status === "completed" && lastUpdate.step === "completed") {
      console.log("🎉 Automation completed successfully via socket!")
      setStatus("completed")

      // Auto-navigate to voice chat if we have extracted data
      if (extractedData.monthlyIncomeNet || extractedData.planValues) {
        console.log("🚀 Auto-navigating to voice chat with results...")
        setTimeout(() => {
          handleContinueVoiceChat()
        }, 2000) // Wait 2 seconds to show results first
      }
    } else if (
      lastUpdate.status === "failed" &&
      lastUpdate.step === "automation"
    ) {
      console.log("❌ Automation failed via socket")
      setStatus("error")
    }
  }, [progress, extractedData])

  const handleStartAutomation = async (formData: AutomationFormData) => {
    // Start automation - status will be updated via socket
    setStatus("running")
    setError(null)
    setResult(null)
    clearProgress()

    // Trigger automation via API but ignore the response
    // All progress and completion will be handled via socket
    try {
      console.log("🚀 Starting automation (socket-only mode)...")
      await automationApi.startAutomation(formData)
    } catch (err) {
      console.log(
        "📡 API call completed/failed - continuing with socket monitoring"
      )
      // Ignore API errors - socket will handle the real status
    }
  }

  const handleStopAutomation = () => {
    setStatus("idle")
  }

  const handleClearAll = () => {
    setStatus("idle")
    setResult(null)
    setError(null)
    setExtractedData({})
    clearProgress()
  }

  const handleRestartAutomation = () => {
    setStatus("idle")
    setResult(null)
    setError(null)
    setExtractedData({})
    clearProgress()
  }

  const handleContinueVoiceChat = () => {
    // Navigate back to agent page with completion status
    const params = new URLSearchParams({
      automationCompleted: "true",
      monthlyIncome: extractedData.monthlyIncomeNet?.toString() || "",
      planValue1: extractedData.planValues?.value1?.toString() || "",
      planValue2: extractedData.planValues?.value2?.toString() || "",
      planValue3: extractedData.planValues?.value3?.toString() || "",
    })
    window.location.href = `/agent?${params.toString()}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Bot className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Income Conductor Automation
                </h1>
                <p className="text-sm text-gray-600">
                  Automated financial planning workflow
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleClearAll}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            {/* Status Indicator */}
            <StatusIndicator
              isConnected={isConnected}
              status={status}
              connectionError={connectionError}
              onReconnect={reconnect}
            />

            {/* Voice Data Display */}
            <VoiceDataDisplay
              onStart={handleStartAutomation}
              onStop={handleStopAutomation}
              status={status}
              isConnected={isConnected}
              voiceData={voiceData || undefined}
            />

            {/* Error Display - Hidden from users */}
          </div>

          {/* Right Column - Progress & Results */}
          <div className="space-y-6">
            {/* Progress Tracker */}
            <ProgressTracker
              progress={progress}
              status={status}
              currentStep={currentStep}
            />

            {/* Results Display */}
            <ResultsDisplay
              result={result}
              extractedData={extractedData}
              onRestart={handleRestartAutomation}
              onContinueVoiceChat={handleContinueVoiceChat}
              showRestart={status === "completed"}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            How to Use
          </h3>
          <div className="prose prose-sm text-gray-600">
            <ol className="list-decimal list-inside space-y-2">
              <li>Ensure the automation server is running on port 3001</li>
              <li>Wait for the connection indicator to show "Connected"</li>
              <li>Configure any advanced settings if needed</li>
              <li>
                Click "Start Automation" to begin the Income Conductor workflow
              </li>
              <li>
                Monitor real-time progress updates in the progress tracker
              </li>
              <li>
                View extracted data and results when the automation completes
              </li>
            </ol>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> The automation will automatically
                navigate through the Income Conductor website, update client
                information, and extract financial planning data.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
