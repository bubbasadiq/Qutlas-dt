"use client"

import { Loader2 } from "lucide-react"

interface LoadingOverlayProps {
  message?: string
  progress?: number
  showProgress?: boolean
  onCancel?: () => void
  variant?: "spinner" | "dots" | "bar"
}

export function LoadingOverlay({
  message = "Loading...",
  progress,
  showProgress = false,
  onCancel,
  variant = "spinner",
}: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4">
        {variant === "spinner" && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-[var(--primary-700)] animate-spin mb-4" />
            <p className="text-sm font-medium text-gray-900">{message}</p>
            {showProgress && progress !== undefined && (
              <p className="text-xs text-gray-500 mt-2">{Math.round(progress)}%</p>
            )}
          </div>
        )}

        {variant === "dots" && (
          <div className="flex flex-col items-center">
            <div className="flex gap-2 mb-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 bg-[var(--primary-700)] rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <p className="text-sm font-medium text-gray-900">{message}</p>
          </div>
        )}

        {variant === "bar" && (
          <div className="flex flex-col">
            <p className="text-sm font-medium text-gray-900 mb-3">{message}</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
              <div
                className="bg-[var(--primary-700)] h-full rounded-full transition-all duration-300"
                style={{ width: `${progress || 0}%` }}
              />
            </div>
            {showProgress && progress !== undefined && (
              <p className="text-xs text-gray-500 text-center">{Math.round(progress)}%</p>
            )}
          </div>
        )}

        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-4 w-full px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}

interface LoadingButtonProps {
  loading: boolean
  children: React.ReactNode
  disabled?: boolean
  className?: string
  onClick?: () => void
}

export function LoadingButton({
  loading,
  children,
  disabled,
  className,
  onClick,
}: LoadingButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        disabled || loading
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-[var(--primary-700)] text-white hover:bg-[var(--primary-800)]'
      } ${className || ''}`}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}

interface LoadingSkeletonProps {
  className?: string
  lines?: number
}

export function LoadingSkeleton({ className = "", lines = 3 }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-200 rounded animate-pulse"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  )
}
