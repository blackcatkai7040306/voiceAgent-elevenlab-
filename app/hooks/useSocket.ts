"use client"

import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"
import { AutomationResultState } from "../types/automationResult"

const SOCKET_URL = "https://autoincome.theretirementpaycheck.com"

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [automationResult, setAutomationResult] =
    useState<AutomationResultState>(null)
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

    // Progress update handler

    socket.on("automation-result", (data) => {
      console.log("Automation result:", data)
      setAutomationResult(data)
      // Handle progress updates in your UI
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
