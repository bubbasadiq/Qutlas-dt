"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
      />
      {/* Sheet content */}
      <SheetContent onClose={() => onOpenChange(false)}>
        {children}
      </SheetContent>
    </div>
  )
}

interface SheetContentProps {
  children: React.ReactNode
  onClose?: () => void
  className?: string
  side?: 'left' | 'right' | 'bottom'
}

export function SheetContent({ children, onClose, className, side = 'bottom' }: SheetContentProps) {
  const isLeft = side === 'left'
  const isRight = side === 'right'
  const isBottom = side === 'bottom'

  return (
    <div
      className={cn(
        "fixed z-50 bg-white shadow-2xl animate-in",
        isLeft && "slide-in-from-left h-full w-full max-w-xs rounded-r-xl top-0 left-0 bottom-0",
        isRight && "slide-in-from-right h-full w-full max-w-xs rounded-l-xl top-0 right-0 bottom-0",
        isBottom && "slide-in-from-bottom h-[85vh] w-full rounded-t-2xl bottom-0 left-0 right-0",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Handle bar for bottom sheet */}
      {isBottom && (
        <div
          className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-2 flex-shrink-0 cursor-pointer"
          onClick={onClose}
        />
      )}
      {children}
    </div>
  )
}

interface SheetBodyProps {
  children: React.ReactNode
  className?: string
}

export function SheetBody({ children, className }: SheetBodyProps) {
  return (
    <div className={cn("px-4 pb-6 overflow-y-auto flex-1", className)}>
      {children}
    </div>
  )
}

interface SheetHeaderProps {
  children: React.ReactNode
  className?: string
}

export function SheetHeader({ children, className }: SheetHeaderProps) {
  return (
    <div className={cn("px-4 pt-2 pb-3 border-b border-gray-100 flex-shrink-0", className)}>
      {children}
    </div>
  )
}

interface SheetTitleProps {
  children: React.ReactNode
  className?: string
}

export function SheetTitle({ children, className }: SheetTitleProps) {
  return (
    <h2 className={cn("text-lg font-semibold text-gray-900", className)}>
      {children}
    </h2>
  )
}

// Bottom sheet variant for mobile
export function BottomSheet({ open, onClose, title, children }: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  if (!open) return null

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetHeader>
        <SheetTitle>{title}</SheetTitle>
      </SheetHeader>
      <SheetBody>{children}</SheetBody>
    </Sheet>
  )
}
