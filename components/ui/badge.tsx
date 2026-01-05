"use client"

import React from "react"

interface BadgeProps {
  variant?: "default" | "secondary" | "destructive" | "outline"
  className?: string
  children?: React.ReactNode
}

export function Badge({ variant = "default", className = "", children }: BadgeProps) {
  const baseClasses = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"

  const variantClasses = {
    default: "bg-blue-500 text-white border-transparent",
    secondary: "bg-gray-100 text-gray-800 border-transparent",
    destructive: "bg-red-500 text-white border-transparent",
    outline: "text-gray-700 border-gray-300 bg-transparent"
  }

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  )
}
