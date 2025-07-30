export interface AutomationFormData {
  description: string
  sessionId: string
  customParam?: string
  notes?: string
  investmentAmount: string
  retirementAge: string
  longevityEstimate: string
  birthday: string
  retirementMonth?: string
  retirementYear?: string
  [key: string]: any
}

export interface ProgressUpdate {
  step: string
  message: string
  timestamp: string
  details?: {
    [key: string]: any
    monthlyIncomeNet?: string
    startOfPlanValues?: {
      value1?: string
      value2?: string
      value3?: string
    }
    targetValue1?: string
    targetValue2?: string
    referenceValue3?: string
    pageTitle?: string
    currentUrl?: string
  }
}

export interface AutomationResult {
  success: boolean
  pageTitle?: string
  currentUrl?: string
  timestamp?: string
  formData?: AutomationFormData
  message?: string
  error?: string
}

export interface AutomationResponse {
  success: boolean
  message: string
  result?: AutomationResult
  error?: string
}

export type AutomationStatus = "idle" | "running" | "completed" | "error"

export interface ExtractedData {
  monthlyIncomeNet?: string
  planValues?: {
    value1?: string
    value2?: string
    value3?: string
  }
}
