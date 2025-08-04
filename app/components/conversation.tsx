"use client"

import { useConversation } from "@elevenlabs/react"
import { useCallback } from "react"
import { io, Socket } from "socket.io-client"
import { useEffect, useRef, useState } from "react"
import { useSocket } from "../../app/hooks/useSocket"
import { AutomationResult, InvestmentPlan } from "../types/automationResult"
export function Conversation() {
  const { automationResult } = useSocket()
  useEffect(() => {
    console.log("Automation Result:", automationResult)
  }, [automationResult])

  const conversation = useConversation({
    onConnect: () => console.log("Connected"),
    onDisconnect: () => console.log("Disconnected"),
    onMessage: (message) => console.log("Message:", message),
    onError: (error) => console.error("Error:", error),
  })

  const startConversation = useCallback(async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true })

      // Start the conversation with your agent
      await conversation.startSession({
        agentId: "agent_6701k1nt4ns1eja9rp4mdvt93xat",
        connectionType: "webrtc", // or 'websocket', depending on your setup
        // Optional field for tracking your end user IDs
      })
    } catch (error) {
      console.error("Failed to start conversation:", error)
    }
  }, [conversation])

  const stopConversation = useCallback(async () => {
    await conversation.endSession()
  }, [conversation])

  /**
   * Formats currency values for display
   * Handles both string and number inputs for flexible data handling
   */
  const formatCurrency = (value: string | number): string => {
    if (typeof value === "number") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
    }
    if (typeof value === "string") {
      const numValue = parseFloat(value.replace(/[^\d.-]/g, ""))
      if (!isNaN(numValue)) {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(numValue)
      }
    }
    return value?.toString() || "N/A"
  }

  /**
   * Renders investment plan card with proper TypeScript typing
   * @param plan - Investment plan data
   * @param title - Card title to display
   * @param bgColor - Background color class for the card
   * @param icon - Icon to display with the title
   */
  const renderPlanCard = (
    plan: InvestmentPlan | undefined,
    title: string,
    bgColor: string,
    icon: string
  ) => {
    if (!plan) return null

    return (
      <div
        className={`${bgColor} p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200`}
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span>{icon}</span>
          {title}
        </h3>
        <div className="space-y-3">
          {Object.entries(plan).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center">
              <span className="text-gray-600 capitalize text-sm">
                {key.replace(/([A-Z])/g, " $1").trim()}:
              </span>
              <span className="font-medium text-gray-800">
                {typeof value === "string" &&
                (key.toLowerCase().includes("amount") ||
                  key.toLowerCase().includes("value") ||
                  key.toLowerCase().includes("total"))
                  ? formatCurrency(value)
                  : value || "N/A"}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Voice Conversation Controls */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          🎤 Voice Agent Conversation
        </h2>

        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-4">
            <button
              onClick={startConversation}
              disabled={conversation.status === "connected"}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg 
                         disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200
                         shadow-md hover:shadow-lg"
            >
              🚀 Start Conversation
            </button>
            <button
              onClick={stopConversation}
              disabled={conversation.status !== "connected"}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg 
                         disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200
                         shadow-md hover:shadow-lg"
            >
              ⏹️ Stop Conversation
            </button>
          </div>

          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  conversation.status === "connected"
                    ? "bg-green-400"
                    : conversation.status === "connecting"
                    ? "bg-yellow-400"
                    : "bg-red-400"
                }`}
              ></div>
              <span className="font-medium">Status: {conversation.status}</span>
            </div>
            <p className="text-gray-600">
              Agent is{" "}
              {conversation.isSpeaking ? "🗣️ speaking" : "👂 listening"}
            </p>
          </div>
        </div>
      </div>

      {/* Automation Results Display */}
      {automationResult && automationResult.success && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              ✅
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Retirement Planning Results
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Personal Information Card */}
            <div className="bg-blue-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                👤 Personal Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Birthday:</span>
                  <span className="font-medium text-gray-800">
                    {automationResult.birthday}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Retirement Age:</span>
                  <span className="font-medium text-gray-800">
                    {automationResult.retirementAge}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Retirement Date:</span>
                  <span className="font-medium text-gray-800">
                    {automationResult.retirementMonth}{" "}
                    {automationResult.retirementYear}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Life Expectancy:</span>
                  <span className="font-medium text-gray-800">
                    {automationResult.longevityEstimate}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Investment Amount:</span>
                  <span className="font-medium text-gray-800">
                    {formatCurrency(automationResult.investmentAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Monthly Income Card */}
            {automationResult.monthlyIncomeNet && (
              <div className="bg-green-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  💰 Monthly Income Projection
                </h3>
                <div className="space-y-2">
                  {Object.entries(automationResult.monthlyIncomeNet).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between items-center"
                      >
                        <span className="text-gray-600 capitalize text-sm">
                          {key.replace(/([A-Z])/g, " $1").trim()}:
                        </span>
                        <span className="font-medium text-gray-800">
                          {formatCurrency(value)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Total Plan Summary */}
            {automationResult.total && (
              <div className="bg-purple-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  📊 Total Plan Summary
                </h3>
                <div className="space-y-2">
                  {Object.entries(automationResult.total).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between items-center"
                      >
                        <span className="text-gray-600 capitalize text-sm">
                          {key.replace(/([A-Z])/g, " $1").trim()}:
                        </span>
                        <span className="font-medium text-gray-800">
                          {formatCurrency(value)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Investment Plans Row */}
          {(automationResult.plan1 || automationResult.plan2) && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                📈 Investment Plan Options
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {renderPlanCard(
                  automationResult.plan1,
                  "Conservative Plan",
                  "bg-yellow-50",
                  "💼"
                )}
                {renderPlanCard(
                  automationResult.plan2,
                  "Aggressive Plan",
                  "bg-orange-50",
                  "🚀"
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Data State */}
      {!automationResult && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">💬</div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Start a conversation to see your retirement planning results
          </h3>
          <p className="text-gray-500">
            Click "Start Conversation" above to begin your voice interaction
            with our retirement planning agent.
          </p>
        </div>
      )}

      {/* Error State */}
      {automationResult && !automationResult.success && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              ❌
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800">
                Processing Error
              </h3>
              <p className="text-red-600">
                There was an issue processing your retirement planning request.
                Please try again.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
