// lib/pricing-config.ts
// Legacy pricing helpers.
// Qutlas is NGN-only; keep this module NGN-only to avoid accidental USD fallbacks.

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

const pricingConfig: PricingConfig = {
  baseCurrency: "NGN",
  exchangeRates: {
    NGN: 1,
  },
  basePrices: {
    starter: 0,
    pro: 0,
    enterprise: 0,
  },
}

export function getExchangeRates(): ExchangeRates {
  return pricingConfig.exchangeRates
}

export function getExchangeRate(currencyCode: string): number {
  return pricingConfig.exchangeRates[currencyCode] || 1
}

export function convertFromBaseCurrency(amount: number, targetCurrency: string): number {
  if (targetCurrency !== "NGN") return amount
  return amount
}

export function convertToBaseCurrency(amount: number, _sourceCurrency: string): number {
  return amount
}

export function getBasePrice(itemName: string): number {
  return pricingConfig.basePrices[itemName] || 0
}

export function formatPrice(amount: number, _currencyCode: string, options: { showCode?: boolean } = {}): string {
  const { showCode = false } = options
  const formattedNumber = new Intl.NumberFormat("en-NG", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

  return showCode ? `₦ ${formattedNumber} NGN` : `₦ ${formattedNumber}`
}

export async function fetchLiveExchangeRates(): Promise<ExchangeRates> {
  return pricingConfig.exchangeRates
}
