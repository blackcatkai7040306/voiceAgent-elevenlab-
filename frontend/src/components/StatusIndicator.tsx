"use client"

import React from "react"
import { Wifi, WifiOff, Server, RefreshCw } from "lucide-react"
import { AutomationStatus } from "@/types/automation"

interface StatusIndicatorProps {
  isConnected: boolean
  status: AutomationStatus
  connectionError?: string | null
  onReconnect: () => void
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  isConnected,
  status,
  connectionError,
  onReconnect,
}) => {
  return (
    <div className="space-y-4">
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
            className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reconnect</span>
          </button>
        )}
      </div>

      {/* Connection Error Details */}
      {!isConnected && connectionError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <WifiOff className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900 mb-1">
                Connection Issue
              </h4>
              <p className="text-sm text-red-800">{connectionError}</p>

              {(connectionError.includes("Mixed content") ||
                connectionError.includes("WebSocket")) && (
                <div className="mt-2 text-xs text-red-700 bg-red-100 p-2 rounded">
                  <strong>HTTPS/WebSocket Issue:</strong> When served over
                  HTTPS, the browser blocks insecure WebSocket connections. Your
                  backend needs to support WSS (WebSocket Secure) or you need to
                  serve this app over HTTP for development.
                </div>
              )}

              {connectionError.includes("CORS") && (
                <div className="mt-2 text-xs text-red-700 bg-red-100 p-2 rounded">
                  <strong>CORS Issue:</strong> The backend server needs to allow
                  connections from this domain. Check the CORS configuration in
                  your server.js file.
                </div>
              )}

              {connectionError.includes("timeout") && (
                <div className="mt-2 text-xs text-red-700 bg-red-100 p-2 rounded">
                  <strong>Timeout:</strong> Make sure your backend server is
                  running on the expected port and accessible from this domain.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
