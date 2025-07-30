"use client"

import React, { useState } from "react"
import {
  User,
  Calendar,
  Clock,
  DollarSign,
  Send,
  CheckCircle,
  AlertCircle,
  Edit3,
  Save,
  X,
} from "lucide-react"
import { UserDataExtractorProps, ExtractedUserData } from "@/types/voiceAgent"

export const UserDataExtractor: React.FC<UserDataExtractorProps> = ({
  extractedData,
  conversation,
  isDataComplete,
  onSendToAutomation,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState<ExtractedUserData>(extractedData)

  React.useEffect(() => {
    setEditedData(extractedData)
  }, [extractedData])

  const handleEdit = () => {
    setIsEditing(true)
    setEditedData(extractedData)
  }

  const handleSave = () => {
    setIsEditing(false)
    // You might want to call onDataExtracted here to update the parent
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedData(extractedData)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not provided"
    try {
      // Try to parse and format the date
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return dateString // Return as-is if not a valid date
      }
      return date.toLocaleDateString()
    } catch {
      return dateString
    }
  }

  const completionPercentage = () => {
    const fields = ["dateOfBirth", "retirementDate", "currentRetirementSavings"]
    const filledFields = fields.filter(
      (field) => extractedData[field as keyof ExtractedUserData]
    )
    return Math.round((filledFields.length / fields.length) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Data Extraction Progress
          </h3>
          <div
            className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              isDataComplete
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {isDataComplete ? (
              <>
                <CheckCircle className="w-4 h-4 mr-1" />
                Complete
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 mr-1" />
                {completionPercentage()}% Complete
              </>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              isDataComplete ? "bg-green-500" : "bg-yellow-500"
            }`}
            style={{ width: `${completionPercentage()}%` }}
          />
        </div>

        <p className="text-sm text-gray-600">
          {isDataComplete
            ? "All required information has been collected. Ready to proceed with automation."
            : "Continue the conversation to provide any missing information."}
        </p>
      </div>

      {/* Extracted Data Display */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Extracted Information
          </h3>
          <button
            onClick={isEditing ? handleCancel : handleEdit}
            className="flex items-center px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            {isEditing ? (
              <>
                <X className="w-4 h-4 mr-1" />
                Cancel
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4 mr-1" />
                Edit
              </>
            )}
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* First Name */}
          {extractedData.firstName && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <User className="w-5 h-5 text-indigo-500 mr-3" />
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    First Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.firstName || ""}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          firstName: e.target.value,
                        })
                      }
                      placeholder="Your first name"
                      className="block w-full mt-1 text-sm border border-gray-300 rounded px-2 py-1"
                    />
                  ) : (
                    <p className="text-sm text-gray-600">
                      {extractedData.firstName || "Not provided"}
                    </p>
                  )}
                </div>
              </div>
              <div
                className={`w-3 h-3 rounded-full ${
                  extractedData.firstName ? "bg-green-500" : "bg-gray-300"
                }`}
              />
            </div>
          )}

          {/* Date of Birth */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-blue-500 mr-3" />
              <div>
                <label className="text-sm font-medium text-gray-900">
                  Date of Birth
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.dateOfBirth || ""}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        dateOfBirth: e.target.value,
                      })
                    }
                    placeholder="MM/DD/YYYY"
                    className="block w-full mt-1 text-sm border border-gray-300 rounded px-2 py-1"
                  />
                ) : (
                  <p className="text-sm text-gray-600">
                    {formatDate(extractedData.dateOfBirth)}
                  </p>
                )}
              </div>
            </div>
            <div
              className={`w-3 h-3 rounded-full ${
                extractedData.dateOfBirth ? "bg-green-500" : "bg-gray-300"
              }`}
            />
          </div>

          {/* Retirement Date */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-purple-500 mr-3" />
              <div>
                <label className="text-sm font-medium text-gray-900">
                  Retirement Date/Age
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.retirementDate || ""}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        retirementDate: e.target.value,
                      })
                    }
                    placeholder="e.g., 65 years old or MM/DD/YYYY"
                    className="block w-full mt-1 text-sm border border-gray-300 rounded px-2 py-1"
                  />
                ) : (
                  <p className="text-sm text-gray-600">
                    {extractedData.retirementDate || "Not provided"}
                  </p>
                )}
              </div>
            </div>
            <div
              className={`w-3 h-3 rounded-full ${
                extractedData.retirementDate ? "bg-green-500" : "bg-gray-300"
              }`}
            />
          </div>

          {/* Current Retirement Savings */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 text-green-500 mr-3" />
              <div>
                <label className="text-sm font-medium text-gray-900">
                  Current Retirement Savings
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.currentRetirementSavings || ""}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        currentRetirementSavings: e.target.value,
                      })
                    }
                    placeholder="e.g., $50,000"
                    className="block w-full mt-1 text-sm border border-gray-300 rounded px-2 py-1"
                  />
                ) : (
                  <p className="text-sm text-gray-600">
                    {extractedData.currentRetirementSavings
                      ? typeof extractedData.currentRetirementSavings ===
                        "number"
                        ? `$${extractedData.currentRetirementSavings.toLocaleString()}`
                        : extractedData.currentRetirementSavings
                      : "Not provided"}
                  </p>
                )}
              </div>
            </div>
            <div
              className={`w-3 h-3 rounded-full ${
                extractedData.currentRetirementSavings
                  ? "bg-green-500"
                  : "bg-gray-300"
              }`}
            />
          </div>

          {/* Save Button for Editing */}
          {isEditing && (
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSave}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Missing Data Alert */}
      {!isDataComplete && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">
                Missing Information
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                Please provide the following information through conversation:
              </p>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                {!extractedData.dateOfBirth && <li>• Date of Birth</li>}
                {!extractedData.retirementDate && (
                  <li>• Retirement Date/Age</li>
                )}
                {!extractedData.currentRetirementSavings && (
                  <li>• Current Retirement Savings</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Send to Automation Button */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <button
            onClick={onSendToAutomation}
            disabled={!isDataComplete}
            className={`inline-flex items-center px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              isDataComplete
                ? "bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 transform hover:scale-105 shadow-lg"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Send className="w-5 h-5 mr-2" />
            Send to Automation System
          </button>

          {isDataComplete && (
            <p className="text-sm text-gray-600 mt-2">
              This will transfer your information to the Income Conductor
              automation
            </p>
          )}
        </div>
      </div>

      {/* Raw Conversation Data (for debugging) */}
      {conversation.length > 0 && (
        <details className="bg-white rounded-lg shadow-sm border border-gray-200">
          <summary className="p-4 cursor-pointer text-sm font-medium text-gray-900 hover:text-gray-700">
            Raw Conversation Data ({conversation.length} messages)
          </summary>
          <div className="px-4 pb-4 border-t border-gray-200">
            <pre className="text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded mt-2 max-h-40 overflow-y-auto">
              {conversation.join("\n\n")}
            </pre>
          </div>
        </details>
      )}
    </div>
  )
}
