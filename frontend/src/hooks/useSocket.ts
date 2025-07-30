"use client"

import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"
import { ProgressUpdate } from "@/types/automation"

const getSocketUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL

  // If we have an environment URL, use it
  if (envUrl) {
    // Auto-fix common protocol mistakes
    if (envUrl.startsWith("https://")) {
      console.warn("⚠️ Converting HTTPS to WSS for WebSocket connection")
      return envUrl.replace("https://", "wss://")
    }
    if (envUrl.startsWith("http://")) {
      console.warn("⚠️ Converting HTTP to WS for WebSocket connection")
      return envUrl.replace("http://", "ws://")
    }
    return envUrl
  }

  // Auto-detect based on current page protocol
  if (typeof window !== "undefined") {
    const isHttps = window.location.protocol === "https:"
    const host = window.location.hostname

    // For localhost development
    if (host === "localhost" || host === "127.0.0.1") {
      // In development, prefer HTTP unless explicitly using HTTPS
      return isHttps ? `wss://localhost:3001` : `http://localhost:3001`
    }

    // For production deployments
    const protocol = isHttps ? "wss:" : "ws:"
    const port = isHttps ? "443" : "80"
    return `${protocol}//${host}:${port}`
  }

  // Fallback for SSR
  return "http://localhost:3001"
}

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [progress, setProgress] = useState<ProgressUpdate[]>([])
  const [currentStep, setCurrentStep] = useState<string>("")
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    const socketUrl = getSocketUrl()
    console.log("Attempting socket connection to:", socketUrl)

    // Initialize socket connection with enhanced configuration
    socketRef.current = io(socketUrl, {
      transports: ["websocket", "polling"],
      upgrade: true,
      rememberUpgrade: false,
      timeout: 20000,
      forceNew: true,
      // Add HTTPS-specific options
      secure: window.location.protocol === "https:",
      rejectUnauthorized: false, // For development with self-signed certificates
    })

    const socket = socketRef.current

    // Connection event handlers
    socket.on("connect", () => {
      console.log("✅ Connected to automation server")
      setIsConnected(true)
      setConnectionError(null)
    })

    socket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from automation server:", reason)
      setIsConnected(false)
      if (reason === "io server disconnect") {
        // Server-side disconnect, need manual reconnection
        setConnectionError("Server disconnected. Manual reconnection required.")
      }
    })

    // Progress update handler
    socket.on("automation-progress", (data: ProgressUpdate) => {
      console.log("📊 Progress update:", data)
      setProgress((prev) => [...prev, data])
      setCurrentStep(data.step)
    })

    // Enhanced error handler
    socket.on("connect_error", (error) => {
      console.error("🔌 Socket connection error:", error)
      setIsConnected(false)

      // Determine error type and set appropriate message
      if (error.message.includes("CORS")) {
        setConnectionError(
          "CORS error: Backend server CORS configuration issue."
        )
      } else if (error.message.includes("timeout")) {
        setConnectionError("Connection timeout: Backend server may be down.")
      } else if (error.message.includes("websocket")) {
        setConnectionError(
          "WebSocket error: Mixed content or security policy issue."
        )
      } else {
        setConnectionError(`Connection failed: ${error.message}`)
      }
    })

    // Additional socket events for better debugging
    socket.on("reconnect", (attemptNumber) => {
      console.log(`🔄 Reconnected after ${attemptNumber} attempts`)
      setConnectionError(null)
    })

    socket.on("reconnect_error", (error) => {
      console.error("🔄❌ Reconnection failed:", error)
      setConnectionError("Reconnection failed. Please check your connection.")
    })

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  const clearProgress = () => {
    setProgress([])
    setCurrentStep("")
  }

  const reconnect = () => {
    if (socketRef.current) {
      socketRef.current.connect()
    }
  }

  return {
    isConnected,
    progress,
    currentStep,
    connectionError,
    clearProgress,
    reconnect,
    socket: socketRef.current,
  }
}
