"use client"

import React from "react"
import { CheckCircle, Clock, AlertCircle, Loader2, XCircle } from "lucide-react"
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

const getStepIcon = (
  step: string,
  status: string | undefined,
  isActive: boolean,
  isCompleted: boolean
) => {
  // Prioritize status field completely
  if (status === "success" || status === "completed") {
    return <CheckCircle className="w-5 h-5 text-green-500" />
  }

  if (status === "failed") {
    return <XCircle className="w-5 h-5 text-red-500" />
  }

  if (status === "progress") {
    return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
  }

  // Default pending state for undefined status
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
          const stepStatus = update.status || "progress"

          // Simplified logic - status field is the source of truth
          const isActive = stepStatus === "progress"
          const isCompleted =
            stepStatus === "success" ||
            stepStatus === "completed" ||
            stepStatus === "failed"

          const getBackgroundColor = () => {
            if (stepStatus === "success" || stepStatus === "completed") {
              return "bg-green-50 border border-green-200"
            }
            if (stepStatus === "failed") {
              return "bg-red-50 border border-red-200"
            }
            if (stepStatus === "progress" || isActive) {
              return "bg-blue-50 border border-blue-200"
            }
            return "bg-gray-50"
          }

          return (
            <div
              key={`${update.step}-${index}`}
              className={`flex items-start space-x-3 p-3 rounded-lg transition-all duration-200 ${getBackgroundColor()}`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getStepIcon(update.step, stepStatus, isActive, isCompleted)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p
                    className={`text-sm font-medium ${
                      stepStatus === "success" || stepStatus === "completed"
                        ? "text-green-900"
                        : stepStatus === "failed"
                        ? "text-red-900"
                        : stepStatus === "progress" || isActive
                        ? "text-blue-900"
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
