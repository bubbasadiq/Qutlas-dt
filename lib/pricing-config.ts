// lib/pricing-config.ts
// Configuration for base prices and exchange rates

interface ExchangeRates {
  [currencyCode: string]: number
}

interface PricingConfig {
  baseCurrency: string
  exchangeRates: ExchangeRates
  basePrices: {
    [planName: string]: number
  }
}

// Base pricing configuration
// All prices are stored in USD as the base currency
const pricingConfig: PricingConfig = {
  baseCurrency: "USD",
  exchangeRates: {
    USD: 1,           // Base currency
    NGN: 1200,        // 1 USD = 1200 NGN (example rate)
    // Add more currencies as needed
  },
  basePrices: {
    // Subscription plans
    starter: 0,       // Free plan
    pro: 49,          // 49 / month (base currency)
    enterprise: 0,   // Custom pricing
    
    // Catalog part base prices (these would be overridden by actual part data)
    // These are just examples
    fastener: 5.99,
    bracket: 12.50,
    enclosure: 25.00,
    shaft: 18.75,
    gear: 15.25,
  }
}

/**
 * Get the current exchange rates
 * @returns Exchange rates object
 */
export function getExchangeRates(): ExchangeRates {
  return pricingConfig.exchangeRates
}

/**
 * Get exchange rate for a specific currency
 * @param currencyCode - Currency code (e.g., "USD", "NGN")
 * @returns Exchange rate relative to base currency (USD)
 */
export function getExchangeRate(currencyCode: string): number {
  return pricingConfig.exchangeRates[currencyCode] || 1
}

/**
 * Convert amount from base currency to target currency
 * @param amount - Amount in base currency (USD)
 * @param targetCurrency - Target currency code
 * @returns Converted amount
 */
export function convertFromBaseCurrency(amount: number, targetCurrency: string): number {
  const rate = getExchangeRate(targetCurrency)
  return amount * rate
}

/**
 * Convert amount from any currency to base currency
 * @param amount - Amount in source currency
 * @param sourceCurrency - Source currency code
 * @returns Amount in base currency (USD)
 */
export function convertToBaseCurrency(amount: number, sourceCurrency: string): number {
  const rate = getExchangeRate(sourceCurrency)
  return amount / rate
}

/**
 * Get base price for a plan or product
 * @param itemName - Name of the plan or product
 * @returns Base price in USD
 */
export function getBasePrice(itemName: string): number {
  return pricingConfig.basePrices[itemName] || 0
}

/**
 * Format price for display in specific currency
 * @param amount - Amount to format
 * @param currencyCode - Target currency code
 * @param options - Formatting options
 * @returns Formatted price string
 */
export function formatPrice(amount: number, currencyCode: string, options: { showCode?: boolean } = {}): string {
  const { showCode = true } = options

  const locale = currencyCode === "NGN" ? "en-NG" : "en-US"
  const formattedNumber = new Intl.NumberFormat(locale, {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

  return showCode ? `${formattedNumber} ${currencyCode}` : formattedNumber
}

/**
 * Fetch live exchange rates from API (optional implementation)
 * @returns Promise resolving to updated exchange rates
 */
export async function fetchLiveExchangeRates(): Promise<ExchangeRates> {
  try {
    // In a real implementation, this would call an exchange rate API
    // For now, we'll return the static rates
    // Example API: https://api.exchangerate-api.com/v4/latest/USD
    
    console.log("Fetching live exchange rates...")
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Return current rates (in a real app, this would be from the API response)
    return pricingConfig.exchangeRates
    
  } catch (error) {
    console.error("Failed to fetch live exchange rates:", error)
    return pricingConfig.exchangeRates
  }
}