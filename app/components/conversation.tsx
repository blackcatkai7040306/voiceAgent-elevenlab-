"use client"

import { useConversation } from "@elevenlabs/react"
import { useCallback } from "react"
import { useEffect } from "react"
import { useSocket } from "../hooks/useSocket"
import {
  AutomationResultDisplay,
  AutomationResultLoading,
  AutomationResultEmpty,
} from "./AutomationResultDisplay"
export function Conversation() {
  const {
    automationResult,
    isAutoStarted,
    setAutomationResult,
    setIsAutoStarted,
    socket
  } = useSocket()
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
      const conversation_id = conversation.getId();


      if (socket) {
      socket.emit("conversation_id",  conversation_id);
    }

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
    setIsAutoStarted(false)
    setAutomationResult(null)
  }, [conversation])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        {/* Conversation Controls */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800">
              Voice Agent - Retirement Planning
            </h1>

            <div className="flex gap-2">
              <button
                onClick={startConversation}
                disabled={conversation.status === "connected"}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {conversation.status === "connected"
                  ? "Connected"
                  : "Start Conversation"}
              </button>
              <button
                onClick={stopConversation}
                disabled={conversation.status !== "connected"}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Stop Conversation
              </button>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    conversation.status === "connected"
                      ? "bg-green-500"
                      : "bg-gray-400"
                  }`}
                ></div>
                <p className="text-sm font-medium text-gray-700">
                  Status:{" "}
                  <span className="capitalize">{conversation.status}</span>
                </p>
              </div>
              <p className="text-sm text-gray-600">
                Agent is{" "}
                {conversation.isSpeaking ? "🗣️ speaking" : "👂 listening"}
              </p>
            </div>
          </div>
        </div>

        {/* Automation Results Display */}
        <div>
          {automationResult ? (
            <AutomationResultDisplay data={automationResult} />
          ) : conversation.status === "connected" && isAutoStarted ? (
            <AutomationResultLoading />
          ) : (
            <AutomationResultEmpty />
          )}
        </div>
      </div>
    </div>
  )
}
