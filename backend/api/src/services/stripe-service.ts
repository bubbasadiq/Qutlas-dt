// Stripe integration for job payments and escrow
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
})

export interface JobPaymentIntent {
  jobId: string
  customerId: string
  amount: number
  currency: string
  estimatedCost: number
  platformFee: number // 5% platform take
}

export async function createJobPaymentIntent(
  jobPaymentData: JobPaymentIntent,
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: jobPaymentData.amount * 100, // cents
    currency: jobPaymentData.currency.toLowerCase(),
    customer: jobPaymentData.customerId,
    description: `Qutlas Job: ${jobPaymentData.jobId}`,
    metadata: {
      jobId: jobPaymentData.jobId,
      estimatedCost: jobPaymentData.estimatedCost,
      platformFee: jobPaymentData.platformFee,
    },
    application_fee_amount: Math.round(jobPaymentData.platformFee * 100),
  })

  return {
    clientSecret: paymentIntent.client_secret || "",
    paymentIntentId: paymentIntent.id,
  }
}

export async function capturePayment(paymentIntentId: string): Promise<boolean> {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
  if (paymentIntent.status === "succeeded") {
    return true
  }
  throw new Error(`Payment not succeeded: ${paymentIntent.status}`)
}

export async function refundPayment(paymentIntentId: string, amount?: number): Promise<void> {
  await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amount ? amount * 100 : undefined,
  })
}

export async function getOrCreateCustomer(userId: string, email: string, name: string): Promise<string> {
  const customers = await stripe.customers.list({ email, limit: 1 })

  if (customers.data.length > 0) {
    return customers.data[0].id
  }

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { userId },
  })

  return customer.id
}

export async function createConnectAccount(hubId: string, email: string, country: string): Promise<string> {
  const account = await stripe.accounts.create({
    type: "express",
    country,
    email,
    metadata: { hubId },
  })

  return account.id
}

export async function retrieveAccountLink(accountId: string): Promise<string> {
  const link = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/hub/account/refresh`,
    return_url: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/hub/account/return`,
  })

  return link.url
}
