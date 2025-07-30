"use client"

import React, { useState, useEffect } from "react"
import {
  Play,
  Square,
  AlertTriangle,
  DollarSign,
  Calendar,
  Clock,
  Cake,
  User,
  MessageCircle,
} from "lucide-react"
import { AutomationStatus, AutomationFormData } from "@/types/automation"

interface VoiceExtractedData {
  firstName?: string
  dateOfBirth?: string
  retirementDate?: string
  currentRetirementSavings?: string | number
}

interface VoiceDataDisplayProps {
  onStart: (formData: AutomationFormData) => void
  onStop: () => void
  status: AutomationStatus
  isConnected: boolean
  voiceData?: VoiceExtractedData
}

export const VoiceDataDisplay: React.FC<VoiceDataDisplayProps> = ({
  onStart,
  onStop,
  status,
  isConnected,
  voiceData,
}) => {
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null)
  const [calculatedRetirementAge, setCalculatedRetirementAge] = useState<
    number | null
  >(null)
  const [displayRetirementDate, setDisplayRetirementDate] = useState<string>("")
  const [formData, setFormData] = useState<AutomationFormData>({
    description: "Income Conductor automation workflow",
    sessionId: Date.now().toString(),
    investmentAmount: "130000",
    retirementAge: "62",
    longevityEstimate: "100",
    birthday: "07/01/1967",
    retirementMonth: "1",
    retirementYear: "2030",
  })

  // Helper function to convert month name to number
  const getMonthNumber = (monthName: string): number => {
    const months: { [key: string]: number } = {
      january: 1,
      february: 2,
      march: 3,
      april: 4,
      may: 5,
      june: 6,
      july: 7,
      august: 8,
      september: 9,
      october: 10,
      november: 11,
      december: 12,
    }
    return months[monthName.toLowerCase()] || 1
  }

  // Helper function to extract retirement month and year from retirement date
  const extractRetirementMonthYear = (
    retirementDate: string,
    birthday?: string
  ): { month: string; year: string } => {
    console.log("🔧 extractRetirementMonthYear called with:", {
      retirementDate,
      birthday,
    })

    if (!retirementDate) {
      console.log("❌ No retirement date provided, using defaults")
      return { month: "1", year: "2030" } // Default values
    }

    const dateStr = retirementDate.trim()
    console.log("📋 Processing date string:", dateStr)

    // Handle year only (e.g., "2030")
    if (dateStr.match(/^\d{4}$/)) {
      console.log("✅ Detected year-only format:", dateStr)
      return { month: "1", year: dateStr } // Default to January
    }

    // Handle month/year (e.g., "06/2030", "6/2030")
    if (dateStr.match(/^\d{1,2}\/\d{4}$/)) {
      const [month, year] = dateStr.split("/")
      console.log("✅ Detected month/year format:", { month, year })
      return { month: month, year: year }
    }

    // Handle age (e.g., "65") - calculate year from birthday
    if (
      dateStr.match(/^\d{1,2}$/) &&
      parseInt(dateStr) >= 50 &&
      parseInt(dateStr) <= 100
    ) {
      console.log("✅ Detected age format:", dateStr)
      if (birthday) {
        try {
          const birthDate = new Date(birthday)
          const targetAge = parseInt(dateStr)
          const retirementYear = birthDate.getFullYear() + targetAge
          console.log("🎯 Calculated retirement year from age:", {
            birthday,
            targetAge,
            birthYear: birthDate.getFullYear(),
            retirementYear,
          })
          return { month: "1", year: retirementYear.toString() } // Default to January
        } catch (error) {
          console.log("❌ Error calculating year from birthday:", error)
          // Fallback
        }
      }
      // If no birthday or calculation failed, estimate
      const currentYear = new Date().getFullYear()
      const estimatedRetirementYear = currentYear + parseInt(dateStr) - 30 // Rough estimate
      console.log("⚠️ No birthday, estimating retirement year:", {
        currentYear,
        age: parseInt(dateStr),
        estimatedRetirementYear,
      })
      return { month: "1", year: estimatedRetirementYear.toString() }
    }

    // Handle descriptive with age (e.g., "age 65", "at age 62")
    const ageMatch = dateStr.match(/(?:age|at age)\s*(\d{1,2})/i)
    if (ageMatch && birthday) {
      console.log("✅ Detected descriptive age format:", ageMatch[1])
      try {
        const birthDate = new Date(birthday)
        const targetAge = parseInt(ageMatch[1])
        const retirementYear = birthDate.getFullYear() + targetAge
        console.log("🎯 Calculated retirement year from descriptive age:", {
          birthday,
          targetAge,
          retirementYear,
        })
        return { month: "1", year: retirementYear.toString() }
      } catch (error) {
        console.log("❌ Error calculating year from descriptive age:", error)
        // Fallback
      }
    }

    // Handle "in X years"
    const yearsMatch = dateStr.match(/in\s*(\d+)\s*years?/i)
    if (yearsMatch) {
      const yearsFromNow = parseInt(yearsMatch[1])
      const currentYear = new Date().getFullYear()
      const retirementYear = currentYear + yearsFromNow
      console.log("✅ Detected 'in X years' format:", {
        yearsFromNow,
        currentYear,
        retirementYear,
      })
      return { month: "1", year: retirementYear.toString() }
    }

    // Try to parse as a full date
    try {
      const date = new Date(dateStr)
      if (
        !isNaN(date.getTime()) &&
        date.getFullYear() > 1900 &&
        date.getFullYear() < 2100
      ) {
        const month = (date.getMonth() + 1).toString()
        const year = date.getFullYear().toString()
        console.log("✅ Parsed as full date:", { dateStr, month, year })
        return { month, year }
      }
    } catch (error) {
      console.log("❌ Error parsing as full date:", error)
      // Continue to fallback
    }

    // Default fallback
    console.log("⚠️ Using default fallback values")
    return { month: "1", year: "2030" }
  }

  // Helper function to calculate age from birthday
  const calculateAge = (birthday: string): number => {
    if (!birthday) return 0
    const birthDate = new Date(birthday)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--
    }
    return age
  }

  // Helper function to calculate retirement age from birthday and retirement date
  const calculateRetirementAge = (
    birthday: string,
    retirementDate: string
  ): number => {
    if (!birthday || !retirementDate) return 0

    const dateStr = retirementDate.trim()

    // If it's just an age, return it directly
    if (
      dateStr.match(/^\d{1,2}$/) &&
      parseInt(dateStr) >= 50 &&
      parseInt(dateStr) <= 100
    ) {
      return parseInt(dateStr)
    }

    // If it contains "age" keyword, extract the age
    const ageMatch = dateStr.match(/(?:age|at age)\s*(\d{1,2})/i)
    if (ageMatch) {
      return parseInt(ageMatch[1])
    }

    // If "in X years", calculate based on current age
    const inYearsMatch = dateStr.match(/in\s+(\d+)\s+years?/i)
    if (inYearsMatch) {
      const yearsFromNow = parseInt(inYearsMatch[1])
      const currentAge = calculateAge(birthday)
      return currentAge + yearsFromNow
    }

    // Try to parse as date and calculate age difference
    try {
      let retireDate: Date

      // If it's just a year, assume January 1st
      if (dateStr.match(/^\d{4}$/)) {
        retireDate = new Date(`${dateStr}-01-01`)
      } else if (dateStr.match(/^([A-Za-z]+)\s+(\d{4})$/)) {
        // Month and year format
        retireDate = new Date(dateStr + " 1")
      } else {
        retireDate = new Date(dateStr)
      }

      const birthDate = new Date(birthday)

      if (!isNaN(retireDate.getTime()) && !isNaN(birthDate.getTime())) {
        const calculatedAge = retireDate.getFullYear() - birthDate.getFullYear()

        // Ensure the calculated age is reasonable
        if (calculatedAge >= 50 && calculatedAge <= 100) {
          return calculatedAge
        }
      }
    } catch {
      // Continue to fallback
    }

    // If all else fails, try to extract any number that looks like a retirement age
    const numberMatch = dateStr.match(/(\d{2,3})/)
    if (numberMatch) {
      const possibleAge = parseInt(numberMatch[1])
      if (possibleAge >= 50 && possibleAge <= 100) {
        return possibleAge
      }
    }

    return 0
  }

  // Helper function to format retirement date (add January if no month specified)
  const formatRetirementDate = (retirementDate: string): string => {
    if (!retirementDate) return ""

    const dateStr = retirementDate.trim()

    // If it's just a year (e.g., "2030"), add January 1st
    if (dateStr.match(/^\d{4}$/)) {
      return `January 1, ${dateStr}`
    }

    // If it's just an age (e.g., "65"), convert to approximate year
    if (
      dateStr.match(/^\d{1,2}$/) &&
      parseInt(dateStr) >= 50 &&
      parseInt(dateStr) <= 100
    ) {
      const currentYear = new Date().getFullYear()
      const age = parseInt(dateStr)
      // Assume current age is around 30-70, calculate retirement year
      const estimatedCurrentAge = calculatedAge || 50 // fallback to 50 if age not calculated
      const yearsToRetirement = age - estimatedCurrentAge
      const retirementYear = currentYear + yearsToRetirement
      return `January 1, ${retirementYear} (at age ${age})`
    }

    // If it contains "age" keyword (e.g., "age 65", "at age 62")
    const ageMatch = dateStr.match(/(?:age|at age)\s*(\d{1,2})/i)
    if (ageMatch) {
      const age = parseInt(ageMatch[1])
      const currentYear = new Date().getFullYear()
      const estimatedCurrentAge = calculatedAge || 50
      const yearsToRetirement = age - estimatedCurrentAge
      const retirementYear = currentYear + yearsToRetirement
      return `January 1, ${retirementYear} (at age ${age})`
    }

    // If it's a month and year (e.g., "January 2030", "Dec 2025")
    const monthYearMatch = dateStr.match(/^([A-Za-z]+)\s+(\d{4})$/)
    if (monthYearMatch) {
      const [, month, year] = monthYearMatch
      return `${month} 1, ${year}`
    }

    // If it contains "in X years" (e.g., "in 5 years", "in 10 years")
    const inYearsMatch = dateStr.match(/in\s+(\d+)\s+years?/i)
    if (inYearsMatch) {
      const yearsFromNow = parseInt(inYearsMatch[1])
      const currentYear = new Date().getFullYear()
      const retirementYear = currentYear + yearsFromNow
      return `January 1, ${retirementYear} (in ${yearsFromNow} years)`
    }

    // Try to parse as a full date
    try {
      const date = new Date(dateStr)
      // Check if the date is valid
      if (
        !isNaN(date.getTime()) &&
        date.getFullYear() > 1900 &&
        date.getFullYear() < 2100
      ) {
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      }
    } catch {
      // Continue to fallback
    }

    // If nothing else works, return the original string
    return dateStr
  }

  // Update calculations when voice data changes
  useEffect(() => {
    if (voiceData) {
      const updates: Partial<AutomationFormData> = {}

      // Set birthday and calculate age
      if (voiceData.dateOfBirth) {
        updates.birthday = voiceData.dateOfBirth
        const age = calculateAge(voiceData.dateOfBirth)
        setCalculatedAge(age)
      }

      // Calculate retirement age - handle different scenarios
      if (voiceData.retirementDate && voiceData.retirementDate.trim()) {
        let retirementAge = 0

        console.log("🔢 Calculating retirement age:", {
          retirementDate: voiceData.retirementDate,
          dateOfBirth: voiceData.dateOfBirth,
          calculatedAge,
        })

        if (voiceData.dateOfBirth) {
          // We have both birthday and retirement date - calculate precisely
          retirementAge = calculateRetirementAge(
            voiceData.dateOfBirth,
            voiceData.retirementDate
          )
          console.log(
            "🎯 Calculated retirement age (with birthday):",
            retirementAge
          )
        } else {
          // We only have retirement date - extract age if possible
          const dateStr = voiceData.retirementDate.trim()

          // If it's just an age (e.g., "65"), use it directly
          if (
            dateStr.match(/^\d{1,2}$/) &&
            parseInt(dateStr) >= 50 &&
            parseInt(dateStr) <= 100
          ) {
            retirementAge = parseInt(dateStr)
            console.log("🎯 Extracted retirement age (direct):", retirementAge)
          }
          // If it contains "age" keyword, extract the age
          else {
            const ageMatch = dateStr.match(/(?:age|at age)\s*(\d{1,2})/i)
            if (ageMatch) {
              retirementAge = parseInt(ageMatch[1])
              console.log(
                "🎯 Extracted retirement age (from text):",
                retirementAge
              )
            }
          }
        }

        // Ensure we have a valid retirement age (fallback to 62 if calculation failed)
        if (retirementAge === 0 || retirementAge < 50 || retirementAge > 100) {
          console.log(
            "⚠️ Invalid retirement age, using default 62. Original:",
            retirementAge
          )
          retirementAge = 62 // Default retirement age
        }

        console.log("✅ Final retirement age to send to server:", retirementAge)
        setCalculatedRetirementAge(retirementAge)
        updates.retirementAge = retirementAge.toString()

        // Format and display retirement date
        setDisplayRetirementDate(formatRetirementDate(voiceData.retirementDate))
      }

      // Extract retirement month and year (moved outside to ensure it always runs)
      if (voiceData.retirementDate && voiceData.retirementDate.trim()) {
        console.log("🔍 DEBUG: About to extract month/year from:", {
          retirementDate: voiceData.retirementDate,
          dateOfBirth: voiceData.dateOfBirth,
        })

        const { month, year } = extractRetirementMonthYear(
          voiceData.retirementDate,
          voiceData.dateOfBirth
        )
        updates.retirementMonth = month
        updates.retirementYear = year

        console.log("📅 Extracted retirement month/year:", {
          month,
          year,
          originalRetirementDate: voiceData.retirementDate,
        })
      }

      // Set investment amount (saved amount)
      if (voiceData.currentRetirementSavings) {
        const amount =
          typeof voiceData.currentRetirementSavings === "string"
            ? voiceData.currentRetirementSavings.replace(/[^0-9]/g, "")
            : voiceData.currentRetirementSavings.toString()
        updates.investmentAmount = amount
      }

      // Update form data
      setFormData((prev) => ({ ...prev, ...updates }))
    }
  }, [voiceData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (status === "running") {
      onStop()
    } else {
      // Debug: Log the form data being sent to server
      console.log("🚀 Sending automation data to server:", {
        formData,
        calculatedAge,
        calculatedRetirementAge,
        voiceData,
        retirementMonthYear: {
          month: formData.retirementMonth,
          year: formData.retirementYear,
          originalRetirementDate: voiceData?.retirementDate,
        },
      })
      onStart(formData)
    }
  }

  const isRunning = status === "running"
  const canStart = isConnected && status === "idle"
  const hasVoiceData =
    voiceData &&
    (voiceData.dateOfBirth ||
      voiceData.retirementDate ||
      voiceData.currentRetirementSavings)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Voice Agent Data
        </h3>
        <a
          href="/agent"
          className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          <MessageCircle className="w-4 h-4 mr-1" />
          Start Voice Chat
        </a>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Voice Extracted Data Display */}
        {hasVoiceData ? (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
              <User className="w-5 h-5 mr-2 text-green-600" />
              Extracted from Voice Chat
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Current Age (Calculated) */}
              <div className="bg-white p-4 rounded-lg border border-green-100">
                <div className="flex items-center mb-2">
                  <Cake className="w-4 h-4 text-green-600 mr-2" />
                  <label className="text-sm font-medium text-gray-700">
                    Current Age
                  </label>
                </div>
                <div className="text-2xl font-bold text-green-700">
                  {calculatedAge !== null
                    ? `${calculatedAge} years old`
                    : "Not calculated"}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  From birthday: {voiceData.dateOfBirth || "Not provided"}
                </p>
              </div>

              {/* Retirement Date */}
              <div className="bg-white p-4 rounded-lg border border-green-100">
                <div className="flex items-center mb-2">
                  <Calendar className="w-4 h-4 text-green-600 mr-2" />
                  <label className="text-sm font-medium text-gray-700">
                    Retirement Date
                  </label>
                </div>
                <div className="text-lg font-bold text-green-700">
                  {displayRetirementDate ||
                    voiceData.retirementDate ||
                    "Not provided"}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {calculatedRetirementAge !== null &&
                    `Age ${calculatedRetirementAge} at retirement`}
                </p>
              </div>

              {/* Saved Amount */}
              <div className="bg-white p-4 rounded-lg border border-green-100">
                <div className="flex items-center mb-2">
                  <DollarSign className="w-4 h-4 text-green-600 mr-2" />
                  <label className="text-sm font-medium text-gray-700">
                    Saved Amount
                  </label>
                </div>
                <div className="text-2xl font-bold text-green-700">
                  {voiceData.currentRetirementSavings
                    ? `$${
                        typeof voiceData.currentRetirementSavings === "string"
                          ? parseInt(
                              voiceData.currentRetirementSavings.replace(
                                /[^0-9]/g,
                                ""
                              )
                            ).toLocaleString()
                          : voiceData.currentRetirementSavings.toLocaleString()
                      }`
                    : "Not provided"}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Current retirement savings
                </p>
              </div>
            </div>

            {/* Automation Values Note */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Automation will use:</strong> Retirement Age (
                {calculatedRetirementAge || "TBD"}), Longevity Estimate (100),
                Birthday ({voiceData.dateOfBirth || "TBD"}), and Investment
                Amount ($
                {formData.investmentAmount
                  ? parseInt(formData.investmentAmount).toLocaleString()
                  : "TBD"}
                )
              </p>
            </div>
          </div>
        ) : (
          /* No Voice Data - Show Placeholder */
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-xl border border-gray-200 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
              <MessageCircle className="w-5 h-5 mr-2 text-gray-600" />
              Voice Data Not Available
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Age Placeholder */}
              <div className="bg-white p-4 rounded-lg border border-gray-100">
                <div className="flex items-center mb-2">
                  <Cake className="w-4 h-4 text-gray-400 mr-2" />
                  <label className="text-sm font-medium text-gray-700">
                    Current Age
                  </label>
                </div>
                <div className="text-xl font-bold text-gray-400">
                  Not defined yet
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Complete voice chat to get age
                </p>
              </div>

              {/* Retirement Date Placeholder */}
              <div className="bg-white p-4 rounded-lg border border-gray-100">
                <div className="flex items-center mb-2">
                  <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                  <label className="text-sm font-medium text-gray-700">
                    Retirement Date
                  </label>
                </div>
                <div className="text-xl font-bold text-gray-400">
                  Not defined yet
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Complete voice chat to get retirement date
                </p>
              </div>

              {/* Saved Amount Placeholder */}
              <div className="bg-white p-4 rounded-lg border border-gray-100">
                <div className="flex items-center mb-2">
                  <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                  <label className="text-sm font-medium text-gray-700">
                    Saved Amount
                  </label>
                </div>
                <div className="text-xl font-bold text-gray-400">
                  Not defined yet
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Complete voice chat to get savings amount
                </p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Complete the voice chat first</strong> to extract your
                personal data
              </p>
              <a
                href="/agent"
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Start Voice Chat
              </a>
            </div>
          </div>
        )}

        {/* Connection Warning */}
        {!isConnected && (
          <div className="flex items-center p-3 bg-warning-50 border border-warning-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-warning-600 mr-3 flex-shrink-0" />
            <div className="text-sm text-warning-800">
              <p className="font-medium">Connection Required</p>
              <p>
                Please ensure the automation server is running and connected
                before starting.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={!canStart && !isRunning}
            className={`flex items-center px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
              isRunning
                ? "bg-red-500 hover:bg-red-600 text-white"
                : canStart && hasVoiceData
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isRunning ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Stop Automation
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                {hasVoiceData
                  ? "Start Automation"
                  : "Complete Voice Chat First"}
              </>
            )}
          </button>

          {status === "error" && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        {/* Current Status */}
        <div className="text-sm text-gray-600 border-t border-gray-200 pt-4">
          <span className="font-medium">Status:</span>{" "}
          <span
            className={`capitalize ${
              status === "running"
                ? "text-blue-600"
                : status === "completed"
                ? "text-green-600"
                : status === "error"
                ? "text-red-600"
                : "text-gray-600"
            }`}
          >
            {status}
          </span>
        </div>
      </form>
    </div>
  )
}
