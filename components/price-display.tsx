// components/price-display.tsx
// Reusable component for displaying prices with currency formatting

import React from "react"
import { useCurrency } from "@/hooks/use-currency"

interface PriceDisplayProps {
  amount: number
  currency?: string
  period?: string
  variant?: "default" | "compact" | "large"
  showCode?: boolean
  className?: string
}

export function PriceDisplay({
  amount,
  currency: propCurrency,
  period,
  variant = "default",
  showCode = false,
  className = ""
}: PriceDisplayProps) {
  const { formatPrice } = useCurrency()
  
  // Format the price without currency symbols - just plain numbers
  const formattedPrice = formatPrice(amount, { showCode: false })
  
  // Apply variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case "large":
        return "text-2xl font-bold"
      case "compact":
        return "text-sm font-medium"
      case "default":
      default:
        return "text-lg font-semibold"
    }
  }
  
  return (
    <div className={`flex items-baseline gap-1 ${className}`}>
      <span className={getVariantStyles()}>{formattedPrice}</span>
      {period && <span className="text-sm text-[var(--neutral-500)] ml-1">{period}</span>}
    </div>
  )
}