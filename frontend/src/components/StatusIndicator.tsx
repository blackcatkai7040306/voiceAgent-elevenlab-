"use client"

import React from "react"
import { Wifi, WifiOff, Server, RefreshCw } from "lucide-react"
import { AutomationStatus } from "@/types/automation"

interface StatusIndicatorProps {
  isConnected: boolean
  status: AutomationStatus
  onReconnect: () => void
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  isConnected,
  status,
  onReconnect,
}) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center space-x-4">
        {/* Connection Status */}
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <Wifi className="w-5 h-5 text-success-500" />
          ) : (
            <WifiOff className="w-5 h-5 text-danger-500" />
          )}
          <span
            className={`text-sm font-medium ${
              isConnected ? "text-success-700" : "text-danger-700"
            }`}
          >
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>

        {/* Server Status */}
        <div className="flex items-center space-x-2">
          <Server className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-600">Automation Server</span>
        </div>

        {/* Automation Status */}
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${
              status === "running"
                ? "bg-primary-500 animate-pulse"
                : status === "completed"
                ? "bg-success-500"
                : status === "error"
                ? "bg-danger-500"
                : "bg-gray-400"
            }`}
          />
          <span className="text-sm text-gray-600 capitalize">{status}</span>
        </div>
      </div>

      {/* Reconnect Button */}
      {!isConnected && (
        <button
          onClick={onReconnect}
          className="flex items-center space-x-2 px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reconnect</span>
        </button>
      )}
    </div>
  )
}
