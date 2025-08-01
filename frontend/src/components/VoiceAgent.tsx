"use client"

import React, { useState, useRef, useEffect } from "react"
import {
  Volume2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Mic,
} from "lucide-react"
import {
  VoiceAgentProps,
  ExtractedUserData,
  ConversationMessage,
} from "@/types/voiceAgent"
import {
  processVoiceInput,
  convertTextToSpeech,
  testVoiceConnection,
  recordAudio,
} from "@/lib/voice-api"

export const VoiceAgent: React.FC<VoiceAgentProps> = ({
  onDataExtracted,
  onConversationUpdate,
  isRecording: _isRecording,
  setIsRecording: _setIsRecording,
}) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [conversation, setConversation] = useState<ConversationMessage[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("voiceAgentConversation")
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          return []
        }
      }
    }
    return []
  })
  const [isPlaying, setIsPlaying] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedUserData>({})
  const [currentTranscript, setCurrentTranscript] = useState("")
  const [status, setStatus] = useState<"listening" | "processing" | "speaking" | "complete" | "waiting">("waiting")

  const audioRecorderRef = useRef<{
    start: () => void
    stop: () => Promise<Blob>
    isRecording: () => boolean
  } | null>(null)
  const stopListeningRef = useRef(false)

  // Test voice service connection on component mount
  useEffect(() => {
    async function checkVoiceConnection() {
      const connected = await testVoiceConnection()
      setIsConnected(connected)
    }
    checkVoiceConnection()
    const interval = setInterval(checkVoiceConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  // Persist conversation to localStorage on change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("voiceAgentConversation", JSON.stringify(conversation))
    }
  }, [conversation])

  // Clear conversation from localStorage when all data is collected
  useEffect(() => {
    if (isAllDataCollected(extractedData)) {
      setStatus("complete")
      stopListeningRef.current = true
      if (typeof window !== "undefined") {
        localStorage.removeItem("voiceAgentConversation")
      }
    }
  }, [extractedData])

  // On connect, play greeting, then start listening
  useEffect(() => {
    if (isConnected && conversation.length === 0) {
      const initialGreeting = "Hi there this is Mark, who am I speaking with?"
      const greetingMessage: ConversationMessage = {
        type: "assistant",
        content: initialGreeting,
        timestamp: new Date(),
      }
      setConversation([greetingMessage])
      onConversationUpdate([`assistant: ${initialGreeting}`])
      setStatus("speaking")
      convertTextToSpeech(initialGreeting).then((success) => {
        setIsPlaying(false)
        if (success) {
          setTimeout(() => {
            if (!isAllDataCollected(extractedData)) {
              startListening()
            }
          }, 500)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected])

  // Helper: check if all required data is collected
  function isAllDataCollected(data: ExtractedUserData) {
    return !!(data.dateOfBirth && data.retirementDate && data.currentRetirementSavings)
  }

  // Start listening (recording)
  const startListening = async () => {
    if (stopListeningRef.current || isAllDataCollected(extractedData)) {
      setStatus("complete")
      return
    }
    setStatus("listening")
    setCurrentTranscript("Listening...")
    try {
      audioRecorderRef.current = await recordAudio()
      audioRecorderRef.current.start()
      // Automatically stop after a few seconds (e.g. 6s)
      setTimeout(async () => {
        if (audioRecorderRef.current && audioRecorderRef.current.isRecording()) {
          await stopListening()
        }
      }, 6000)
    } catch (error) {
      setStatus("waiting")
      setCurrentTranscript("")
      console.error("❌ Error starting recording:", error)
    }
  }

  // Stop listening and process audio
  const stopListening = async () => {
    if (!audioRecorderRef.current) return
    setStatus("processing")
    setCurrentTranscript("Processing...")
    setIsProcessing(true)
    try {
      const audioBlob = await audioRecorderRef.current.stop()
      const result = await processVoiceInput(
        audioBlob,
        conversation,
        extractedData
      )
      if (result.success) {
        setCurrentTranscript("")
        const userMessage: ConversationMessage = {
          type: "user",
          content: result.transcription,
          timestamp: new Date(),
        }
        const aiMessage: ConversationMessage = {
          type: "assistant",
          content: result.aiResponse,
          timestamp: new Date(),
        }
        const updatedConversation = [...conversation, userMessage, aiMessage]
        setConversation(updatedConversation)
        const mergedData = { ...extractedData, ...result.extractedData }
        setExtractedData(mergedData)
        onDataExtracted(mergedData)
        onConversationUpdate(
          updatedConversation.map((msg) => `${msg.type}: ${msg.content}`)
        )
        setStatus("speaking")
        setIsPlaying(true)
        await convertTextToSpeech(result.aiResponse)
        setIsPlaying(false)
        if (!isAllDataCollected(mergedData)) {
          setTimeout(() => startListening(), 500)
        } else {
          setStatus("complete")
        }
      } else {
        setCurrentTranscript("")
        throw new Error(result.error || "Voice processing failed")
      }
    } catch (error) {
      setCurrentTranscript("")
      setStatus("waiting")
      console.error("❌ Error processing voice input:", error)
      // Optionally, play error message
      await convertTextToSpeech("I'm sorry, I had trouble processing that. Could you please try again?")
      setTimeout(() => startListening(), 1000)
    } finally {
      setIsProcessing(false)
      audioRecorderRef.current = null
    }
  }

  // If all data is collected, stop listening
  useEffect(() => {
    if (isAllDataCollected(extractedData)) {
      setStatus("complete")
      stopListeningRef.current = true
    }
  }, [extractedData])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopListeningRef.current = true
      if (audioRecorderRef.current && audioRecorderRef.current.isRecording()) {
        audioRecorderRef.current.stop()
      }
    }
  }, [])

  // UI
  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Voice Agent Status
          </h3>
          <div className="flex items-center space-x-3">
            <div
              className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                isConnected === true
                  ? "bg-green-100 text-green-800"
                  : isConnected === false
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {isConnected === null ? (
                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
              ) : isConnected ? (
                <CheckCircle className="w-3 h-3 mr-2" />
              ) : (
                <AlertCircle className="w-3 h-3 mr-2" />
              )}
              Voice Service:{" "}
              {isConnected === null
                ? "Testing..."
                : isConnected
                ? "Connected"
                : "Disconnected"}
            </div>
          </div>
        </div>
        {isConnected === false && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              ⚠️ Voice service is unavailable. Please check your internet
              connection and backend server.
            </p>
            <div className="text-xs text-gray-500">
              Make sure your backend server is running on http://localhost:3001
            </div>
          </div>
        )}
      </div>
      {/* Status Indicator */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center space-x-4">
        {status === "listening" && <><Mic className="w-8 h-8 text-blue-500 animate-pulse" /><span className="text-blue-700 font-medium">Listening...</span></>}
        {status === "processing" && <><Loader2 className="w-8 h-8 animate-spin text-blue-500" /><span className="text-blue-700 font-medium">Processing...</span></>}
        {status === "speaking" && <><Volume2 className="w-8 h-8 text-green-500 animate-pulse" /><span className="text-green-700 font-medium">Speaking...</span></>}
        {status === "complete" && <><CheckCircle className="w-8 h-8 text-green-500" /><span className="text-green-700 font-medium">All data collected!</span></>}
        {status === "waiting" && <span className="text-gray-500">Waiting...</span>}
      </div>
      {/* Live Transcript */}
      {currentTranscript && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Status:</h4>
          <p className="text-gray-700 italic">"{currentTranscript}"</p>
        </div>
      )}
    </div>
  )
}
