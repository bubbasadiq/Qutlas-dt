"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Input } from "./input"
import { useCurrency } from "@/hooks/use-currency"

export interface Variant {
  variant_id: string
  name: string
  parameters: Record<string, number>
  material: string
  price_base: number
  lead_time_days: number
}

export interface VariantSelectorProps {
  itemId: string
  variants: Variant[]
  onChange: (variantId: string, params: Record<string, number>) => void
}

export const VariantSelector: React.FC<VariantSelectorProps> = ({ itemId, variants, onChange }) => {
  const { currency, formatPrice } = useCurrency()
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(variants[0] || null)
  const [params, setParams] = useState<Record<string, number>>(selectedVariant?.parameters || {})

  const handleVariantChange = (variant: Variant) => {
    setSelectedVariant(variant)
    setParams(variant.parameters)
    onChange(variant.variant_id, variant.parameters)
  }

  const handleParamChange = (key: string, value: number) => {
    const updated = { ...params, [key]: value }
    setParams(updated)
    onChange(selectedVariant?.variant_id || "", updated)
  }

  return (
    <Card variant="default" padding="md">
      <CardHeader>
        <CardTitle>Configure Variant</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Variant tabs */}
        <div className="flex gap-2 mb-6">
          {variants.map((variant) => (
            <button
              key={variant.variant_id}
              onClick={() => handleVariantChange(variant)}
              className={`px-4 py-2 rounded-[var(--radius-md)] font-medium transition-all duration-[var(--motion-mid)] ${
                selectedVariant?.variant_id === variant.variant_id
                  ? "bg-[var(--primary-700)] text-white"
                  : "bg-[var(--neutral-100)] text-[var(--neutral-700)] hover:bg-[var(--neutral-200)]"
              }`}
            >
              {variant.name}
            </button>
          ))}
        </div>

        {selectedVariant && (
          <div className="space-y-4">
            {/* Material and pricing info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-[var(--bg-200)] rounded-[var(--radius-md)]">
              <div>
                <p className="text-xs text-[var(--neutral-500)] uppercase tracking-wide">Material</p>
                <p className="font-semibold text-[var(--neutral-900)]">{selectedVariant.material}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--neutral-500)] uppercase tracking-wide">Price</p>
                <p className="font-semibold text-[var(--primary-700)]">{formatPrice(selectedVariant.price_base)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--neutral-500)] uppercase tracking-wide">Lead Time</p>
                <p className="font-semibold text-[var(--neutral-900)]">{selectedVariant.lead_time_days} days</p>
              </div>
            </div>

            {/* Parameters */}
            {Object.keys(params).length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-[var(--neutral-900)]">Parameters</p>
                {Object.entries(params).map(([key, value]) => (
                  <Input
                    key={key}
                    label={key.charAt(0).toUpperCase() + key.slice(1)}
                    type="number"
                    value={value}
                    onChange={(e) => handleParamChange(key, Number.parseFloat(e.target.value))}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
