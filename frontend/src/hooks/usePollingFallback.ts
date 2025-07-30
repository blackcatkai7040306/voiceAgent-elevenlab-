"use client"

import { useEffect, useRef, useState } from "react"
import { ProgressUpdate } from "@/types/automation"

const POLLING_INTERVAL = 2000 // Poll every 2 seconds

export const usePollingFallback = (sessionId?: string) => {
  const [isConnected, setIsConnected] = useState(false)
  const [progress, setProgress] = useState<ProgressUpdate[]>([])
  const [currentStep, setCurrentStep] = useState<string>("")
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastProgressRef = useRef<number>(0)

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

  const pollProgress = async () => {
    if (!sessionId) return

    try {
      const response = await fetch(
        `${baseUrl}/api/automation/progress/${sessionId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success && data.progress) {
        // Only update if we have new progress
        if (data.progress.length > lastProgressRef.current) {
          const newProgress = data.progress.slice(lastProgressRef.current)
          setProgress((prev) => [...prev, ...newProgress])
          lastProgressRef.current = data.progress.length

          // Update current step
          if (newProgress.length > 0) {
            setCurrentStep(newProgress[newProgress.length - 1].step)
          }
        }
      }

      setIsConnected(true)
      setConnectionError(null)
    } catch (error) {
      console.error("Polling error:", error)
      setIsConnected(false)
      setConnectionError(
        `Polling failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      )
    }
  }

  const startPolling = (newSessionId: string) => {
    console.log("🔄 Starting HTTP polling fallback for session:", newSessionId)

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Reset state
    setProgress([])
    setCurrentStep("")
    lastProgressRef.current = 0

    // Start polling
    intervalRef.current = setInterval(pollProgress, POLLING_INTERVAL)

    // Poll immediately
    pollProgress()
  }

  const stopPolling = () => {
    console.log("⏹️ Stopping HTTP polling")
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsConnected(false)
  }

  const clearProgress = () => {
    setProgress([])
    setCurrentStep("")
    lastProgressRef.current = 0
  }

  const reconnect = () => {
    if (sessionId) {
      startPolling(sessionId)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    isConnected,
    progress,
    currentStep,
    connectionError,
    startPolling,
    stopPolling,
    clearProgress,
    reconnect,
  }
}
