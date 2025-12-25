"use client"

import React, { createContext, useContext, useCallback } from "react"

interface CurrencyInfo {
  code: string
  symbol: string
  name: string
}

interface CurrencyContextType {
  currency: CurrencyInfo
  exchangeRate: number
  isLoading: boolean
  setCurrency: (_currencyCode: string) => void
  formatPrice: (amount: number, options?: { showCode?: boolean }) => string
  convertPrice: (amount: number, _fromCurrency: string, _toCurrency: string) => number
}

const NGN: CurrencyInfo = {
  code: "NGN",
  symbol: "₦",
  name: "Nigerian Naira",
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
  const setCurrency = useCallback((_currencyCode: string) => {
    // Qutlas is NGN-only for now.
  }, [])

  const formatPrice = useCallback((amount: number, options: { showCode?: boolean } = {}) => {
    const { showCode = false } = options

    const formattedNumber = new Intl.NumberFormat("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)

    return showCode ? `${NGN.symbol} ${formattedNumber} ${NGN.code}` : `${NGN.symbol} ${formattedNumber}`
  }, [])

  const convertPrice = useCallback((amount: number, _fromCurrency: string, _toCurrency: string) => amount, [])

  return (
    <CurrencyContext.Provider
      value={{
        currency: NGN,
        exchangeRate: 1,
        isLoading: false,
        setCurrency,
        formatPrice,
        convertPrice,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => {
  const context = useContext(CurrencyContext)
  if (!context) throw new Error("useCurrency must be used within CurrencyProvider")
  return context
}
