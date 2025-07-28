"use client"

import React from "react"
import {
  TrendingUp,
  DollarSign,
  BarChart3,
  RefreshCw,
  Star,
  Target,
  Activity,
} from "lucide-react"
import { AutomationResult, ExtractedData } from "@/types/automation"

interface ResultsDisplayProps {
  result: AutomationResult | null
  extractedData: ExtractedData
  onRestart?: () => void
  showRestart?: boolean
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  result,
  extractedData,
  onRestart,
  showRestart = false,
}) => {
  // Show results if we have extracted financial data
  const hasFinancialData =
    extractedData.monthlyIncomeNet || extractedData.planValues

  // Check if we have plan values (including partial data)
  const hasPlanValues =
    extractedData.planValues &&
    (extractedData.planValues.value1 ||
      extractedData.planValues.value2 ||
      extractedData.planValues.value3)

  // Only show if we have extracted data
  if (!hasFinancialData) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Extracted Financial Results */}
      <div className="card border-2 border-green-200 bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <Star className="w-6 h-6 mr-3 text-yellow-500" />
            Extracted Financial Results
          </h3>
          <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full">
            <TrendingUp className="w-4 h-4 mr-2" />
            <span className="text-sm font-semibold">Success</span>
          </div>
        </div>

        {/* Monthly Income (Net) - Large Highlight */}
        {extractedData.monthlyIncomeNet && (
          <div className="mb-6 p-6 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl border-2 border-green-300 shadow-lg">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="w-8 h-8 text-green-600 mr-2" />
                <span className="text-lg font-semibold text-gray-700">
                  Monthly Income (Net)
                </span>
              </div>
              <div className="text-4xl font-bold text-green-700 mb-2">
                {extractedData.monthlyIncomeNet}
              </div>
              <div className="text-sm text-green-600 font-medium">
                Successfully extracted from automation
              </div>
            </div>
          </div>
        )}

        {/* Plan Values - Prominent Display */}
        {(extractedData.planValues || hasPlanValues) && (
          <div className="p-6 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl border-2 border-blue-300 shadow-lg">
            <div className="text-center mb-4">
              <div className="flex items-center justify-center mb-2">
                <BarChart3 className="w-8 h-8 text-blue-600 mr-2" />
                <span className="text-lg font-semibold text-gray-700">
                  Start of Plan Values
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {extractedData.planValues?.value1 && (
                <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Target className="w-5 h-5 text-blue-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">
                        Target Value 1
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-700 mt-2">
                    {extractedData.planValues.value1}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Expected: $40,567
                  </div>
                </div>
              )}

              {extractedData.planValues?.value2 && (
                <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-indigo-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Activity className="w-5 h-5 text-indigo-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">
                        Target Value 2
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-indigo-700 mt-2">
                    {extractedData.planValues.value2}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Expected: $109,433
                  </div>
                </div>
              )}

              {extractedData.planValues?.value3 && (
                <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <TrendingUp className="w-5 h-5 text-purple-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">
                        Reference Value
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-purple-700 mt-2">
                    {extractedData.planValues.value3}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Total: $150,000
                  </div>
                </div>
              )}
            </div>

            <div className="text-center mt-4">
              <div className="text-sm text-blue-600 font-medium">
                Start of Plan Values Successfully Extracted
              </div>
            </div>
          </div>
        )}

        {/* Restart Button */}
        {showRestart && onRestart && (
          <div className="mt-6 text-center">
            <button
              onClick={onRestart}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-lg shadow-lg hover:from-green-600 hover:to-blue-600 transition-all duration-200 transform hover:scale-105"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Restart Automation
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
