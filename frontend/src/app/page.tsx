"use client"

import React, { useState, useEffect } from "react"
import { Bot, AlertCircle } from "lucide-react"
import { useSocket } from "@/hooks/useSocket"
import { automationApi } from "@/lib/api"
import { AutomationForm } from "@/components/AutomationForm"
import { ProgressTracker } from "@/components/ProgressTracker"
import { StatusIndicator } from "@/components/StatusIndicator"
import { ResultsDisplay } from "@/components/ResultsDisplay"
import {
  AutomationStatus,
  AutomationFormData,
  AutomationResult,
  ExtractedData,
} from "@/types/automation"

export default function HomePage() {
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

  const handleStartAutomation = async (formData: AutomationFormData) => {
    try {
      setStatus("running")
      setError(null)
      setResult(null)
      clearProgress()

      const response = await automationApi.startAutomation(formData)

      if (response.success && response.result) {
        setResult(response.result)
        setStatus("completed")
      } else {
        throw new Error(response.error || "Automation failed")
      }
    } catch (err) {
      console.error("Automation error:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
      setStatus("error")
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

            {/* Automation Form */}
            <AutomationForm
              onStart={handleStartAutomation}
              onStop={handleStopAutomation}
              status={status}
              isConnected={isConnected}
            />

            {/* Error Display */}
            {error && (
              <div className="card border-red-200 bg-red-50">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900 mb-1">
                      Automation Error
                    </h4>
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}
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
