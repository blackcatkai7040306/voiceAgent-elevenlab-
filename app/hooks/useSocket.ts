"use client"

import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"
import { AutomationResult, isAutomationResult } from "../types/automationResult"

const SOCKET_URL = "https://autoincome.theretirementpaycheck.com"

/**
 * Custom hook for managing socket connection and automation results
 * Provides real-time communication with the retirement planning automation service
 */
export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [automationResult, setAutomationResult] =
    useState<AutomationResult | null>(null)
  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {})

    const socket = socketRef.current

    // Connection event handlers
    socket.on("connect", () => {
      console.log("Connected to automation server")
      setIsConnected(true)
    })

    socket.on("disconnect", () => {
      console.log("Disconnected from automation server")
      setIsConnected(false)
    })

    // Automation result handler with type validation
    socket.on("automation-result", (data: unknown) => {
      console.log("Automation result received:", data)

      if (isAutomationResult(data)) {
        setAutomationResult(data)
        console.log("✅ Valid automation result processed successfully")
      } else {
        console.error("❌ Invalid automation result format:", data)
        // Optionally set an error state or show notification
      }
    })
    // Error handler
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
      setIsConnected(false)
    })

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  const reconnect = () => {
    if (socketRef.current) {
      socketRef.current.connect()
    }
  }

  return {
    isConnected,
    automationResult,
    reconnect,
    socket: socketRef.current,
  }
}
