"use client"

import React, { useState, useRef, useEffect } from "react"
import {
  Volume2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Mic,
  Play,
  StopCircle
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
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  const [extractedData, setExtractedData] = useState<ExtractedUserData>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("voiceAgentData")
      return saved ? JSON.parse(saved) : {}
    }
    return {}
  })

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState("")
  const [status, setStatus] = useState<"idle" | "listening" | "processing" | "speaking" | "complete">("idle")
  const [hasStarted, setHasStarted] = useState(false)

  const audioRecorderRef = useRef<{
    start: () => void
    stop: () => Promise<Blob>
    isRecording: () => boolean
  } | null>(null)
  const stopListeningRef = useRef(false)
  const sessionId = useRef(
    typeof window !== "undefined"
      ? localStorage.getItem("voiceAgentSessionId") || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      : `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  )

  const audioQueueRef = useRef<string[]>([])
  const isProcessingRef = useRef(false)
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null)

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return audioContextRef.current
  }

  const playAudioBuffer = async (buffer: ArrayBuffer) => {
    const audioContext = getAudioContext()
    
    try {
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }

      const decodedData = await audioContext.decodeAudioData(buffer.slice(0))
      currentAudioSourceRef.current = audioContext.createBufferSource()
      currentAudioSourceRef.current.buffer = decodedData
      currentAudioSourceRef.current.connect(audioContext.destination)

      return new Promise<void>((resolve) => {
        currentAudioSourceRef.current!.onended = () => {
          currentAudioSourceRef.current = null
          resolve()
        }
        currentAudioSourceRef.current!.start(0)
      })
    } catch (error) {
      console.error("❌ Error playing audio:", error)
      throw error
    }
  }

  const processAudioQueue = async () => {
    if (isProcessingRef.current || audioQueueRef.current.length === 0) return
    
    isProcessingRef.current = true
    setStatus("speaking")
    setIsPlaying(true)
    
    while (audioQueueRef.current.length > 0) {
      const text = audioQueueRef.current.shift()!
      try {
        const success = await convertTextToSpeech(text, sessionId.current)
        if (!success) {
          console.error("Failed to convert text to speech")
        }
      } catch (error) {
        console.error("Error in text-to-speech:", error)
      }
    }
    
    isProcessingRef.current = false
    setStatus("idle")
    setIsPlaying(false)
    
    if (!isAllDataCollected(extractedData)) {
      await transitionToListening()
    }
  }

  const queueSpeech = (text: string) => {
    audioQueueRef.current.push(text)
    if (!isProcessingRef.current) {
      processAudioQueue()
    }
  }

  const playResponse = (text: string) => {
    queueSpeech(text)
  }

  const transitionToListening = async () => {
    if (status !== "idle" || isAllDataCollected(extractedData)) return
    
    try {
      console.log("🎤 Transitioning to listening state...")
      setStatus("listening")
      await startListening()
    } catch (error) {
      console.error("❌ Error transitioning to listening:", error)
      setStatus("idle")
      setTimeout(() => transitionToListening(), 1000)
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.clear()
    }
  }, [])

  useEffect(() => {
    async function checkVoiceConnection() {
      try {
        const connected = await testVoiceConnection()
        setIsConnected(connected)
      } catch (error) {
        console.error("❌ Connection check failed:", error)
        setIsConnected(false)
      }
    }
    checkVoiceConnection()
    const interval = setInterval(checkVoiceConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("voiceAgentSessionId", sessionId.current)
      localStorage.setItem("voiceAgentConversation", JSON.stringify(conversation))
      localStorage.setItem("voiceAgentData", JSON.stringify(extractedData))
    }
  }, [conversation, extractedData])

  useEffect(() => {
    if (isAllDataCollected(extractedData)) {
      setStatus("complete")
      stopListeningRef.current = true
      if (typeof window !== "undefined") {
        localStorage.removeItem("voiceAgentConversation")
        localStorage.removeItem("voiceAgentData")
        localStorage.removeItem("voiceAgentSessionId")
      }
    }
  }, [extractedData])

  function isAllDataCollected(data: ExtractedUserData) {
    return !!(data.dateOfBirth && data.retirementDate && data.currentRetirementSavings)
  }

  const startConversation = async () => {
    if (hasStarted) return
    
    try {
      console.log("🎙️ Starting new conversation...")
      setHasStarted(true)
      stopListeningRef.current = false

      const initialGreeting = "Hi there this is Mark, who am I speaking with?"
      const greetingMessage: ConversationMessage = {
        type: "assistant",
        content: initialGreeting,
        timestamp: new Date(),
      }
      
      setConversation([greetingMessage])
      onConversationUpdate([`assistant: ${initialGreeting}`])
      
      playResponse(initialGreeting)
    } catch (error) {
      console.error("❌ Error starting conversation:", error)
      setStatus("idle")
      setHasStarted(false)
    }
  }

  const startListening = async () => {
    if (status !== "listening" || stopListeningRef.current) return

    try {
      audioRecorderRef.current = await recordAudio({ silenceTimeout: 1500, maxDuration: 20000 })
      setCurrentTranscript("Listening...")
      audioRecorderRef.current.start()
      
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current)
      }
      
      stopTimeoutRef.current = setTimeout(async () => {
        if (audioRecorderRef.current?.isRecording()) {
          await stopListening()
        }
      }, 10000)
    } catch (error) {
      console.error("❌ Error starting recording:", error)
      setCurrentTranscript("")
      setStatus("idle")
    }
  }

  const stopListening = async () => {
    if (!audioRecorderRef.current || status !== "listening") return
    
    try {
      setStatus("processing")
      setCurrentTranscript("Processing...")
      setIsProcessing(true)

      const audioBlob = await audioRecorderRef.current.stop()
      audioRecorderRef.current = null
      
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current)
        stopTimeoutRef.current = null
      }

      const result = await processVoiceInput(
        audioBlob,
        conversation,
        extractedData,
        sessionId.current
      )

      if (result.success && result.transcription.trim()) {
        setCurrentTranscript("")
        
        const updatedConversation: ConversationMessage[] = [
          ...conversation,
          { 
            type: "user", 
            content: result.transcription, 
            timestamp: new Date() 
          },
          { 
            type: "assistant", 
            content: result.aiResponse, 
            timestamp: new Date() 
          }
        ]
        
        setConversation(updatedConversation)
        const mergedData = { ...extractedData, ...result.extractedData }
        setExtractedData(mergedData)
        onDataExtracted(mergedData)
        onConversationUpdate(updatedConversation.map(msg => `${msg.type}: ${msg.content}`))

        if (!isAllDataCollected(mergedData)) {
          playResponse(result.aiResponse)
        }
      } else {
        throw new Error(result.error || "Voice processing failed")
      }
    } catch (error) {
      console.error("❌ Error processing voice input:", error)
      playResponse("I'm sorry, I didn't catch that. Could you please repeat?")
    } finally {
      setIsProcessing(false)
      audioRecorderRef.current = null
    }
  }

  const cleanupAudio = async () => {
    if (currentAudioSourceRef.current) {
      currentAudioSourceRef.current.stop()
      currentAudioSourceRef.current = null
    }
    
    if (audioContextRef.current) {
      await audioContextRef.current.close()
      audioContextRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      stopListeningRef.current = true
      if (audioRecorderRef.current?.isRecording()) {
        audioRecorderRef.current.stop().catch(console.error)
      }
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current)
      }
      cleanupAudio()
    }
  }, [])

  return (
    <div className="space-y-6">
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
          </div>
        )}
      </div>

      {!hasStarted && isConnected && !isAllDataCollected(extractedData) && (
        <div className="flex justify-center">
          <button
            onClick={startConversation}
            className="flex items-center justify-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Conversation
          </button>
        </div>
      )}

      {hasStarted && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center space-x-4">
          {status === "listening" && <><Mic className="w-8 h-8 text-blue-500 animate-pulse" /><span className="text-blue-700 font-medium">Listening...</span></>}
          {status === "processing" && <><Loader2 className="w-8 h-8 animate-spin text-blue-500" /><span className="text-blue-700 font-medium">Processing...</span></>}
          {status === "speaking" && <><Volume2 className="w-8 h-8 text-green-500 animate-pulse" /><span className="text-green-700 font-medium">Speaking...</span></>}
          {status === "complete" && <><CheckCircle className="w-8 h-8 text-green-500" /><span className="text-green-700 font-medium">All data collected!</span></>}
          {status === "idle" && <span className="text-gray-500">Ready to listen...</span>}
        </div>
      )}

      {currentTranscript && hasStarted && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Status:</h4>
          <p className="text-gray-700 italic">"{currentTranscript}"</p>
        </div>
      )}

      {conversation.length > 0 && hasStarted && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Conversation History</h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
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