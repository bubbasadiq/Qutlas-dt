"use client"

import React from "react"

interface ProgressProps {
  value?: number
  className?: string
}

export function Progress({ value = 0, className = "" }: ProgressProps) {
  const percentage = Math.min(Math.max(value, 0), 100)

  return (
    <div className={`relative h-4 w-full overflow-hidden rounded-full bg-gray-200 ${className}`}>
      <div
        className="h-full bg-blue-500 transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
