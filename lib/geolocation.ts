// lib/geolocation.ts
// Currency + location helpers
//
// Qutlas is NGN-first. We intentionally force NGN across the product (no USD fallback)
// to keep pricing consistent for our primary market.

interface LocationData {
  country: string
  currency: string
}

interface CurrencyInfo {
  code: string
  symbol: string
  name: string
}

const NGN: CurrencyInfo = { code: "NGN", symbol: "₦", name: "Nigerian Naira" }

export async function detectUserLocation(): Promise<LocationData> {
  return { country: "NG", currency: "NGN" }
}

export function getCurrencyByCountry(_countryCode: string): CurrencyInfo {
  return NGN
}

export function clearLocationCache(): void {
  // No-op (location is forced)
}
