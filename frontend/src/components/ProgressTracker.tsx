"use client"

import React from "react"
import { CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react"
import { ProgressUpdate, AutomationStatus } from "@/types/automation"

interface ProgressTrackerProps {
  progress: ProgressUpdate[]
  status: AutomationStatus
  currentStep: string
}

const stepIcons: Record<string, React.ComponentType<any>> = {
  initialization: Loader2,
  "browser-setup": Loader2,
  navigation: Loader2,
  login: Loader2,
  "plan-selection": Loader2,
  "client-selection": Loader2,
  "profile-update": Loader2,
  "investment-input": Loader2,
  "client-data": Loader2,
  "data-extraction": Loader2,
  "plan-data-extracted": CheckCircle,
  "data-extracted": CheckCircle,
  completed: CheckCircle,
}

const getStepIcon = (step: string, isActive: boolean, isCompleted: boolean) => {
  const IconComponent = stepIcons[step] || Clock

  if (isCompleted) {
    return <CheckCircle className="w-5 h-5 text-success-500" />
  }

  if (isActive) {
    return <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
  }

  return <Clock className="w-5 h-5 text-gray-400" />
}

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString()
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  progress,
  status,
  currentStep,
}) => {
  if (progress.length === 0) {
    return null
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Automation Progress
        </h3>
        <div className="flex items-center space-x-2">
          {status === "running" && (
            <div className="flex items-center text-primary-600">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm font-medium">Running...</span>
            </div>
          )}
          {status === "completed" && (
            <div className="flex items-center text-success-600">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Completed</span>
            </div>
          )}
          {status === "error" && (
            <div className="flex items-center text-danger-600">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Error</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {progress.map((update, index) => {
          const isActive = update.step === currentStep && status === "running"
          const isCompleted =
            index < progress.length - 1 || status === "completed"

          return (
            <div
              key={`${update.step}-${index}`}
              className={`flex items-start space-x-3 p-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-primary-50 border border-primary-200"
                  : isCompleted
                  ? "bg-success-50 border border-success-200"
                  : "bg-gray-50"
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getStepIcon(update.step, isActive, isCompleted)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p
                    className={`text-sm font-medium ${
                      isActive
                        ? "text-primary-900"
                        : isCompleted
                        ? "text-success-900"
                        : "text-gray-900"
                    }`}
                  >
                    {update.message}
                  </p>
                  <span className="text-xs text-gray-500">
                    {formatTime(update.timestamp)}
                  </span>
                </div>

                {update.details && Object.keys(update.details).length > 0 && (
                  <div className="mt-2 text-xs text-gray-600">
                    {update.details.monthlyIncomeNet && (
                      <div className="font-medium text-success-700">
                        💰 Monthly Income (Net):{" "}
                        {update.details.monthlyIncomeNet}
                      </div>
                    )}
                    {update.details.targetValue1 &&
                      update.details.targetValue2 && (
                        <div className="font-medium text-primary-700">
                          📊 Start of Plan Values: {update.details.targetValue1}{" "}
                          | {update.details.targetValue2}
                          {update.details.referenceValue3 &&
                            ` | ${update.details.referenceValue3}`}
                        </div>
                      )}
                    {update.details.startOfPlanValues &&
                      typeof update.details.startOfPlanValues === "object" &&
                      !Array.isArray(update.details.startOfPlanValues) && (
                        <div className="font-medium text-primary-700">
                          📊 Start of Plan Values:{" "}
                          {update.details.startOfPlanValues.value1} |{" "}
                          {update.details.startOfPlanValues.value2} |{" "}
                          {update.details.startOfPlanValues.value3}
                        </div>
                      )}
                    {/* Backward compatibility for old format */}
                    {update.details.value1 &&
                      update.details.value2 &&
                      update.details.value3 && (
                        <div className="font-medium text-primary-700">
                          📊 Plan Values: {update.details.value1} |{" "}
                          {update.details.value2} | {update.details.value3}
                        </div>
                      )}
                    {update.details.pageTitle && (
                      <div className="truncate">
                        📄 Page: {update.details.pageTitle}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
