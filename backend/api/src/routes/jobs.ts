/**
 * Jobs API Routes
 * POST /api/v1/jobs/create — create and route job
 * GET /api/v1/jobs/:id — get job details
 */

import { Router, type Request, type Response } from "express"
import { v4 as uuid } from "uuid"
import type { Pool } from "pg"

const router = Router()

interface AppRequest extends Request {
  db: Pool
  userId: string
}

// POST /api/v1/jobs/create
router.post("/create", async (req: AppRequest, res: Response) => {
  try {
    const { catalog_item_id, variant_id, parameters, hub_id, payment_method } = req.body

    // Validate variant exists and is compatible with hub
    const variantResult = await req.db.query(
      `SELECT * FROM catalog_variants WHERE catalog_item_id = $1 AND variant_id = $2`,
      [catalog_item_id, variant_id],
    )

    if (variantResult.rows.length === 0) {
      return res.status(400).json({ error: "Variant not found" })
    }

    const hubResult = await req.db.query(`SELECT * FROM hubs WHERE id = $1 AND status = 'approved'`, [hub_id])

    if (hubResult.rows.length === 0) {
      return res.status(400).json({ error: "Hub not available or not approved" })
    }

    const jobId = uuid()
    const estimatedCompletion = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days

    // Create job
    const jobResult = await req.db.query(
      `INSERT INTO jobs (id, catalog_item_id, variant_id, hub_id, customer_id, status, parameters, cost_estimate, cost_currency, estimated_completion)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, status, cost_estimate, estimated_completion`,
      [
        jobId,
        catalog_item_id,
        variant_id,
        hub_id,
        req.userId,
        "created",
        JSON.stringify(parameters || {}),
        variantResult.rows[0].price_base * 1.2, // 20% markup
        variantResult.rows[0].price_currency,
        estimatedCompletion,
      ],
    )

    // TODO: Route to hub agent via gRPC, authorize payment, etc.

    return res.status(201).json({
      job_id: jobId,
      status: "created",
      cost_estimate: jobResult.rows[0].cost_estimate,
      estimated_completion: jobResult.rows[0].estimated_completion,
    })
  } catch (error) {
    console.error("Job creation error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
})

// GET /api/v1/jobs/:id
router.get("/:id", async (req: AppRequest, res: Response) => {
  try {
    const { id } = req.params

    const jobResult = await req.db.query(`SELECT * FROM jobs WHERE id = $1 AND customer_id = $2`, [id, req.userId])

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: "Job not found" })
    }

    // Fetch telemetry if available
    const telemetryResult = await req.db.query(
      `SELECT * FROM job_telemetry WHERE job_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [id],
    )

    const job = jobResult.rows[0]
    return res.json({
      ...job,
      telemetry: telemetryResult.rows[0] || null,
    })
  } catch (error) {
    console.error("Job fetch error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
})

export default router
