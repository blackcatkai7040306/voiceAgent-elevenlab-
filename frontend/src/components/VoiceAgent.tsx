"use client"

import React, { useState, useRef, useEffect } from "react"
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  MessageCircle,
  Brain,
  Loader2,
  CheckCircle,
  AlertCircle,
  Send,
  Type,
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
  isRecording,
  setIsRecording,
}) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [conversation, setConversation] = useState<ConversationMessage[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([])
  const [extractedData, setExtractedData] = useState<ExtractedUserData>({})
  const [textInput, setTextInput] = useState("")
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice")
  const [currentTranscript, setCurrentTranscript] = useState("")

  const audioRecorderRef = useRef<{
    start: () => void
    stop: () => Promise<Blob>
    isRecording: () => boolean
  } | null>(null)

  // Test voice service connection on component mount
  useEffect(() => {
    async function checkVoiceConnection() {
      const connected = await testVoiceConnection()
      setIsConnected(connected)
    }
    checkVoiceConnection()

    // Set up periodic connection checks
    const interval = setInterval(checkVoiceConnection, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Send initial greeting when service connects
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

      // Convert greeting to speech
      convertTextToSpeech(initialGreeting).then((success) => {
        if (success) {
          setIsPlaying(true)
          // Note: The voice API handles playing audio automatically
          setTimeout(() => setIsPlaying(false), 2000) // Estimate duration for shorter greeting
        }
      })
    }
  }, [isConnected])

  const startRecording = async () => {
    try {
      console.log("🎤 Starting recording...")

      if (!isConnected) {
        alert("Voice service is not connected. Please wait for connection.")
        return
      }

      // Set up audio recorder
      audioRecorderRef.current = await recordAudio()
      audioRecorderRef.current.start()
      setIsRecording(true)
      setCurrentTranscript("Listening...")
    } catch (error) {
      console.error("❌ Error starting recording:", error)
      setIsRecording(false)

      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          alert(
            "Microphone access denied. Please allow microphone permissions in your browser settings."
          )
        } else if (error.name === "NotFoundError") {
          alert("No microphone found. Please check your audio devices.")
        } else {
          alert(
            "Could not access microphone. Please check your browser permissions and try again."
          )
        }
      }
    }
  }

  const stopRecording = async () => {
    try {
      if (!audioRecorderRef.current) return

      console.log("⏹️ Stopping recording...")
      setIsRecording(false)
      setCurrentTranscript("Processing...")
      setIsProcessing(true)

      const audioBlob = await audioRecorderRef.current.stop()
      console.log("📁 Audio recorded, size:", audioBlob.size)

      // Process the audio through our backend
      const result = await processVoiceInput(
        audioBlob,
        conversation,
        extractedData
      )

      if (result.success) {
        setCurrentTranscript("")

        // Add user message to conversation
        const userMessage: ConversationMessage = {
          type: "user",
          content: result.transcription,
          timestamp: new Date(),
        }

        // Add AI response to conversation
        const aiMessage: ConversationMessage = {
          type: "assistant",
          content: result.aiResponse,
          timestamp: new Date(),
        }

        const updatedConversation = [...conversation, userMessage, aiMessage]
        setConversation(updatedConversation)

        // Update extracted data
        setExtractedData(result.extractedData)
        onDataExtracted(result.extractedData)

        // Set follow-up questions
        setFollowUpQuestions(result.followUpQuestions)

        // Update parent with conversation
        onConversationUpdate(
          updatedConversation.map((msg) => `${msg.type}: ${msg.content}`)
        )

        // Audio is automatically played by the voice API
        setIsPlaying(true)
        // Estimate audio duration and reset playing state
        setTimeout(() => setIsPlaying(false), result.aiResponse.length * 50) // Rough estimate
      } else {
        setCurrentTranscript("")
        throw new Error(result.error || "Voice processing failed")
      }
    } catch (error) {
      console.error("❌ Error processing voice input:", error)
      setCurrentTranscript("")

      const fallbackResponse =
        "I'm sorry, I had trouble processing that. Could you please try again?"

      const aiMessage: ConversationMessage = {
        type: "assistant",
        content: fallbackResponse,
        timestamp: new Date(),
      }

      const updatedConversation = [...conversation, aiMessage]
      setConversation(updatedConversation)
      onConversationUpdate(
        updatedConversation.map((msg) => `${msg.type}: ${msg.content}`)
      )

      // Try to speak the error message
      convertTextToSpeech(fallbackResponse)
    } finally {
      setIsProcessing(false)
      audioRecorderRef.current = null
    }
  }

  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording()
    } else {
      await startRecording()
    }
  }

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return

    setIsProcessing(true)

    // Add user message to conversation
    const userMessage: ConversationMessage = {
      type: "user",
      content: textInput,
      timestamp: new Date(),
    }

    const updatedConversation = [...conversation, userMessage]
    setConversation(updatedConversation)

    try {
      // Create a temporary audio blob from text (we could record the user speaking this, but for simplicity, we'll simulate)
      // In a real implementation, you might want to create a separate text processing endpoint
      // For now, we'll use the existing OpenAI conversation API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/conversation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userMessage: textInput,
            conversationHistory: updatedConversation,
            extractedData: extractedData,
          }),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to process text input")
      }

      const result = await response.json()

      if (result.success) {
        // Update extracted data
        const mergedData = { ...extractedData, ...result.extractedData }
        setExtractedData(mergedData)
        onDataExtracted(mergedData)

        // Set follow-up questions
        setFollowUpQuestions(result.followUpQuestions || [])

        // Add AI response to conversation
        const aiMessage: ConversationMessage = {
          type: "assistant",
          content: result.aiResponse,
          timestamp: new Date(),
        }

        const finalConversation = [...updatedConversation, aiMessage]
        setConversation(finalConversation)
        onConversationUpdate(
          finalConversation.map((msg) => `${msg.type}: ${msg.content}`)
        )

        // Convert AI response to speech
        const speechSuccess = await convertTextToSpeech(result.aiResponse)
        if (speechSuccess) {
          setIsPlaying(true)
          setTimeout(() => setIsPlaying(false), result.aiResponse.length * 50)
        }
      } else {
        throw new Error(result.error || "Failed to process conversation")
      }
    } catch (error) {
      console.error("Error processing text input:", error)

      const fallbackResponse =
        "I'm sorry, I had trouble processing that. Could you please try again?"

      const aiMessage: ConversationMessage = {
        type: "assistant",
        content: fallbackResponse,
        timestamp: new Date(),
      }

      const finalConversation = [...updatedConversation, aiMessage]
      setConversation(finalConversation)
      onConversationUpdate(
        finalConversation.map((msg) => `${msg.type}: ${msg.content}`)
      )

      convertTextToSpeech(fallbackResponse)
    } finally {
      setIsProcessing(false)
      setTextInput("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleTextSubmit()
    }
  }

  const handleFollowUpClick = async (question: string) => {
    if (inputMode === "text") {
      setTextInput(question)
    } else {
      // For voice mode, we can auto-process the question
      setIsProcessing(true)

      const userMessage: ConversationMessage = {
        type: "user",
        content: question,
        timestamp: new Date(),
      }

      const updatedConversation = [...conversation, userMessage]
      setConversation(updatedConversation)

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/conversation`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userMessage: question,
              conversationHistory: updatedConversation,
              extractedData: extractedData,
            }),
          }
        )

        const result = await response.json()

        if (result.success) {
          const mergedData = { ...extractedData, ...result.extractedData }
          setExtractedData(mergedData)
          onDataExtracted(mergedData)
          setFollowUpQuestions(result.followUpQuestions || [])

          const aiMessage: ConversationMessage = {
            type: "assistant",
            content: result.aiResponse,
            timestamp: new Date(),
          }

          const finalConversation = [...updatedConversation, aiMessage]
          setConversation(finalConversation)
          onConversationUpdate(
            finalConversation.map((msg) => `${msg.type}: ${msg.content}`)
          )

          const speechSuccess = await convertTextToSpeech(result.aiResponse)
          if (speechSuccess) {
            setIsPlaying(true)
            setTimeout(() => setIsPlaying(false), result.aiResponse.length * 50)
          }
        }
      } catch (error) {
        console.error("Error processing follow-up question:", error)
      } finally {
        setIsProcessing(false)
      }
    }
  }

  const reconnectVoice = async () => {
    setIsConnected(null)
    const connected = await testVoiceConnection()
    setIsConnected(connected)
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Voice Agent Status
          </h3>
          <div className="flex items-center space-x-3">
            {/* Voice Service Status */}
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

            {/* Reconnect Button */}
            {isConnected === false && (
              <button
                onClick={reconnectVoice}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              >
                Reconnect
              </button>
            )}
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

      {/* Input Mode Toggle */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center space-x-4 mb-4">
          <button
            onClick={() => setInputMode("voice")}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              inputMode === "voice"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Mic className="w-4 h-4 mr-2" />
            Voice Input
          </button>
          <button
            onClick={() => setInputMode("text")}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              inputMode === "text"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Type className="w-4 h-4 mr-2" />
            Text Input
          </button>
        </div>

        {inputMode === "voice" ? (
          // Voice Input Controls
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={toggleRecording}
              disabled={!isConnected || isProcessing}
              className={`flex items-center justify-center w-16 h-16 rounded-full transition-all duration-200 ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-400"
              }`}
            >
              {isRecording ? (
                <MicOff className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>

            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">
                {isRecording ? "Recording..." : "Click to Record"}
              </p>
              <p className="text-xs text-gray-500">
                {isProcessing && "Processing with AI..."}
                {isPlaying && "Speaking response..."}
              </p>
            </div>

            <div className="w-16 h-16 flex items-center justify-center">
              {isProcessing && (
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              )}
              {isPlaying && <Volume2 className="w-8 h-8 text-green-500" />}
            </div>
          </div>
        ) : (
          // Text Input Controls
          <div className="flex items-center space-x-3">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              disabled={isProcessing}
              className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              rows={2}
            />
            <button
              onClick={handleTextSubmit}
              disabled={!textInput.trim() || isProcessing}
              className="flex items-center justify-center w-12 h-12 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Live Transcript */}
      {currentTranscript && inputMode === "voice" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Status:</h4>
          <p className="text-gray-700 italic">"{currentTranscript}"</p>
        </div>
      )}

      {/* Follow-up Questions */}
      {followUpQuestions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            Suggested Questions
          </h4>
          <div className="space-y-2">
            {followUpQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleFollowUpClick(question)}
                disabled={isProcessing}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50"
              >
                <p className="text-gray-700">{question}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conversation History */}
      {conversation.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            Conversation
          </h4>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {conversation.map((message, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  message.type === "user"
                    ? "bg-blue-50 border-l-4 border-blue-500"
                    : "bg-green-50 border-l-4 border-green-500"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {message.type === "user" ? "You" : "AI Assistant"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-700">{message.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
