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
  generateConversationResponse,
  extractDataFromConversation,
  generateFollowUpQuestions,
  testOpenAIConnection,
} from "@/lib/openai-api"

export const VoiceAgent: React.FC<VoiceAgentProps> = ({
  onDataExtracted,
  onConversationUpdate,
  isRecording,
  setIsRecording,
}) => {
  const [isConnected, setIsConnected] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [conversation, setConversation] = useState<ConversationMessage[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [openAIConnected, setOpenAIConnected] = useState<boolean | null>(null)
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([])
  const [extractedData, setExtractedData] = useState<ExtractedUserData>({})
  const [textInput, setTextInput] = useState("")
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice")

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const deepgramSocketRef = useRef<WebSocket | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Test OpenAI connection on component mount
  useEffect(() => {
    async function checkOpenAIConnection() {
      const connected = await testOpenAIConnection()
      setOpenAIConnected(connected)
    }
    checkOpenAIConnection()
  }, [])

  // Initialize Deepgram connection
  useEffect(() => {
    initializeDeepgram()
    return () => {
      if (deepgramSocketRef.current) {
        deepgramSocketRef.current.close()
      }
    }
  }, [])

  // Send initial greeting when OpenAI connects
  useEffect(() => {
    if (openAIConnected && conversation.length === 0) {
      const initialGreeting =
        "Hello! I'm your AI financial planning assistant. I'm here to help you plan for your financial future. To get started, I'd love to learn a bit about you - could you tell me about your current situation or financial goals?"

      const greetingMessage: ConversationMessage = {
        type: "assistant",
        content: initialGreeting,
        timestamp: new Date(),
      }

      setConversation([greetingMessage])
      onConversationUpdate([`assistant: ${initialGreeting}`])
      speakText(initialGreeting)
    }
  }, [openAIConnected])

  const initializeDeepgram = async () => {
    try {
      // In a real implementation, you'd get this from environment variables
      const DEEPGRAM_API_KEY = "42a574c1a2aa036676d995c0f4e7120c723df1f3"

      const deepgramSocket = new WebSocket(
        `wss://api.deepgram.com/v1/listen?model=nova-2&language=en-US&smart_format=true&interim_results=true`,
        ["token", DEEPGRAM_API_KEY]
      )

      deepgramSocket.onopen = () => {
        console.log("Deepgram connection opened")
        setIsConnected(true)
      }

      deepgramSocket.onmessage = (event) => {
        const data = JSON.parse(event.data)

        if (data.channel?.alternatives?.[0]?.transcript) {
          const transcript = data.channel.alternatives[0].transcript

          if (data.is_final) {
            // Process final transcript
            processUserInput(transcript)
            setTranscript("")
          } else {
            // Update live transcript
            setTranscript(transcript)
          }
        }
      }

      deepgramSocket.onerror = (error) => {
        console.error("Deepgram error:", error)
        setIsConnected(false)
      }

      deepgramSocket.onclose = () => {
        console.log("Deepgram connection closed")
        setIsConnected(false)
      }

      deepgramSocketRef.current = deepgramSocket
    } catch (error) {
      console.error("Error initializing Deepgram:", error)
      setIsConnected(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)

          // Send audio data to Deepgram
          if (deepgramSocketRef.current?.readyState === WebSocket.OPEN) {
            deepgramSocketRef.current.send(event.data)
          }
        }
      }

      mediaRecorder.start(100) // Send data every 100ms
      setIsRecording(true)
    } catch (error) {
      console.error("Error starting recording:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop())
    }
    setIsRecording(false)
  }

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return

    await processUserInput(textInput)
    setTextInput("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleTextSubmit()
    }
  }

  const processUserInput = async (userInput: string) => {
    if (!userInput.trim()) return

    setIsProcessing(true)

    // Add user message to conversation
    const userMessage: ConversationMessage = {
      type: "user",
      content: userInput,
      timestamp: new Date(),
    }

    const updatedConversation = [...conversation, userMessage]
    setConversation(updatedConversation)

    try {
      if (!openAIConnected) {
        throw new Error("OpenAI service is not available")
      }

      // Use OpenAI API for conversation and data extraction
      const response = await generateConversationResponse(
        userInput,
        updatedConversation,
        extractedData
      )

      if (response.success) {
        // Update extracted data
        const mergedData = { ...extractedData, ...response.extractedData }
        setExtractedData(mergedData)
        onDataExtracted(mergedData)

        // Set follow-up questions
        setFollowUpQuestions(response.followUpQuestions || [])

        // Add AI response to conversation
        const aiMessage: ConversationMessage = {
          type: "assistant",
          content: response.aiResponse,
          timestamp: new Date(),
        }

        const finalConversation = [...updatedConversation, aiMessage]
        setConversation(finalConversation)

        // Update parent with conversation
        onConversationUpdate(
          finalConversation.map((msg) => `${msg.type}: ${msg.content}`)
        )

        // Convert AI response to speech
        await speakText(response.aiResponse)
      } else {
        throw new Error(response.error || "Failed to process conversation")
      }
    } catch (error) {
      console.error("Error processing user input:", error)

      // Fallback to basic response
      const fallbackResponse =
        "I'm sorry, I'm having trouble processing that right now. Could you please try again?"

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

      await speakText(fallbackResponse)
    } finally {
      setIsProcessing(false)
    }
  }

  const speakText = async (text: string) => {
    try {
      setIsPlaying(true)

      // Use ElevenLabs API for high-quality text-to-speech
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM`,
        {
          method: "POST",
          headers: {
            Accept: "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": "sk_8a53c6b4b716cc206df1806ef03ef165def50417ccec09eb",
          },
          body: JSON.stringify({
            text: text,
            model_id: "eleven_monolingual_v1",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5,
              style: 0.0,
              use_speaker_boost: true,
            },
          }),
        }
      )

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer()
        const audioContext = new AudioContext()

        const decodedData = await audioContext.decodeAudioData(audioBuffer)
        const source = audioContext.createBufferSource()
        source.buffer = decodedData
        source.connect(audioContext.destination)

        source.onended = () => {
          setIsPlaying(false)
        }

        source.start()
      } else {
        throw new Error(`ElevenLabs API error: ${response.statusText}`)
      }
    } catch (error) {
      console.error(
        "Error with ElevenLabs TTS, falling back to browser:",
        error
      )
      // Fallback to browser's built-in speech synthesis
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 1

      utterance.onend = () => {
        setIsPlaying(false)
      }

      speechSynthesis.speak(utterance)
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const handleFollowUpClick = async (question: string) => {
    await processUserInput(question)
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
            {/* Deepgram Status */}
            <div
              className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                isConnected
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full mr-2 ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              Speech: {isConnected ? "Connected" : "Disconnected"}
            </div>

            {/* OpenAI Status */}
            <div
              className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                openAIConnected === true
                  ? "bg-green-100 text-green-800"
                  : openAIConnected === false
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {openAIConnected === null ? (
                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
              ) : openAIConnected ? (
                <CheckCircle className="w-3 h-3 mr-2" />
              ) : (
                <AlertCircle className="w-3 h-3 mr-2" />
              )}
              AI:{" "}
              {openAIConnected === null
                ? "Testing..."
                : openAIConnected
                ? "Connected"
                : "Error"}
            </div>
          </div>
        </div>

        {(!isConnected || !openAIConnected) && (
          <p className="text-sm text-gray-600">
            {!isConnected && "Connecting to speech recognition service..."}
            {!openAIConnected && !isConnected && " & "}
            {!openAIConnected &&
              "OpenAI service unavailable - using fallback responses."}
          </p>
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
      {transcript && inputMode === "voice" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Live Transcript:
          </h4>
          <p className="text-gray-700 italic">"{transcript}"</p>
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
