// hooks/use-currency.ts
// Custom hook for accessing currency functionality

import { useCurrency } from "@/lib/currency-context"
import { useCallback } from "react"

/**
 * Custom hook for accessing currency functionality
 * @returns Currency context with utility functions
 */
export function useCurrencyHook() {
  const currencyContext = useCurrency()
  
  /**
   * Format price for display using current currency
   * @param amount - Amount to format
   * @param options - Formatting options
   * @returns Formatted price string
   */
  const formatPrice = useCallback((amount: number, options?: { showCode?: boolean }) => {
    return currencyContext.formatPrice(amount, options)
  }, [currencyContext])

  /**
   * Convert price from one currency to another
   * @param amount - Amount to convert
   * @param fromCurrency - Source currency code
   * @param toCurrency - Target currency code
   * @returns Converted amount
   */
  const convertPrice = useCallback((amount: number, fromCurrency: string, toCurrency: string) => {
    return currencyContext.convertPrice(amount, fromCurrency, toCurrency)
  }, [currencyContext])

  /**
   * Get current currency information
   * @returns Current currency info
   */
  const getCurrentCurrency = useCallback(() => {
    return currencyContext.currency
  }, [currencyContext])

  /**
   * Get current exchange rate
   * @returns Current exchange rate
   */
  const getExchangeRate = useCallback(() => {
    return currencyContext.exchangeRate
  }, [currencyContext])

  /**
   * Change current currency
   * @param currencyCode - Currency code to switch to
   */
  const setCurrency = useCallback((currencyCode: string) => {
    currencyContext.setCurrency(currencyCode)
  }, [currencyContext])

  return {
    ...currencyContext,
    formatPrice,
    convertPrice,
    getCurrentCurrency,
    getExchangeRate,
    setCurrency
  }
}

// Export the basic useCurrency for direct context access
export { useCurrency } from "@/lib/currency-context"