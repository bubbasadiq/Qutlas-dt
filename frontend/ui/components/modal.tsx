"use client"

import type React from "react"
import { useEffect } from "react"
import { cn } from "@/lib/utils"

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl"
  closeButton?: boolean
}

const sizeMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = "md", closeButton = true }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[var(--z-modal-backdrop)] bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[var(--z-modal)] w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={cn(
            "mx-auto bg-[var(--bg-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-3)] animate-in fade-in zoom-in-95 duration-200",
            sizeMap[size],
          )}
        >
          {/* Header */}
          {(title || closeButton) && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--neutral-100)]">
              {title && <h2 className="text-xl font-semibold text-[var(--neutral-900)]">{title}</h2>}
              {closeButton && (
                <button
                  onClick={onClose}
                  className="ml-auto text-[var(--neutral-500)] hover:text-[var(--neutral-900)] transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-4">{children}</div>
        </div>
      </div>
    </div>
  )
}
