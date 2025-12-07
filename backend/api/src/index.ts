/**
 * Qutlas Backend API Server
 * Express.js + TypeScript + PostgreSQL
 */

import express, { type Request, type Response, type NextFunction } from "express"
import { Pool } from "pg"
import cors from "cors"
import catalogRoutes from "./routes/catalog"
import jobsRoutes from "./routes/jobs"

const app = express()
const port = process.env.PORT || 3001

// Database connection
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Middleware
app.use(cors())
app.use(express.json())

// Attach DB to request
app.use((req: Request, res: Response, next: NextFunction) => {
  ;(req as any).db = db
  ;(req as any).userId = req.headers["x-user-id"] || "test-user" // From auth middleware
  next()
})

// Routes
app.use("/api/v1/catalog", catalogRoutes)
app.use("/api/v1/jobs", jobsRoutes)

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error:", err)
  res.status(500).json({ error: "Internal server error" })
})

// Start server
app.listen(port, () => {
  console.log(`✓ Qutlas API running on http://localhost:${port}`)
})

export default app
