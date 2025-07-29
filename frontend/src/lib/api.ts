import axios from "axios"
import { AutomationFormData, AutomationResponse } from "@/types/automation"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes timeout for long-running automation
  headers: {
    "Content-Type": "application/json",
  },
})

export const automationApi = {
  async startAutomation(
    formData: AutomationFormData
  ): Promise<AutomationResponse> {
    try {
      const response = await apiClient.post<AutomationResponse>(
        "/start-automation",
        formData
      )
      return response.data
    } catch (error) {
      console.error("API Error:", error)
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message)
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
      const response = await apiClient.get("/health")
      return response.data
    } catch (error) {
      console.error("Health check failed:", error)
      throw new Error("Unable to connect to automation server")
    }
  },
}

export default apiClient
