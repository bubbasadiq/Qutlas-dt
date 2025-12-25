"use client"

import React from "react"
import { Card } from "./card"
import { Button } from "./button"
import { Icon } from "./icon"
import { useCurrency } from "@/hooks/use-currency"

export interface HubSummary {
  hub_id: string
  name: string
  location: {
    city: string
    country: string
    latitude: number
    longitude: number
  }
  machines: string[]
  certification_level: "basic" | "verified" | "premium"
  average_rating: number
  current_load: number
  estimated_price: number
  estimated_delivery_days: number
}

export interface HubListProps {
  itemId: string
  hubs: HubSummary[]
  onRouteJob: (hubId: string, variantId: string) => Promise<void>
}

export const HubList: React.FC<HubListProps> = ({ itemId, hubs, onRouteJob }) => {
  const { formatPrice } = useCurrency()
  const [loading, setLoading] = React.useState<string | null>(null)

  const handleRoute = async (hubId: string) => {
    setLoading(hubId)
    try {
      await onRouteJob(hubId, "variant-id")
    } finally {
      setLoading(null)
    }
  }

  const certBadgeColor = {
    basic: "bg-[var(--neutral-100)] text-[var(--neutral-700)]",
    verified: "bg-[var(--primary-100)] text-[var(--primary-700)]",
    premium: "bg-[var(--accent-100)] text-[var(--accent-700)]",
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-[var(--neutral-900)]">Manufacturing Hubs</h3>

      {hubs.map((hub) => (
        <Card key={hub.hub_id} variant="outlined" padding="md">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-[var(--neutral-900)]">{hub.name}</h4>
                <span
                  className={`text-xs px-2 py-1 rounded-[var(--radius-md)] font-medium capitalize ${certBadgeColor[hub.certification_level]}`}
                >
                  {hub.certification_level}
                </span>
              </div>
              <p className="text-sm text-[var(--neutral-500)]">
                <Icon name="icon-hub-location" size="xs" className="inline mr-1" />
                {hub.location.city}, {hub.location.country}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-[var(--primary-700)]">{formatPrice(hub.estimated_price)}</p>
              <p className="text-xs text-[var(--neutral-500)]">{hub.estimated_delivery_days} days</p>
            </div>
          </div>

          {/* Machines */}
          <div className="mb-3 flex flex-wrap gap-1">
            {hub.machines.map((machine, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-1 bg-[var(--bg-100)] text-[var(--primary-700)] rounded-[var(--radius-md)]"
              >
                {machine}
              </span>
            ))}
          </div>

          {/* Rating and Load */}
          <div className="flex justify-between items-center mb-4 pb-4 border-t border-[var(--neutral-100)] pt-4">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-[var(--neutral-900)]">{hub.average_rating.toFixed(1)}★</span>
              <div className="w-32 h-2 bg-[var(--neutral-100)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--accent-700)]" style={{ width: `${(1 - hub.current_load) * 100}%` }} />
              </div>
              <span className="text-xs text-[var(--neutral-500)]">{Math.round(hub.current_load * 100)}% busy</span>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            className="w-full"
            loading={loading === hub.hub_id}
            onClick={() => handleRoute(hub.hub_id)}
          >
            Route Job to Hub
          </Button>
        </Card>
      ))}
    </div>
  )
}
