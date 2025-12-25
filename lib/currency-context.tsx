"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { detectUserLocation, getCurrencyByCountry } from "./geolocation"

interface CurrencyInfo {
  code: string
  symbol: string
  name: string
}

interface CurrencyContextType {
  currency: CurrencyInfo
  exchangeRate: number
  isLoading: boolean
  setCurrency: (currencyCode: string) => void
  formatPrice: (amount: number, options?: { showCode?: boolean }) => string
  convertPrice: (amount: number, fromCurrency: string, toCurrency: string) => number
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
  const [currency, setCurrencyState] = useState<CurrencyInfo>({
    code: "NGN",
    symbol: "₦",
    name: "Nigerian Naira"
  })
  const [exchangeRate, setExchangeRate] = useState(1200)
  const [isLoading, setIsLoading] = useState(true)

  const loadExchangeRates = useCallback(async () => {
    try {
      // In a real implementation, this would fetch from an API
      // For now, we'll use a static exchange rate for NGN
      const rates = {
        USD: 1,
        NGN: 1200 // 1 USD = 1200 NGN (example rate)
      }
      return rates
    } catch (error) {
      console.error("Failed to load exchange rates:", error)
      return { USD: 1, NGN: 1200 }
    }
  }, [])

  const detectAndSetCurrency = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Check localStorage first
      const cachedCurrency = localStorage.getItem("userCurrency")
      const cachedTimestamp = localStorage.getItem("currencyTimestamp")
      
      if (cachedCurrency && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp)
        const now = Date.now()
        // Cache is valid for 24 hours
        if (now - timestamp < 24 * 60 * 60 * 1000) {
          const currencyInfo = JSON.parse(cachedCurrency)
          setCurrencyState(currencyInfo)
          setIsLoading(false)
          return
        }
      }

      // Detect user location
      const { country } = await detectUserLocation()
      const detectedCurrency = getCurrencyByCountry(country)
      
      // Store in localStorage
      localStorage.setItem("userCurrency", JSON.stringify(detectedCurrency))
      localStorage.setItem("currencyTimestamp", Date.now().toString())
      
      setCurrencyState(detectedCurrency)
      
      // Load exchange rates
      const rates = await loadExchangeRates()
      setExchangeRate(rates[detectedCurrency.code as keyof typeof rates])
      
    } catch (error) {
      console.error("Failed to detect currency:", error)
      // Fallback to NGN
      setCurrencyState({
        code: "NGN",
        symbol: "₦",
        name: "Nigerian Naira"
      })
      setExchangeRate(1200)
    } finally {
      setIsLoading(false)
    }
  }, [loadExchangeRates])

  useEffect(() => {
    detectAndSetCurrency()
  }, [detectAndSetCurrency])

  const setCurrency = useCallback((currencyCode: string) => {
    const newCurrency = getCurrencyByCountry(currencyCode)
    setCurrencyState(newCurrency)
    localStorage.setItem("userCurrency", JSON.stringify(newCurrency))
    localStorage.setItem("currencyTimestamp", Date.now().toString())
  }, [])

  const formatPrice = useCallback((amount: number, options: { showCode?: boolean } = {}) => {
    const { showCode = true } = options

    // IMPORTANT: Do not render the USD symbol anywhere in the UI.
    // We format as a plain number and append the currency code.
    const locale = currency.code === "NGN" ? "en-NG" : "en-US"
    const formattedNumber = new Intl.NumberFormat(locale, {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)

    return showCode ? `${formattedNumber} ${currency.code}` : formattedNumber
  }, [currency])

  const convertPrice = useCallback((amount: number, fromCurrency: string, toCurrency: string) => {
    // Simple conversion logic
    // In a real app, this would use the exchange rates
    if (fromCurrency === toCurrency) return amount
    
    if (fromCurrency === "USD" && toCurrency === "NGN") {
      return amount * 1200
    } else if (fromCurrency === "NGN" && toCurrency === "USD") {
      return amount / 1200
    }
    
    return amount
  }, [])

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      exchangeRate, 
      isLoading, 
      setCurrency, 
      formatPrice, 
      convertPrice 
    }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => {
  const context = useContext(CurrencyContext)
  if (!context) throw new Error("useCurrency must be used within CurrencyProvider")
  return context
}