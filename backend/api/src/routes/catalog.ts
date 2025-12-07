/**
 * Catalog API Routes
 * POST /api/v1/catalog — create item
 * GET /api/v1/catalog — list with search
 * GET /api/v1/catalog/:id — detail
 * GET /api/v1/catalog/:id/hubs — find compatible hubs
 */

import { Router, type Request, type Response } from "express"
import { v4 as uuid } from "uuid"
import type { Pool } from "pg"
import { CatalogItemSchema, HubMatchingEngine } from "../services"

const router = Router()

interface AppRequest extends Request {
  db: Pool
  userId: string
}

// POST /api/v1/catalog
router.post("/", async (req: AppRequest, res: Response) => {
  try {
    // Validate payload against schema
    const validationResult = CatalogItemSchema.safeParse(req.body)
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.errors,
      })
    }

    const { title, description, category, qdf_ref, supplier, variants, ai_metrics, visibility } = validationResult.data

    const itemId = uuid()

    // Insert catalog item
    const itemResult = await req.db.query(
      `INSERT INTO catalog_items (id, title, description, category, qdf_ref, supplier_name, supplier_url, ai_metrics, visibility, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, title, created_at`,
      [
        itemId,
        title,
        description,
        category,
        qdf_ref,
        supplier?.name || null,
        supplier?.url || null,
        JSON.stringify(ai_metrics),
        visibility || "public",
        req.userId,
      ],
    )

    // Insert variants
    const variantInserts = variants.map((v: any) =>
      req.db.query(
        `INSERT INTO catalog_variants (catalog_item_id, variant_id, name, parameters, material, price_base, price_currency, lead_time_days, manufacturing_methods, hub_tags)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          itemId,
          v.variant_id,
          v.name,
          JSON.stringify(v.parameters),
          v.material,
          v.price_base,
          v.price_currency,
          v.lead_time_days,
          v.manufacturing_methods,
          v.hub_tags,
        ],
      ),
    )

    await Promise.all(variantInserts)

    return res.status(201).json({
      id: itemId,
      title,
      message: "Catalog item created successfully",
    })
  } catch (error) {
    console.error("Catalog create error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
})

// GET /api/v1/catalog
router.get("/", async (req: AppRequest, res: Response) => {
  try {
    const { q = "", category = "", skip = 0, limit = 20 } = req.query

    const searchQuery = `%${q}%`
    const categoryFilter = category ? `AND category = $3` : ""

    const query = `
        SELECT id, title, description, category, ai_metrics, price_base, created_at
        FROM catalog_items
        WHERE (title ILIKE $1 OR description ILIKE $1)
        ${categoryFilter}
        ORDER BY created_at DESC
        LIMIT $${category ? 4 : 3} OFFSET $${category ? 5 : 4}
      `

    const params = [searchQuery, limit, ...(category ? [category] : []), skip]

    const result = await req.db.query(query, params)

    // Get total count
    const countResult = await req.db.query(
      `SELECT COUNT(*) FROM catalog_items
         WHERE (title ILIKE $1 OR description ILIKE $1)
         ${categoryFilter}`,
      params.slice(0, category ? 2 : 1),
    )

    return res.json({
      items: result.rows,
      total: Number.parseInt(countResult.rows[0].count),
      skip,
      limit,
    })
  } catch (error) {
    console.error("Catalog list error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
})

// GET /api/v1/catalog/:id
router.get("/:id", async (req: AppRequest, res: Response) => {
  try {
    const { id } = req.params

    const itemResult = await req.db.query(`SELECT * FROM catalog_items WHERE id = $1`, [id])

    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: "Catalog item not found" })
    }

    const variantsResult = await req.db.query(`SELECT * FROM catalog_variants WHERE catalog_item_id = $1`, [id])

    const assetsResult = await req.db.query(
      `SELECT type, url, mime_type FROM catalog_assets WHERE catalog_item_id = $1`,
      [id],
    )

    return res.json({
      ...itemResult.rows[0],
      variants: variantsResult.rows,
      assets: assetsResult.rows,
    })
  } catch (error) {
    console.error("Catalog detail error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
})

// GET /api/v1/catalog/:id/hubs
router.get("/:id/hubs", async (req: AppRequest, res: Response) => {
  try {
    const { id } = req.params
    const { variant_id } = req.query

    if (!variant_id) {
      return res.status(400).json({ error: "variant_id required" })
    }

    // Fetch variant details
    const variantResult = await req.db.query(
      `SELECT * FROM catalog_variants WHERE catalog_item_id = $1 AND variant_id = $2`,
      [id, variant_id],
    )

    if (variantResult.rows.length === 0) {
      return res.status(404).json({ error: "Variant not found" })
    }

    const variant = variantResult.rows[0]

    // Fetch all approved hubs
    const hubsResult = await req.db.query(
      `SELECT id, name, location_city, location_country, latitude, longitude, certification_level, average_rating, current_load, machines
         FROM hubs
         WHERE status = 'approved'`,
    )

    // Use matching engine to rank hubs
    const matcher = new HubMatchingEngine()
    const rankedHubs = matcher.rankHubs(variant, hubsResult.rows)

    return res.json({ hubs: rankedHubs.slice(0, 10) })
  } catch (error) {
    console.error("Hub matching error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
})

export default router
