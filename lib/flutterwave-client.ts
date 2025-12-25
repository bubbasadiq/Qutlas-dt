// lib/flutterwave-client.ts
// Client-side Flutterwave integration for payment processing

export interface FlutterwavePaymentConfig {
  public_key: string
  tx_ref: string
  amount: number
  currency: string
  customer: {
    email: string
    phone_number: string
    name: string
  }
  customizations: {
    title: string
    description: string
    logo?: string
  }
  callback: (response: FlutterwaveCallbackResponse) => void
  onClose: () => void
}

export interface FlutterwaveCallbackResponse {
  status: string
  transaction_id?: string
  tx_ref: string
}

export interface FlutterwaveVerifyResponse {
  success: boolean
  status: string
  data: {
    id: number
    tx_ref: string
    status: string
    amount: number
  }
}

let flutterwaveLoaded = false
let loadPromise: Promise<void> | null = null

export function loadFlutterwaveScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window is undefined"))
  }

  if (flutterwaveLoaded) {
    return Promise.resolve()
  }

  if (loadPromise) {
    return loadPromise
  }

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = "https://checkout.flutterwave.com/v3.js"
    script.async = true
    script.onload = () => {
      flutterwaveLoaded = true
      resolve()
    }
    script.onerror = () => {
      loadPromise = null
      reject(new Error("Failed to load Flutterwave script"))
    }
    document.body.appendChild(script)
  })

  return loadPromise
}

export function isFlutterwaveLoaded(): boolean {
  return typeof window !== "undefined" && typeof (window as any).FlutterwaveCheckout === "function"
}

export function initiatePayment(config: FlutterwavePaymentConfig): void {
  if (!isFlutterwaveLoaded()) {
    throw new Error("Flutterwave checkout is not loaded. Please call loadFlutterwaveScript() first.")
  }

  ;(window as any).FlutterwaveCheckout(config)
}

export async function initializePayment(payload: {
  jobId: string
  amount: number
  email: string
  name: string
  phone: string
  description: string
  currency?: string
}): Promise<{ link: string; tx_ref: string }> {
  const response = await fetch("/api/payment/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to initialize payment")
  }

  return response.json()
}

export async function verifyPayment(transactionId: string): Promise<FlutterwaveVerifyResponse> {
  const response = await fetch("/api/payment/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transaction_id: transactionId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to verify payment")
  }

  return response.json()
}
