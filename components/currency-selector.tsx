// components/currency-selector.tsx
// Component for selecting currency manually

import React from "react"
import { useCurrency } from "@/hooks/use-currency"
import { Button } from "./ui/button"
import { Icon } from "./ui/icon"

interface CurrencySelectorProps {
  className?: string
}

export function CurrencySelector({ className = "" }: CurrencySelectorProps) {
  const { currency, setCurrency, isLoading } = useCurrency()
  
  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency)
  }
  
  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Icon name="loader" size={16} className="animate-spin" />
        <span className="text-sm text-[var(--neutral-500)]">Loading...</span>
      </div>
    )
  }
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-1 h-8 px-2 cursor-default"
        onClick={() => handleCurrencyChange("NGN")}
      >
        <span className="text-sm font-medium">NGN</span>
        <Icon name="chevron-down" size={14} className="text-[var(--neutral-400)] opacity-50" />
      </Button>
    </div>
  )
}