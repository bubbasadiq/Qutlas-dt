// lib/geolocation.ts
// Utility functions for detecting user location and determining currency

interface LocationData {
  country: string
  currency: string
}

interface CurrencyInfo {
  code: string
  symbol: string
  name: string
}

// Cache for geolocation results
let locationCache: LocationData | null = null
let cacheTimestamp = 0

/**
 * Detect user's location using IP-based geolocation with fallback to browser locale
 * @returns Promise resolving to location data including country code
 */
export async function detectUserLocation(): Promise<LocationData> {
  // Check cache first (valid for 24 hours)
  const now = Date.now()
  if (locationCache && now - cacheTimestamp < 24 * 60 * 60 * 1000) {
    return locationCache
  }

  try {
    // Try IP-based geolocation API
    // Using ip-api.com as a free alternative
    const response = await fetch("http://ip-api.com/json/?fields=countryCode")
    
    if (response.ok) {
      const data = await response.json()
      const countryCode = data.countryCode
      
      if (countryCode) {
        const result = {
          country: countryCode,
          currency: getCurrencyByCountry(countryCode).code
        }
        
        // Cache the result
        locationCache = result
        cacheTimestamp = now
        return result
      }
    }
  } catch (error) {
    console.warn("IP geolocation failed, falling back to browser locale:", error)
  }

  // Fallback: Use browser locale
  const browserLocale = typeof navigator !== "undefined" ? navigator.language : "en-US"
  
  // Extract country code from locale (e.g., "en-NG" -> "NG")
  const localeParts = browserLocale.split("-")
  const countryCode = localeParts.length > 1 ? localeParts[1] : "US"
  
  const result = {
    country: countryCode,
    currency: getCurrencyByCountry(countryCode).code
  }
  
  // Cache the result
  locationCache = result
  cacheTimestamp = now
  return result
}

/**
 * Get currency information based on country code
 * @param countryCode - 2-letter country code (e.g., "NG", "US")
 * @returns Currency information object
 */
export function getCurrencyByCountry(countryCode: string): CurrencyInfo {
  // Normalize country code to uppercase
  const normalizedCode = countryCode?.toUpperCase() || "US"
  
  // Country to currency mapping
  const countryCurrencyMap: Record<string, CurrencyInfo> = {
    // Nigeria
    NG: { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
    NGA: { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
    
    // United States and territories
    US: { code: "USD", symbol: "USD", name: "US Dollar" },
    USA: { code: "USD", symbol: "USD", name: "US Dollar" },

    // Other countries default to USD
    // Add more country mappings as needed
    GB: { code: "USD", symbol: "USD", name: "US Dollar" },
    CA: { code: "USD", symbol: "USD", name: "US Dollar" },
    AU: { code: "USD", symbol: "USD", name: "US Dollar" },
    DE: { code: "USD", symbol: "USD", name: "US Dollar" },
    FR: { code: "USD", symbol: "USD", name: "US Dollar" },
    JP: { code: "USD", symbol: "USD", name: "US Dollar" },
    IN: { code: "USD", symbol: "USD", name: "US Dollar" },
    BR: { code: "USD", symbol: "USD", name: "US Dollar" },
    ZA: { code: "USD", symbol: "USD", name: "US Dollar" },
    KE: { code: "USD", symbol: "USD", name: "US Dollar" },
    GH: { code: "USD", symbol: "USD", name: "US Dollar" },
  }
  
  // Return the currency info for the country, default to USD if not found
  return countryCurrencyMap[normalizedCode] || countryCurrencyMap["US"]
}

/**
 * Clear cached location data (useful for testing or when user changes location)
 */
export function clearLocationCache(): void {
  locationCache = null
  cacheTimestamp = 0
}