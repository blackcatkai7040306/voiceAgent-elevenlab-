/**
 * Component for displaying automation result data in a clean and smart format
 */
import { AutomationResult } from "../types/automationResult"

interface AutomationResultDisplayProps {
  data: AutomationResult
}

export function AutomationResultDisplay({
  data,
}: AutomationResultDisplayProps) {
  /**
   * Configuration for each plan with display names and styling
   */
  const planConfig = [
    {
      key: "plan1" as keyof AutomationResult,
      title: "First Plan",
      description: "Starter retirement package",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-800",
      amountColor: "text-blue-600",
    },
    {
      key: "plan2" as keyof AutomationResult,
      title: "Second Plan",
      description: "Enhanced retirement solution",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-800",
      amountColor: "text-green-600",
    },
    {
      key: "total" as keyof AutomationResult,
      title: "Total Plan",
      description: "Comprehensive retirement package",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-800",
      amountColor: "text-purple-600",
    },
  ]

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Automation Results
        </h2>
        <p className="text-gray-600">
          Your personalized retirement plan recommendations
        </p>
      </div>

      {/* Monthly Income Display */}
      <div className="mb-8 p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-orange-800 mb-2">
            Monthly Net Income
          </h3>
          <div className="text-3xl font-bold text-orange-600">
            {data.monthlyIncomeNet}
          </div>
          <p className="text-sm text-orange-700 mt-1">
            Your current monthly income after taxes
          </p>
        </div>
      </div>

      {/* Plans Grid */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {planConfig.map((plan) => (
          <div
            key={plan.key}
            className={`p-6 rounded-lg border-2 ${plan.bgColor} ${plan.borderColor} transition-transform hover:scale-105 hover:shadow-md`}
          >
            <div className="text-center">
              <h3 className={`text-xl font-bold ${plan.textColor} mb-2`}>
                {plan.title}
              </h3>
              <div className={`text-2xl font-bold ${plan.amountColor} mb-3`}>
                {data[plan.key]}
              </div>
              <p className={`text-sm ${plan.textColor} opacity-80`}>
                {plan.description}
              </p>
            </div>
          </div>
        ))}
      </div> */}

      {/* Additional Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600 text-center">
          💡 These recommendations are based on your current financial profile
          and goals. Consider consulting with a financial advisor for
          personalized advice.
        </p>
      </div>
    </div>
  )
}

/**
 * Loading state component for when automation result is being processed
 */
export function AutomationResultLoading() {
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Processing Your Data
        </h3>
        <p className="text-gray-500">
          Please wait while we analyze your financial information...
        </p>
      </div>
    </div>
  )
}

/**
 * Empty state component for when no automation result is available
 */
export function AutomationResultEmpty() {
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          No Results Yet
        </h3>
        <p className="text-gray-500">
          Start a conversation to receive your personalized retirement plan
          analysis
        </p>
      </div>
    </div>
  )
}
