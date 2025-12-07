// Payment endpoints for job creation and hub settlement
import { Router, type Request, type Response } from "express"
import * as stripeService from "../services/stripe-service"
import * as db from "../db"
import { auth } from "../middleware/auth"

const router = Router()

interface PaymentRequest extends Request {
  user?: { id: string }
}

// Create payment intent for job
router.post<{}, {}, { jobId: string; catalogItemId: string; variantId: string; hubId: string }>(
  "/payments/create-intent",
  auth,
  async (req: PaymentRequest, res: Response) => {
    try {
      const { jobId, catalogItemId, variantId, hubId } = req.body
      const userId = req.user?.id || ""

      // Fetch pricing from catalog
      const variant = await db.query("SELECT price_base FROM catalog_variants WHERE id = $1", [variantId])

      if (variant.rows.length === 0) {
        return res.status(404).json({ error: "Variant not found" })
      }

      const basePrice = variant.rows[0].price_base
      const platformFee = basePrice * 0.05
      const totalAmount = basePrice + platformFee

      // Get or create Stripe customer
      const user = await db.query("SELECT email, name FROM users WHERE id = $1", [userId])
      const customerId = await stripeService.getOrCreateCustomer(userId, user.rows[0].email, user.rows[0].name)

      // Create payment intent
      const { clientSecret, paymentIntentId } = await stripeService.createJobPaymentIntent({
        jobId,
        customerId,
        amount: totalAmount,
        currency: "USD",
        estimatedCost: basePrice,
        platformFee,
      })

      // Store payment record
      await db.query(
        `INSERT INTO job_payments (job_id, payment_intent_id, amount, status)
         VALUES ($1, $2, $3, 'pending')`,
        [jobId, paymentIntentId, totalAmount],
      )

      res.json({ clientSecret, paymentIntentId, amount: totalAmount })
    } catch (error) {
      res.status(500).json({ error: "Payment creation failed" })
    }
  },
)

// Confirm payment and route job to hub
router.post<{}, {}, { paymentIntentId: string; jobId: string }>(
  "/payments/confirm",
  auth,
  async (req: PaymentRequest, res: Response) => {
    try {
      const { paymentIntentId, jobId } = req.body

      const captured = await stripeService.capturePayment(paymentIntentId)
      if (!captured) {
        return res.status(400).json({ error: "Payment capture failed" })
      }

      // Update job status to "confirmed"
      await db.query(`UPDATE jobs SET status = 'confirmed', payment_status = 'paid' WHERE id = $1`, [jobId])

      // Dispatch job to hub
      // (Hub agent code will pull confirmed jobs)

      res.json({ status: "payment_confirmed", jobId })
    } catch (error) {
      res.status(500).json({ error: "Payment confirmation failed" })
    }
  },
)

// Webhook for Stripe events
router.post<{}, {}, Buffer>("/payments/webhook", async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string

  try {
    const event = await stripeService.stripe.webhooks.constructEventAsync(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || "",
    )

    if (event.type === "payment_intent.succeeded") {
      console.log("[v0] Payment succeeded:", event.data.object)
      // Mark escrow as available for release
    }

    if (event.type === "payment_intent.payment_failed") {
      console.log("[v0] Payment failed:", event.data.object)
      // Retry logic or notify user
    }

    res.json({ received: true })
  } catch (error) {
    res.status(400).send("Webhook Error")
  }
})

export default router
