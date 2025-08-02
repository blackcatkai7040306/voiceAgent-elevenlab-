"use client"

import React, { useState, useRef, useEffect } from "react"
import {
  Volume2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Mic,
  Play,
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
}) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [conversation, setConversation] = useState<ConversationMessage[]>([])
  const [extractedData, setExtractedData] = useState<ExtractedUserData>({})
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
  const sessionId = useRef(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const audioQueueRef = useRef<string[]>([])
  const isProcessingRef = useRef(false)
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Start/stop conversation handlers
  const startConversation = async () => {
    if (hasStarted) return
    
    try {
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
      console.error("Error starting conversation:", error)
      setStatus("idle")
      setHasStarted(false)
    }
  }

  const stopConversation = () => {
    stopListeningRef.current = true
    setStatus("complete")
    setHasStarted(false)
  }

  // Audio processing queue
  const processAudioQueue = async () => {
    if (isProcessingRef.current || audioQueueRef.current.length === 0) return
    
    isProcessingRef.current = true
    console.log("Starting audio queue processing")
    setStatus("speaking")
    setIsPlaying(true)
    
    try {
      while (audioQueueRef.current.length > 0) {
        const text = audioQueueRef.current.shift()!
        try {
          await convertTextToSpeech(text, sessionId.current)
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (error) {
          console.error("Text-to-speech error:", error)
        }
      }
    } finally {
      console.log("Finished audio queue processing")
      isProcessingRef.current = false
      setIsPlaying(false)
      
      if (!isAllDataCollected(extractedData)) {
        console.log("Starting listening after speech")
        startListening().catch(error => {
          console.error("Failed to start listening:", error)
          setStatus("idle")
        })
      } else {
        setStatus("complete")
      }
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

  // Recording handlers
  const startListening = async () => {
    console.log("Attempting to start listening, current status:", status)
    if (stopListeningRef.current) {
      console.log("Cannot start listening: recording is stopped")
      return
    }

    try {
      setStatus("listening")
      setCurrentTranscript("Listening...")
      
      // Create and start recording with adjusted settings
      audioRecorderRef.current = await recordAudio({ 
        silenceTimeout: 2000, // Increased to 2 seconds for better speech detection
        maxDuration: 15000,   // Increased to 15 seconds max
        silenceThreshold: -50 // Adjust silence sensitivity
      })
      
      let recordingStartTime = Date.now()
      let hasAudioData = false

      // Monitor recording status
      const checkAudio = setInterval(() => {
        if (audioRecorderRef.current?.isRecording()) {
          const duration = Date.now() - recordingStartTime
          if (duration > 1000) { // After 1 second of recording
            hasAudioData = true
          }
        }
      }, 100)

      audioRecorderRef.current.start()
      console.log("Started recording with adjusted settings")
      
      // Auto-stop after max duration
      stopTimeoutRef.current = setTimeout(() => {
        clearInterval(checkAudio)
        console.log("Max duration reached, stopping recording...")
        if (audioRecorderRef.current?.isRecording()) {
          stopListening().catch(error => {
            console.error("Error stopping recording:", error)
            setStatus("idle")
          })
        }
      }, 15000)

      // Set up manual stop after silence
      setTimeout(async () => {
        if (audioRecorderRef.current?.isRecording() && hasAudioData) {
          clearInterval(checkAudio)
          console.log("Manual stop after sufficient audio...")
          await stopListening()
        }
      }, 5000) // Stop after 5 seconds if we have audio

    } catch (error) {
      console.error("Error starting recording:", error)
      setStatus("idle")
      setCurrentTranscript("")
    }
  }

  const stopListening = async () => {
    console.log("Stopping listening, current status:", status)
    if (!audioRecorderRef.current?.isRecording()) {
      console.log("No active recording to stop")
      return
    }
    
    try {
      // Set processing state immediately
      setStatus("processing")
      setCurrentTranscript("Processing your speech...")
      setIsProcessing(true)

      console.log("Stopping recording and getting audio...")
      const audioBlob = await audioRecorderRef.current.stop()
      console.log("Got audio blob, size:", audioBlob.size, "type:", audioBlob.type)

      // Process the audio if we have enough data
      if (audioBlob.size > 1000) {
        console.log("Processing voice input with size:", audioBlob.size)
        const result = await processVoiceInput(
          audioBlob,
          conversation,
          extractedData,
          sessionId.current
        )
        console.log("Voice processing result:", result)

        if (result.success && result.transcription.trim()) {
          console.log("Valid transcription received:", result.transcription)
          setCurrentTranscript("")
          
          const updatedConversation: ConversationMessage[] = [
            ...conversation,
            { type: "user" as const, content: result.transcription, timestamp: new Date() },
            { type: "assistant" as const, content: result.aiResponse, timestamp: new Date() }
          ]
          
          setConversation(updatedConversation)
          setExtractedData(prev => ({ ...prev, ...result.extractedData }))
          onDataExtracted(result.extractedData)
          onConversationUpdate(updatedConversation.map(m => `${m.type}: ${m.content}`))

          if (!isAllDataCollected(result.extractedData)) {
            playResponse(result.aiResponse)
          } else {
            setStatus("complete")
          }
          return
        } else {
          console.log("No valid transcription in result:", result)
        }
      } else {
        console.log("Audio blob too small:", audioBlob.size, "bytes")
      }

      // If we get here, either the recording was too short or processing failed
      console.log("Recording failed to process, retrying...")
      setStatus("idle")
      setTimeout(() => startListening(), 500)

    } catch (error) {
      console.error("Error processing voice input:", error)
      setStatus("idle")
      playResponse("Sorry, I didn't catch that. Could you please repeat?")
    } finally {
      setIsProcessing(false)
      audioRecorderRef.current = null
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current)
        stopTimeoutRef.current = null
      }
    }
  }

  // Helper functions
  function isAllDataCollected(data: ExtractedUserData) {
    return !!(data.dateOfBirth && data.retirementDate && data.currentRetirementSavings)
  }

  // Effects
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const connected = await testVoiceConnection()
        setIsConnected(connected)
      } catch (error) {
        console.error("Connection check failed:", error)
        setIsConnected(false)
      }
    }
    
    checkConnection()
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    return () => {
      stopListeningRef.current = true
      if (audioRecorderRef.current?.isRecording()) {
        audioRecorderRef.current.stop().catch(console.error)
      }
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Connection status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Voice Agent Status</h3>
          <div className="flex items-center space-x-3">
            <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              isConnected === true ? "bg-green-100 text-green-800" :
              isConnected === false ? "bg-red-100 text-red-800" :
              "bg-yellow-100 text-yellow-800"
            }`}>
              {isConnected === null ? (
                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
              ) : isConnected ? (
                <CheckCircle className="w-3 h-3 mr-2" />
              ) : (
                <AlertCircle className="w-3 h-3 mr-2" />
              )}
              Voice Service: {isConnected === null ? "Testing..." : isConnected ? "Connected" : "Disconnected"}
            </div>
          </div>
        </div>
        {isConnected === false && (
          <p className="text-sm text-gray-600">
            ⚠️ Voice service is unavailable. Please check your internet connection.
          </p>
        )}
      </div>

      {/* Start button */}
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

      {/* Status indicator */}
      {hasStarted && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center space-x-4">
          {status === "listening" && <><Mic className="w-8 h-8 text-blue-500 animate-pulse" /><span>Listening...</span></>}
          {status === "processing" && <><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /><span>Processing...</span></>}
          {status === "speaking" && <><Volume2 className="w-8 h-8 text-green-500 animate-pulse" /><span>Speaking...</span></>}
          {status === "complete" && <><CheckCircle className="w-8 h-8 text-green-500" /><span>Complete!</span></>}
          {status === "idle" && <span>Ready</span>}
        </div>
      )}

      {/* Transcript */}
      {currentTranscript && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-700 italic">"{currentTranscript}"</p>
        </div>
      )}

      {/* Conversation history */}
      {conversation.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Conversation</h4>
          <div className="space-y-3">
            {conversation.map((msg, i) => (
              <div key={i} className={`p-3 rounded-lg ${
                msg.type === "user" ? "bg-blue-50 border-l-4 border-blue-500" : "bg-green-50 border-l-4 border-green-500"
              }`}>
                <div className="font-medium">{msg.type === "user" ? "You" : "Assistant"}</div>
                <p>{msg.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}