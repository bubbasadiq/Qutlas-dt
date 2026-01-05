"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  ({ className, open = false, onOpenChange, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Collapsible.displayName = "Collapsible"

export interface CollapsibleTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  children: React.ReactNode
}

const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  ({ className, asChild = false, children, ...props }, ref) => {
    if (asChild) {
      return <>{children}</>
    }

    return (
      <button
        ref={ref}
        className={cn("cursor-pointer", className)}
        {...props}
      >
        {children}
      </button>
    )
  }
)

CollapsibleTrigger.displayName = "CollapsibleTrigger"

export interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const CollapsibleContent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("overflow-hidden", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
