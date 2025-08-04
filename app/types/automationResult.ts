/**
 * Interface for automation result data received via socket
 */
export interface AutomationResult {
  plan1: string
  plan2: string
  plan3: string
  monthlyIncomeNet: string
}

/**
 * Type for the automation result state (can be null when no data received yet)
 */
export type AutomationResultState = AutomationResult | null
