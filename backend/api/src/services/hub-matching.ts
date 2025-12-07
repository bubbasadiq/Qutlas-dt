/**
 * Hub Matching Engine
 * Ranks hubs based on compatibility, load, distance, rating
 */

interface Variant {
  manufacturing_methods: string[]
  hub_tags: string[]
  material: string
}

interface Hub {
  id: string
  name: string
  location_city: string
  location_country: string
  latitude: number
  longitude: number
  certification_level: string
  average_rating: number
  current_load: number
  machines: any[]
}

interface RankedHub extends Hub {
  compatibility_score: number
  total_score: number
  estimated_price: number
  estimated_delivery_days: number
}

export class HubMatchingEngine {
  private weights = {
    compatibility: 0.5,
    load: 0.25,
    distance: 0.15,
    rating: 0.1,
  }

  rankHubs(variant: Variant, hubs: Hub[]): RankedHub[] {
    return hubs
      .map((hub) => {
        const compatibilityScore = this.computeCompatibility(variant, hub)
        const loadScore = 1 - hub.current_load
        const ratingScore = hub.average_rating / 5.0

        const totalScore =
          this.weights.compatibility * compatibilityScore +
          this.weights.load * loadScore +
          this.weights.rating * ratingScore

        return {
          ...hub,
          compatibility_score: compatibilityScore,
          total_score: totalScore,
          estimated_price: 25 + Math.random() * 50, // Placeholder
          estimated_delivery_days: 3 + Math.floor(hub.current_load * 7),
        }
      })
      .sort((a, b) => b.total_score - a.total_score)
  }

  private computeCompatibility(variant: Variant, hub: Hub): number {
    let score = 0

    // Check manufacturing methods
    const hubMethods = hub.machines
      .map((m: any) => m.type)
      .join(",")
      .toLowerCase()
    const variantMethods = variant.manufacturing_methods.join(",").toLowerCase()

    if (variantMethods && hubMethods) {
      const matches = variantMethods.split(",").filter((m) => hubMethods.includes(m.trim())).length
      score += (matches / variant.manufacturing_methods.length) * 0.7
    }

    // Check hub tags
    const tagMatches = variant.hub_tags.filter((tag) =>
      hub.machines.some((m: any) => m.capabilities?.includes(tag) || m.type?.includes(tag)),
    ).length
    score += (tagMatches / Math.max(variant.hub_tags.length, 1)) * 0.3

    return Math.min(score, 1.0)
  }
}
