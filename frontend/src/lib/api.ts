import axios from "axios"
import { AutomationFormData, AutomationResponse } from "@/types/automation"

// Determine API base URL with fallback logic
const getApiBaseUrl = () => {
  // Check if we're in development
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3001"
  }

  // Use environment variable if available
  if (process.env.NEXT_PUBLIC_SERVER_URL) {
    let url = process.env.NEXT_PUBLIC_SERVER_URL
    // Remove trailing /api if present (common mistake)
    if (url.endsWith("/api")) {
      url = url.slice(0, -4)
      console.log("⚠️ Removed /api suffix from NEXT_PUBLIC_SERVER_URL:", url)
    }
    return url
  }

  // Fallback for production
  return "https://autoincome.theretirementpaycheck.com"
}

const API_BASE_URL = getApiBaseUrl()

console.log("API_BASE_URL:", API_BASE_URL) // Debug log
console.log("Environment:", process.env.NODE_ENV) // Debug log

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 600000, // 10 minutes timeout for browser automation
  headers: {
    "Content-Type": "application/json",
  },
  // Add retry logic for network errors
  validateStatus: (status) => {
    // Accept 2xx and 3xx status codes
    return status < 400
  },
})

// Create a separate client for quick health checks
const healthClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds for health checks
  headers: {
    "Content-Type": "application/json",
  },
})

export const automationApi = {
  async startAutomation(
    formData: AutomationFormData
  ): Promise<AutomationResponse> {
    try {
      console.log("🚀 Starting automation request to:", API_BASE_URL)
      console.log("📋 Form data:", formData)
      console.log(
        "⏱️ Timeout set to: 10 minutes (browser automation can take time)"
      )

      const response = await apiClient.post<AutomationResponse>(
        "/start-automation",
        formData
      )

      console.log("✅ Automation request completed successfully")
      return response.data
    } catch (error) {
      // Log detailed error for debugging (developers can see this in console)
      console.error("🔧 Technical Error Details:", {
        message: axios.isAxiosError(error) ? error.message : String(error),
        code: axios.isAxiosError(error) ? error.code : "UNKNOWN",
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
        url: `${API_BASE_URL}/start-automation`,
        timestamp: new Date().toISOString(),
      })

      if (axios.isAxiosError(error)) {
        // Handle specific error types with user-friendly messages
        if (error.code === "ERR_NETWORK" || error.code === "NETWORK_ERROR") {
          throw new Error(
            `🔌 Unable to connect to the automation service. Please try again in a few moments.`
          )
        }

        if (
          error.code === "ECONNABORTED" ||
          error.message.includes("timeout")
        ) {
          throw new Error(
            `⏱️ The automation process is taking longer than expected. Please try again.`
          )
        }

        if (error.response?.status === 504) {
          throw new Error(
            `🔌 The automation service is temporarily unavailable. Please try again in a few minutes.`
          )
        }

        if (error.response?.status === 403 || error.message.includes("CORS")) {
          throw new Error(
            `🚫 Access denied. Please refresh the page and try again.`
          )
        }

        // Generic error with response
        if (error.response) {
          throw new Error(
            `❌ Automation failed. Please try again. (Error ${error.response.status})`
          )
        }

        // Generic axios error
        throw new Error(`❌ Something went wrong. Please try again.`)
      }

      throw error
    }
  },

  async checkHealth(): Promise<{
    status: string
    timestamp: string
    port: number
  }> {
    try {
      console.log("🏥 Checking health at:", API_BASE_URL)
      const response = await healthClient.get("/health")
      console.log("✅ Health check successful:", response.data)
      return response.data
    } catch (error) {
      // Log detailed error for debugging (developers can see this in console)
      console.error("🔧 Health Check Technical Details:", {
        message: axios.isAxiosError(error) ? error.message : String(error),
        code: axios.isAxiosError(error) ? error.code : "UNKNOWN",
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
        url: `${API_BASE_URL}/health`,
        timestamp: new Date().toISOString(),
      })

      if (axios.isAxiosError(error)) {
        if (error.code === "ERR_NETWORK" || error.code === "NETWORK_ERROR") {
          throw new Error(`🔌 Service unavailable. Please try again later.`)
        }

        if (error.response?.status === 504) {
          throw new Error(
            `⏱️ Service timeout. Please try again in a few minutes.`
          )
        }

        if (error.message.includes("CORS")) {
          throw new Error(`🚫 Access denied. Please refresh the page.`)
        }
      }

      throw new Error(`❌ Service unavailable. Please try again later.`)
    }
  },
}

export default apiClient
