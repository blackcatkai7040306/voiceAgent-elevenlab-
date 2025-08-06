"use client"

import React, { useState } from "react"
import { AccountForm } from "./AccountForm"
import { Conversation } from "./conversation"

/**
 * TabNavigation component that manages different sections using tabs
 * Provides a clean interface to switch between Account Form and Conversation
 */
export const TabNavigation: React.FC = () => {
  // State to manage the active tab
  const [activeTab, setActiveTab] = useState<"account" | "conversation">(
    "account"
  )

  /**
   * Handles tab switching
   * @param tab - The tab to switch to
   */
  const handleTabChange = (tab: "account" | "conversation") => {
    setActiveTab(tab)
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Tab Navigation Header */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8" aria-label="Tabs">
          {/* Account Form Tab */}
          <button
            onClick={() => handleTabChange("account")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === "account"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            aria-current={activeTab === "account" ? "page" : undefined}
          >
            <div className="flex items-center space-x-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>Account Form</span>
            </div>
          </button>

          {/* Conversation Tab */}
          <button
            onClick={() => handleTabChange("conversation")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === "conversation"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            aria-current={activeTab === "conversation" ? "page" : undefined}
          >
            <div className="flex items-center space-x-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span>AI Conversation</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === "account" && (
          <div
            className="fade-in"
            role="tabpanel"
            aria-labelledby="account-tab"
          >
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Account Registration
              </h2>
              <p className="text-gray-600">
                Fill out your account information below. Use the "Fill Form"
                button to auto-populate with sample data.
              </p>
            </div>
            <AccountForm />
          </div>
        )}

        {activeTab === "conversation" && (
          <div
            className="fade-in"
            role="tabpanel"
            aria-labelledby="conversation-tab"
          >
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                AI Conversation
              </h2>
              <p className="text-gray-600">
                Start a conversation with our ElevenLabs AI assistant.
              </p>
            </div>
            <Conversation />
          </div>
        )}
      </div>

      {/* Tab Indicator */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
          <div
            className={`w-2 h-2 rounded-full transition-colors duration-200 ${
              activeTab === "account" ? "bg-blue-500" : "bg-gray-300"
            }`}
          />
          <div
            className={`w-2 h-2 rounded-full transition-colors duration-200 ${
              activeTab === "conversation" ? "bg-blue-500" : "bg-gray-300"
            }`}
          />
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Switch between tabs to access different features
        </p>
      </div>
    </div>
  )
}

// Add custom CSS for fade-in animation
const styles = `
  .fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`

// Inject styles if they don't exist
if (
  typeof document !== "undefined" &&
  !document.getElementById("tab-navigation-styles")
) {
  const styleSheet = document.createElement("style")
  styleSheet.id = "tab-navigation-styles"
  styleSheet.type = "text/css"
  styleSheet.innerText = styles
  document.head.appendChild(styleSheet)
}
