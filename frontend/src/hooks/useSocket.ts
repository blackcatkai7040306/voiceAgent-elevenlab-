"use client"

import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"
import { ProgressUpdate } from "@/types/automation"

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [progress, setProgress] = useState<ProgressUpdate[]>([])
  const [currentStep, setCurrentStep] = useState<string>("")

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    })

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
    socket.on("automation-progress", (data: ProgressUpdate) => {
      console.log("Progress update:", data)
      setProgress((prev) => [...prev, data])
      setCurrentStep(data.step)
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
    clearProgress,
    reconnect,
    socket: socketRef.current,
  }
}
