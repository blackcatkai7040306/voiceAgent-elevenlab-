// import { ExtractedUserData } from "@/types/voiceAgent"
// import { ExtractedData } from "@/types/automation"

// interface GoogleSheetsConfig {
//   spreadsheetId: string
//   clientEmail: string
//   privateKey: string
// }

// interface ConversationLogEntry {
//   timestamp: string
//   userInput: string
//   aiResponse: string
//   extractedData: Partial<ExtractedUserData>
//   sessionId: string
// }

// interface AutomationResultEntry {
//   timestamp: string
//   sessionId: string
//   userInputs: ExtractedUserData
//   monthlyIncomeNet?: string
//   planValue1?: string
//   planValue2?: string
//   planValue3?: string
//   automationStatus: "success" | "failed" | "partial"
// }

// export class GoogleSheetsLogger {
//   private config: GoogleSheetsConfig
//   private accessToken: string | null = null

//   constructor(config: GoogleSheetsConfig) {
//     this.config = config
//   }

//   private async getAccessToken(): Promise<string> {
//     if (this.accessToken) return this.accessToken

//     try {
//       // Create JWT for Google Sheets API authentication
//       const jwt = await this.createJWT()

//       const response = await fetch("https://oauth2.googleapis.com/token", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/x-www-form-urlencoded",
//         },
//         body: new URLSearchParams({
//           grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
//           assertion: jwt,
//         }),
//       })

//       const data = await response.json()
//       this.accessToken = data.access_token
//       return this.accessToken
//     } catch (error) {
//       console.error("Error getting access token:", error)
//       throw error
//     }
//   }

//   private async createJWT(): Promise<string> {
//     // In a real implementation, you'd use a proper JWT library
//     // This is a simplified version - you should use jose or jsonwebtoken
//     const header = {
//       alg: "RS256",
//       typ: "JWT",
//     }

//     const now = Math.floor(Date.now() / 1000)
//     const payload = {
//       iss: this.config.clientEmail,
//       scope: "https://www.googleapis.com/auth/spreadsheets",
//       aud: "https://oauth2.googleapis.com/token",
//       exp: now + 3600,
//       iat: now,
//     }

//     // Note: This is a placeholder - you need to implement proper JWT signing
//     // with the private key in a production environment
//     return "placeholder_jwt_token"
//   }

//   async logConversation(entry: ConversationLogEntry): Promise<void> {
//     try {
//       const accessToken = await this.getAccessToken()

//       const values = [
//         entry.timestamp,
//         entry.sessionId,
//         entry.userInput,
//         entry.aiResponse,
//         JSON.stringify(entry.extractedData),
//       ]

//       await this.appendToSheet("Conversations", values, accessToken)
//     } catch (error) {
//       console.error("Error logging conversation:", error)
//     }
//   }

//   async logAutomationResult(entry: AutomationResultEntry): Promise<void> {
//     try {
//       const accessToken = await this.getAccessToken()

//       const values = [
//         entry.timestamp,
//         entry.sessionId,
//         entry.userInputs.dateOfBirth || "",
//         entry.userInputs.retirementAge?.toString() || "",
//         entry.userInputs.longevityEstimate?.toString() || "",
//         entry.userInputs.investmentAmount?.toString() || "",
//         entry.monthlyIncomeNet || "",
//         entry.planValue1 || "",
//         entry.planValue2 || "",
//         entry.planValue3 || "",
//         entry.automationStatus,
//       ]

//       await this.appendToSheet("AutomationResults", values, accessToken)
//     } catch (error) {
//       console.error("Error logging automation result:", error)
//     }
//   }

//   private async appendToSheet(
//     sheetName: string,
//     values: string[],
//     accessToken: string
//   ): Promise<void> {
//     const response = await fetch(
//       `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}/values/${sheetName}:append?valueInputOption=USER_ENTERED`,
//       {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           values: [values],
//         }),
//       }
//     )

//     if (!response.ok) {
//       throw new Error(`Failed to append to sheet: ${response.statusText}`)
//     }
//   }

//   async initializeSheets(): Promise<void> {
//     try {
//       const accessToken = await this.getAccessToken()

//       // Create headers for conversation log
//       await this.createSheetIfNotExists(
//         "Conversations",
//         [
//           "Timestamp",
//           "Session ID",
//           "User Input",
//           "AI Response",
//           "Extracted Data (JSON)",
//         ],
//         accessToken
//       )

//       // Create headers for automation results
//       await this.createSheetIfNotExists(
//         "AutomationResults",
//         [
//           "Timestamp",
//           "Session ID",
//           "Date of Birth",
//           "Retirement Age",
//           "Longevity Estimate",
//           "Investment Amount",
//           "Monthly Income Net",
//           "Plan Value 1",
//           "Plan Value 2",
//           "Plan Value 3",
//           "Status",
//         ],
//         accessToken
//       )
//     } catch (error) {
//       console.error("Error initializing sheets:", error)
//     }
//   }

//   private async createSheetIfNotExists(
//     sheetName: string,
//     headers: string[],
//     accessToken: string
//   ): Promise<void> {
//     try {
//       // Check if sheet exists
//       const response = await fetch(
//         `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}`,
//         {
//           headers: {
//             Authorization: `Bearer ${accessToken}`,
//           },
//         }
//       )

//       const data = await response.json()
//       const sheetExists = data.sheets?.some(
//         (sheet: any) => sheet.properties.title === sheetName
//       )

//       if (!sheetExists) {
//         // Create the sheet
//         await fetch(
//           `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}:batchUpdate`,
//           {
//             method: "POST",
//             headers: {
//               Authorization: `Bearer ${accessToken}`,
//               "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//               requests: [
//                 {
//                   addSheet: {
//                     properties: {
//                       title: sheetName,
//                     },
//                   },
//                 },
//               ],
//             }),
//           }
//         )

//         // Add headers
//         await this.appendToSheet(sheetName, headers, accessToken)
//       }
//     } catch (error) {
//       console.error(`Error creating sheet ${sheetName}:`, error)
//     }
//   }
// }

// // Export a singleton instance
// export const googleSheetsLogger = new GoogleSheetsLogger({
//   spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "",
//   clientEmail: process.env.GOOGLE_SHEETS_CLIENT_EMAIL || "",
//   privateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY || "",
// })

// // Helper function to generate session ID
// export const generateSessionId = (): string => {
//   return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
// }
