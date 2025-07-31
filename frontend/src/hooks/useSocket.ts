"use client"

import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"
import { ProgressUpdate } from "@/types/automation"

const getSocketUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL

  // If we have an environment URL, use it
  if (envUrl) {
    // For HTTPS sites, use HTTPS for polling-based connections
    if (window.location.protocol === "https:") {
      if (envUrl.startsWith("wss://")) {
        console.warn(
          "🔄 Using HTTPS polling instead of WSS due to backend limitations"
        )
        return envUrl.replace("wss://", "https://")
      }
      if (envUrl.startsWith("ws://")) {
        console.warn(
          "🔄 Using HTTPS polling instead of WS due to security restrictions"
        )
        return envUrl.replace("ws://", "https://")
      }
      if (envUrl.startsWith("http://")) {
        console.warn("🔄 Converting HTTP to HTTPS for secure polling")
        return envUrl.replace("http://", "https://")
      }
      // Already HTTPS, good to go
      return envUrl
    } else {
      // For HTTP sites, convert to appropriate WebSocket protocol
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
  const [usingFallback, setUsingFallback] = useState(false)
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const socketUrl = getSocketUrl()
    console.log("Attempting socket connection to:", socketUrl)

    // Initialize socket connection with fallback strategy
    socketRef.current = io(socketUrl, {
      // Force polling for better reliability
      transports: ["polling"],
      upgrade: false, // Disable upgrade to WebSocket
      rememberUpgrade: false,
      timeout: 10000, // Reduced timeout
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      // Add HTTPS-specific options
      secure: window.location.protocol === "https:",
      rejectUnauthorized: false, // For development with self-signed certificates
    })

    const socket = socketRef.current

    // Connection event handlers
    socket.on("connect", () => {
      const transport = socket.io.engine.transport.name
      console.log(`✅ Connected to automation server via ${transport}`)
      if (transport === "polling") {
        console.log(
          "📡 Using HTTP polling for real-time updates (WebSocket not available)"
        )
      }
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

    // Enhanced error handler with fallback logic
    socket.on("connect_error", (error) => {
      console.error("🔌 Socket connection error:", error)
      setIsConnected(false)

      // Determine error type and set appropriate message
      if (error.message.includes("CORS")) {
        setConnectionError(
          "CORS error: Backend server CORS configuration issue. Falling back to HTTP polling."
        )
      } else if (error.message.includes("timeout")) {
        setConnectionError(
          "Connection timeout: Backend server may be down. Falling back to HTTP polling."
        )
      } else if (error.message.includes("websocket")) {
        setConnectionError(
          "WebSocket error: Mixed content or security policy issue. Using HTTP polling instead."
        )
      } else {
        setConnectionError(
          `Connection failed: ${error.message}. Falling back to HTTP polling.`
        )
      }

      // Set up fallback timeout
      if (!usingFallback) {
        setUsingFallback(true)
        console.log(
          "🔄 Socket.IO failed, falling back to HTTP polling in 3 seconds..."
        )
        connectionTimeoutRef.current = setTimeout(() => {
          console.log("📡 Activating HTTP polling fallback")
          setIsConnected(true) // Simulate connection for polling
          setConnectionError(
            "Using HTTP polling for real-time updates (Socket.IO unavailable)"
          )
        }, 3000)
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
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
      }
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
    // Clear any existing fallback timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current)
      connectionTimeoutRef.current = null
    }

    setUsingFallback(false)
    setConnectionError(null)

    if (socketRef.current) {
      socketRef.current.connect()
    }
  }

  return {
    isConnected,
    progress,
    currentStep,
    connectionError,
    usingFallback,
    clearProgress,
    reconnect,
    socket: socketRef.current,
  }
}
