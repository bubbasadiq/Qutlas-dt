# Qutlas API Contracts

## Core Endpoints

### Authentication

\`\`\`
POST /auth/signup
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure-password",
  "company": "Acme Inc",
  "role": "user"
}

Response 201:
{
  "user_id": "usr_123",
  "email": "john@example.com",
  "verification_required": true
}
\`\`\`

### Catalog

\`\`\`
GET /api/v1/catalog
Response 200:
{
  "items": [
    {
      "id": "cat_001",
      "title": "M12 Bolt",
      "category": "fasteners",
      "price_range": "$2–5",
      "ai_manufacturability": 0.95,
      "variants_count": 12
    }
  ],
  "total": 250
}

GET /api/v1/catalog/:id/hubs
Response 200:
{
  "hubs": [
    {
      "hub_id": "hub_001",
      "name": "TechHub LA",
      "estimated_price": 25.50,
      "estimated_delivery_days": 2,
      "compatibility_score": 0.92
    }
  ]
}
\`\`\`

### Jobs

\`\`\`
POST /api/v1/jobs/create
{
  "catalog_item_id": "cat_001",
  "variant_id": "var_001",
  "params": { "length": 100, "material": "Stainless Steel" },
  "hub_id": "hub_001",
  "payment_method": "card_xxx"
}

Response 201:
{
  "job_id": "job_abc123",
  "status": "pending_payment",
  "estimated_cost": 25.50,
  "estimated_delivery": "2025-01-15"
}

POST /api/v1/jobs/:id/confirm-payment
Response 200:
{
  "job_id": "job_abc123",
  "status": "confirmed",
  "hub_confirmed_at": "2025-01-14T10:30:00Z"
}
\`\`\`

### AI Assessment

\`\`\`
POST /ai/v1/assess
{
  "asset_id": "asset_xyz",
  "variant_params": { "length": 100, "wall_thickness": 2 }
}

Response 200:
{
  "manufacturability_score": 0.88,
  "issues": [
    {
      "code": "THIN_WALL",
      "message": "Wall thickness 2mm is below recommended 3mm",
      "fix": "Increase to 3mm for better strength"
    }
  ],
  "warnings": []
}
\`\`\`

## WebSocket Events

### Real-time Job Updates

\`\`\`
ws://backend/jobs/:job_id

// Hub started execution
{
  "type": "job_started",
  "machine_id": "mill_001",
  "eta_completion": 3600
}

// Real-time progress (every 30 seconds)
{
  "type": "job_progress",
  "percent_complete": 45,
  "current_operation": "drilling",
  "estimated_remaining_time": 1980
}

// Job completed
{
  "type": "job_complete",
  "status": "success",
  "final_statistics": {
    "cycle_time": 3456,
    "rejects": 0,
    "quality_score": 0.99
  }
}
\`\`\`

## Rate Limits

- Catalog endpoints: 100 req/min per user
- Job creation: 10 req/min per user
- AI assessment: 50 req/min per user
- Upload: 50 MB/day per user

---

**For complete OpenAPI v3 spec, see `docs/openapi.yaml`**
