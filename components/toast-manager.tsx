"use client"

import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react"
import { toast } from "sonner"

export type ToastType = "success" | "error" | "warning" | "info"

interface ToastOptions {
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  dismissible?: boolean
}

/**
 * Enhanced toast notification manager
 */
export const toastManager = {
  success(message: string, options?: ToastOptions) {
    return toast.success(message, {
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      duration: options?.duration || 3000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    })
  },

  error(message: string, options?: ToastOptions) {
    return toast.error(message, {
      icon: <XCircle className="w-5 h-5 text-red-500" />,
      duration: options?.duration || 4000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    })
  },

  warning(message: string, options?: ToastOptions) {
    return toast.warning(message, {
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      duration: options?.duration || 3500,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    })
  },

  info(message: string, options?: ToastOptions) {
    return toast.info(message, {
      icon: <Info className="w-5 h-5 text-blue-500" />,
      duration: options?.duration || 3000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    })
  },

  loading(message: string, id?: string) {
    return toast.loading(message, { id })
  },

  dismiss(id?: string | string[]) {
    toast.dismiss(id)
  },

  /**
   * Show a toast with custom action
   */
  withAction(message: string, type: ToastType, actionLabel: string, onAction: () => void) {
    switch (type) {
      case 'success':
        return this.success(message, { action: { label: actionLabel, onClick: onAction } })
      case 'error':
        return this.error(message, { action: { label: actionLabel, onClick: onAction } })
      case 'warning':
        return this.warning(message, { action: { label: actionLabel, onClick: onAction } })
      case 'info':
        return this.info(message, { action: { label: actionLabel, onClick: onAction } })
    }
  },

  /**
   * Show a toast with undo action
   */
  withUndo(message: string, type: ToastType = "success", onUndo: () => void) {
    return this.withAction(message, type, 'Undo', onUndo)
  },

  /**
   * Show a toast with retry action
   */
  withRetry(message: string, type: ToastType = "error", onRetry: () => void) {
    return this.withAction(message, type, 'Retry', onRetry)
  },
}

/**
 * Toast notification styles configuration
 */
export const toastConfig = {
  position: 'bottom-right' as const,
  richColors: true,
  closeButton: true,
  duration: 3000,
  expand: false,
}
