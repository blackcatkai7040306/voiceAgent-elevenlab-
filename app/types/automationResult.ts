/**
 * Investment plan structure for retirement planning
 */
export interface InvestmentPlan {
  [key: string]: string
}

/**
 * Monthly income breakdown structure
 */
export interface MonthlyIncomeNet {
  [key: string]: string
}

/**
 * Total plan summary structure
 */
export interface TotalPlanSummary {
  [key: string]: string
}

/**
 * Complete automation result interface for retirement planning
 * All fields are strings as returned from the automation service
 */
export interface AutomationResult {
  /** Indicates if the automation was successful */
  success: boolean

  /** User's birthday in formatted string */
  birthday: string

  /** Planned retirement age */
  retirementAge: string

  /** Year of planned retirement */
  retirementYear: string

  /** Month of planned retirement */
  retirementMonth: string

  /** Estimated life expectancy */
  longevityEstimate: string

  /** Investment amount for retirement planning */
  investmentAmount: string

  /** Conservative investment plan details */
  plan1?: InvestmentPlan

  /** Aggressive investment plan details */
  plan2?: InvestmentPlan

  /** Total plan summary (plan3) */
  total?: TotalPlanSummary

  /** Monthly net income breakdown */
  monthlyIncomeNet?: MonthlyIncomeNet
}

/**
 * Type guard to check if data is a valid AutomationResult
 */
export const isAutomationResult = (data: any): data is AutomationResult => {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof data.success === "boolean" &&
    typeof data.birthday === "string" &&
    typeof data.retirementAge === "string" &&
    typeof data.retirementYear === "string" &&
    typeof data.retirementMonth === "string" &&
    typeof data.longevityEstimate === "string" &&
    typeof data.investmentAmount === "string"
  )
}
