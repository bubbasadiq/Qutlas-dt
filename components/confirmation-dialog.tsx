"use client"

import { useState } from "react"
import { AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export type ConfirmationType = "danger" | "warning" | "info" | "success"

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  type?: ConfirmationType
  confirmText?: string
  cancelText?: string
  showDestructiveWarning?: boolean
  isDestructive?: boolean
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "danger",
  confirmText = "Confirm",
  cancelText = "Cancel",
  showDestructiveWarning = false,
  isDestructive = false,
}: ConfirmationDialogProps) {
  const [confirming, setConfirming] = useState(false)

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setConfirming(false)
    }
  }

  const icons = {
    danger: AlertTriangle,
    warning: AlertTriangle,
    info: Info,
    success: CheckCircle,
  }

  const colors = {
    danger: "text-red-600 bg-red-50",
    warning: "text-amber-600 bg-amber-50",
    info: "text-blue-600 bg-blue-50",
    success: "text-green-600 bg-green-50",
  }

  const buttonStyles = {
    danger: "bg-red-600 hover:bg-red-700 text-white",
    warning: "bg-amber-600 hover:bg-amber-700 text-white",
    info: "bg-blue-600 hover:bg-blue-700 text-white",
    success: "bg-green-600 hover:bg-green-700 text-white",
  }

  const Icon = icons[type]
  const colorClass = colors[type]
  const buttonClass = buttonStyles[type]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full ${colorClass}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <DialogTitle>{title}</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-700">{message}</p>

          {isDestructive && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">
                  This action cannot be undone. Please confirm you want to proceed.
                </p>
              </div>
            </div>
          )}

          {showDestructiveWarning && (
            <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <p className="text-xs text-yellow-700">
                This is a destructive action. Please type "confirm" to proceed.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={confirming}>
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={confirming}
            className={isDestructive ? "bg-red-600 hover:bg-red-700" : ""}
          >
            {confirming ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Simpler inline confirmation component
export function InlineConfirmation({
  message,
  onConfirm,
  onCancel,
  type = "danger",
}: {
  message: string
  onConfirm: () => void
  onCancel: () => void
  type?: ConfirmationType
}) {
  const colors = {
    danger: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
    success: "bg-green-50 border-green-200 text-green-800",
  }

  return (
    <div className={`inline-flex items-center gap-3 px-4 py-3 rounded-lg border ${colors[type]}`}>
      <span className="text-sm">{message}</span>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="px-3 py-1 text-xs font-medium bg-white/50 hover:bg-white rounded transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-3 py-1 text-xs font-medium bg-current hover:opacity-90 rounded transition-colors"
        >
          Confirm
        </button>
      </div>
    </div>
  )
}
