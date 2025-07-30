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
    return process.env.NEXT_PUBLIC_SERVER_URL
  }

  // Fallback for production
  return "https://autoincome.theretirementpaycheck.com"
}

const API_BASE_URL = getApiBaseUrl()

console.log("API_BASE_URL:", API_BASE_URL) // Debug log
console.log("Environment:", process.env.NODE_ENV) // Debug log

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Reduced to 1 minute timeout to fail faster
  headers: {
    "Content-Type": "application/json",
  },
  // Add retry logic for network errors
  validateStatus: (status) => {
    // Accept 2xx and 3xx status codes
    return status < 400
  },
})

export const automationApi = {
  async startAutomation(
    formData: AutomationFormData
  ): Promise<AutomationResponse> {
    try {
      console.log("🚀 Starting automation request to:", API_BASE_URL)
      console.log("📋 Form data:", formData)

      const response = await apiClient.post<AutomationResponse>(
        "/start-automation",
        formData
      )
      return response.data
    } catch (error) {
      console.error("API Error:", error)

      if (axios.isAxiosError(error)) {
        // Handle specific error types
        if (error.code === "ERR_NETWORK" || error.code === "NETWORK_ERROR") {
          throw new Error(
            `❌ Cannot connect to automation server at ${API_BASE_URL}. ` +
              `Please ensure the backend server is running and accessible. ` +
              `Error: ${error.message}`
          )
        }

        if (
          error.code === "ECONNABORTED" ||
          error.message.includes("timeout")
        ) {
          throw new Error(
            `⏱️ Request timeout: The automation server took too long to respond. ` +
              `This might indicate the server is overloaded or not running.`
          )
        }

        if (error.response?.status === 504) {
          throw new Error(
            `🔌 Gateway timeout: The automation server is not responding. ` +
              `Please check if the backend service is running at ${API_BASE_URL}.`
          )
        }

        if (error.response?.status === 403 || error.message.includes("CORS")) {
          throw new Error(
            `🚫 CORS Error: The automation server is not configured to accept requests from this domain. ` +
              `Server: ${API_BASE_URL}`
          )
        }

        // Generic error with response
        if (error.response) {
          throw new Error(
            `❌ Server Error (${error.response.status}): ${
              error.response.data?.error || error.response.statusText
            }`
          )
        }

        // Generic axios error
        throw new Error(`❌ Request failed: ${error.message}`)
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
      const response = await apiClient.get("/health")
      console.log("✅ Health check successful:", response.data)
      return response.data
    } catch (error) {
      console.error("❌ Health check failed:", error)

      if (axios.isAxiosError(error)) {
        if (error.code === "ERR_NETWORK" || error.code === "NETWORK_ERROR") {
          throw new Error(
            `❌ Cannot reach automation server at ${API_BASE_URL}. ` +
              `The server may be offline or not accessible.`
          )
        }

        if (error.response?.status === 504) {
          throw new Error(
            `🔌 Server timeout: The automation server is not responding at ${API_BASE_URL}.`
          )
        }

        if (error.message.includes("CORS")) {
          throw new Error(
            `🚫 CORS Error: Server at ${API_BASE_URL} is not configured for this domain.`
          )
        }
      }

      throw new Error(
        `❌ Unable to connect to automation server at ${API_BASE_URL}`
      )
    }
  },
}

export default apiClient
