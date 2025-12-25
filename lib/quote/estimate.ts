import { selectToolpath } from "@/lib/toolpath/select-toolpath"

export interface QuoteEstimateInput {
  quantity: number
  material?: string
  process?: string
  toolpathId?: string
  geometryParams?: Record<string, any>
  featureCount?: number
}

export interface QuoteEstimate {
  unitPrice: number
  subtotal: number
  platformFee: number
  totalPrice: number
  leadTimeDays: number
}

function normalize(s: string | undefined) {
  return (s || "").trim().toLowerCase()
}

function computeVolumeCm3(params: Record<string, any>) {
  const length = Number(params.length ?? params.width ?? params.x ?? 0)
  const width = Number(params.width ?? params.depth ?? params.y ?? 0)
  const height = Number(params.height ?? params.depth ?? params.z ?? 0)
  if (!length || !width || !height) return 0
  const volumeMm3 = length * width * height
  return volumeMm3 / 1000
}

export function estimateQuote(input: QuoteEstimateInput): QuoteEstimate {
  const quantity = Math.max(1, Math.floor(input.quantity || 1))
  const material = normalize(input.material)
  const process = normalize(input.process)

  const volumeCm3 = computeVolumeCm3(input.geometryParams || {})
  const toolpath = selectToolpath({
    process: input.process,
    material: input.material,
    objectType: normalize(String((input.geometryParams as any)?.type)) || undefined,
    geometryParams: input.geometryParams,
    featureCount: input.featureCount,
  })

  const materialMultiplier =
    material.includes("titan") ? 2.2 : material.includes("stainless") ? 1.6 : material.includes("steel") ? 1.3 : material.includes("brass") ? 1.4 : material.includes("abs") || material.includes("plastic") ? 0.8 : 1

  const processMultiplier =
    process.includes("laser") ? 0.8 : process.includes("print") ? 0.9 : process.includes("cnc") || process.includes("milling") ? 1.1 : 1

  const toolpathMultiplier =
    toolpath.id.includes("3d") ? 1.25 : toolpath.id.includes("turn") ? 1.15 : toolpath.id.includes("laser") ? 0.85 : 1

  const base = 8
  const volumeCost = volumeCm3 > 0 ? volumeCm3 * 0.06 : 5
  const complexityCost = (input.featureCount || 0) * 0.75

  let unitPrice = (base + volumeCost + complexityCost) * materialMultiplier * processMultiplier * toolpathMultiplier

  // Volume discounts
  if (quantity >= 10) unitPrice *= 0.95
  if (quantity >= 50) unitPrice *= 0.9
  if (quantity >= 100) unitPrice *= 0.85

  unitPrice = Math.round(unitPrice * 100) / 100

  const subtotal = Math.round(unitPrice * quantity * 100) / 100
  const platformFee = Math.round(subtotal * 0.15 * 100) / 100
  const totalPrice = Math.round((subtotal + platformFee) * 100) / 100

  const leadTimeDays = process.includes("laser") ? 3 : process.includes("print") ? 4 : 5

  return { unitPrice, subtotal, platformFee, totalPrice, leadTimeDays }
}
