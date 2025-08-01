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

  const [extractedData, setExtractedData] = useState<ExtractedUserData>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("voiceAgentData")
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          return {}
        }
      }
    }
    return {}
  })

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState("")
  const [status, setStatus] = useState<"waiting" | "listening" | "processing" | "speaking" | "complete">("waiting")
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

  // Add ref to track audio context
  const audioContextRef = useRef<AudioContext | null>(null);

  // Function to ensure audio context is closed
  const cleanupAudio = async () => {
    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  // Modified convertTextToSpeech wrapper
  const playResponse = async (text: string) => {
    try {
      setStatus("speaking");
      setIsPlaying(true);
      await cleanupAudio(); // Ensure previous audio is cleaned up
      await convertTextToSpeech(text);
    } finally {
      setIsPlaying(false);
      setStatus("waiting"); // Reset status after speaking
    }
  };

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

  // Persist session ID and conversation data
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("voiceAgentSessionId", sessionId.current)
      localStorage.setItem("voiceAgentConversation", JSON.stringify(conversation))
      localStorage.setItem("voiceAgentData", JSON.stringify(extractedData))
    }
  }, [conversation, extractedData])

  // Clear data when complete
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

  // Helper: check if all required data is collected
  function isAllDataCollected(data: ExtractedUserData) {
    return !!(data.dateOfBirth && data.retirementDate && data.currentRetirementSavings)
  }

  // Start the conversation
  const startConversation = async () => {
    setHasStarted(true)
    stopListeningRef.current = false // Reset stop flag
    if (conversation.length === 0) {
      const initialGreeting = "Hi there this is Mark, who am I speaking with?"
      const greetingMessage: ConversationMessage = {
        type: "assistant",
        content: initialGreeting,
        timestamp: new Date(),
      }
      setConversation([greetingMessage])
      onConversationUpdate([`assistant: ${initialGreeting}`])
      
      await playResponse(initialGreeting);
      await new Promise(resolve => setTimeout(resolve, 500));
      await startListening();
    } else {
      // Resume from existing conversation
      if (!isAllDataCollected(extractedData)) {
        await startListening()
      }
    }
  }

  // Start listening (recording)
  const startListening = async () => {
    if (!hasStarted || stopListeningRef.current || isAllDataCollected(extractedData)) {
      return;
    }

    // Don't start listening if we're still speaking
    if (isPlaying) {
      setTimeout(() => startListening(), 500);
      return;
    }

    // Ensure we're not already recording
    if (audioRecorderRef.current?.isRecording()) {
      return;
    }

    await cleanupAudio(); // Ensure audio context is cleaned up
    setStatus("listening");
    setCurrentTranscript("Listening...");

    try {
      audioRecorderRef.current = await recordAudio();
      audioRecorderRef.current.start();
      
      // Automatically stop after 6 seconds
      setTimeout(async () => {
        if (audioRecorderRef.current?.isRecording()) {
          await stopListening();
        }
      }, 6000);
    } catch (error) {
      console.error("❌ Error starting recording:", error);
      setStatus("waiting");
      setCurrentTranscript("");
      if (!stopListeningRef.current && !isAllDataCollected(extractedData)) {
        setTimeout(() => startListening(), 1000);
      }
    }
  };

  // Stop listening and process audio
  const stopListening = async () => {
    if (!audioRecorderRef.current) return;
    
    try {
      setStatus("processing");
      setCurrentTranscript("Processing...");
      setIsProcessing(true);

      const audioBlob = await audioRecorderRef.current.stop();
      audioRecorderRef.current = null;

      const result = await processVoiceInput(
        audioBlob,
        conversation,
        extractedData,
        sessionId.current
      );

      if (result.success && result.transcription.trim()) {
        setCurrentTranscript("");
        const userMessage: ConversationMessage = {
          type: "user",
          content: result.transcription,
          timestamp: new Date(),
        };
        const aiMessage: ConversationMessage = {
          type: "assistant",
          content: result.aiResponse,
          timestamp: new Date(),
        };

        const updatedConversation = [...conversation, userMessage, aiMessage];
        setConversation(updatedConversation);
        const mergedData = { ...extractedData, ...result.extractedData };
        setExtractedData(mergedData);
        onDataExtracted(mergedData);
        onConversationUpdate(
          updatedConversation.map((msg) => `${msg.type}: ${msg.content}`)
        );

        // Play AI response and then start listening again
        await playResponse(result.aiResponse);
        
        if (!isAllDataCollected(mergedData)) {
          await new Promise(resolve => setTimeout(resolve, 500));
          await startListening();
        } else {
          setStatus("complete");
        }
      } else {
        throw new Error(result.error || "Voice processing failed");
      }
    } catch (error) {
      console.error("❌ Error processing voice input:", error);
      setCurrentTranscript("");
      setStatus("waiting");
      
      if (!isPlaying) {
        await playResponse("I'm sorry, I had trouble processing that. Could you please try again?");
      }

      if (!isAllDataCollected(extractedData)) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await startListening();
      }
    } finally {
      setIsProcessing(false);
      audioRecorderRef.current = null;
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopListeningRef.current = true;
      if (audioRecorderRef.current?.isRecording()) {
        audioRecorderRef.current.stop();
      }
      cleanupAudio();
    };
  }, []);

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
          </div>
        )}
      </div>

      {/* Start Conversation Button */}
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

      {/* Status Indicator */}
      {hasStarted && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center space-x-4">
          {status === "listening" && <><Mic className="w-8 h-8 text-blue-500 animate-pulse" /><span className="text-blue-700 font-medium">Listening...</span></>}
          {status === "processing" && <><Loader2 className="w-8 h-8 animate-spin text-blue-500" /><span className="text-blue-700 font-medium">Processing...</span></>}
          {status === "speaking" && <><Volume2 className="w-8 h-8 text-green-500 animate-pulse" /><span className="text-green-700 font-medium">Speaking...</span></>}
          {status === "complete" && <><CheckCircle className="w-8 h-8 text-green-500" /><span className="text-green-700 font-medium">All data collected!</span></>}
          {status === "waiting" && <span className="text-gray-500">Waiting to start...</span>}
        </div>
      )}

      {/* Live Transcript */}
      {currentTranscript && hasStarted && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Status:</h4>
          <p className="text-gray-700 italic">"{currentTranscript}"</p>
        </div>
      )}

      {/* Conversation History */}
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
