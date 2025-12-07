"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icon } from "@/components/ui/icon"
import { Logo } from "@/components/logo"

const partData = {
  id: "part-001",
  name: "Precision Bracket",
  description:
    "High-precision aluminum bracket suitable for mounting electronics, sensors, and mechanical assemblies. Features precise hole placement and excellent surface finish.",
  category: "Brackets",
  material: "Aluminum 6061-T6",
  process: "CNC Milling",
  basePrice: 32,
  leadTime: "3-5 days",
  manufacturability: 96,
  thumbnail: "/placeholder.svg?height=400&width=400",
  parameters: [
    { name: "Length", value: 100, unit: "mm", min: 50, max: 200 },
    { name: "Width", value: 50, unit: "mm", min: 25, max: 100 },
    { name: "Height", value: 25, unit: "mm", min: 10, max: 50 },
    { name: "Hole Diameter", value: 6, unit: "mm", min: 3, max: 12 },
  ],
  materials: [
    { name: "Aluminum 6061-T6", priceMultiplier: 1.0 },
    { name: "Aluminum 7075", priceMultiplier: 1.3 },
    { name: "Steel 1018", priceMultiplier: 0.9 },
    { name: "Stainless 304", priceMultiplier: 1.5 },
  ],
  specifications: [
    { label: "Tolerance", value: "±0.1mm" },
    { label: "Surface Finish", value: "Ra 1.6μm" },
    { label: "Max Temp", value: "150°C" },
    { label: "Weight", value: "45g" },
  ],
}

export default function PartDetailPage() {
  const params = useParams()
  const [quantity, setQuantity] = useState(1)
  const [selectedMaterial, setSelectedMaterial] = useState(partData.materials[0])
  const [parameters, setParameters] = useState(
    partData.parameters.reduce((acc, p) => ({ ...acc, [p.name]: p.value }), {} as Record<string, number>),
  )

  const calculatedPrice = (partData.basePrice * selectedMaterial.priceMultiplier * quantity).toFixed(2)

  return (
    <div className="min-h-screen bg-[var(--bg-50)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[var(--neutral-200)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo variant="blue" size="md" href="/" />
            <div className="hidden sm:flex items-center gap-2 text-sm text-[var(--neutral-400)]">
              <span>/</span>
              <Link href="/catalog" className="hover:text-[var(--neutral-700)]">
                Catalog
              </Link>
              <span>/</span>
              <span className="text-[var(--neutral-700)]">{partData.name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left - Image & 3D Preview */}
          <div>
            <div className="bg-white rounded-2xl border border-[var(--neutral-200)] overflow-hidden">
              <div className="aspect-square bg-[var(--bg-100)] flex items-center justify-center">
                <img
                  src={partData.thumbnail || "/placeholder.svg"}
                  alt={partData.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  <Icon name="simulation" size={16} className="mr-2" />
                  3D Preview
                </Button>
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  <Icon name="download" size={16} className="mr-2" />
                  Download CAD
                </Button>
              </div>
            </div>

            {/* Specifications */}
            <div className="mt-6 bg-white rounded-xl border border-[var(--neutral-200)] p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--neutral-400)] mb-4">
                Specifications
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {partData.specifications.map((spec, idx) => (
                  <div key={idx}>
                    <p className="text-xs text-[var(--neutral-500)]">{spec.label}</p>
                    <p className="text-sm font-medium text-[var(--neutral-900)]">{spec.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Configuration */}
          <div>
            <div className="mb-6">
              <span className="text-sm text-[var(--accent-600)] font-medium">{partData.category}</span>
              <h1 className="text-3xl font-serif text-[var(--neutral-900)] mt-1">{partData.name}</h1>
              <p className="text-[var(--neutral-500)] mt-3 leading-relaxed">{partData.description}</p>
            </div>

            {/* Manufacturability Score */}
            <div className="bg-[var(--accent-50)] border border-[var(--accent-200)] rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[var(--neutral-700)]">Manufacturability Score</span>
                <span className="text-lg font-bold text-[var(--accent-700)]">{partData.manufacturability}%</span>
              </div>
              <div className="w-full h-2 bg-[var(--accent-200)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--accent-500)] rounded-full"
                  style={{ width: `${partData.manufacturability}%` }}
                />
              </div>
            </div>

            {/* Configuration Card */}
            <div className="bg-white rounded-xl border border-[var(--neutral-200)] p-6 space-y-6">
              {/* Material Selection */}
              <div>
                <Label className="text-sm font-medium text-[var(--neutral-700)] mb-3 block">Material</Label>
                <div className="grid grid-cols-2 gap-2">
                  {partData.materials.map((mat) => (
                    <button
                      key={mat.name}
                      onClick={() => setSelectedMaterial(mat)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        selectedMaterial.name === mat.name
                          ? "border-[var(--primary-500)] bg-[var(--primary-50)]"
                          : "border-[var(--neutral-200)] hover:border-[var(--neutral-300)]"
                      }`}
                    >
                      <p className="text-sm font-medium text-[var(--neutral-900)]">{mat.name}</p>
                      {mat.priceMultiplier !== 1 && (
                        <p className="text-xs text-[var(--neutral-500)]">
                          {mat.priceMultiplier > 1 ? "+" : ""}
                          {((mat.priceMultiplier - 1) * 100).toFixed(0)}%
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parameters */}
              <div>
                <Label className="text-sm font-medium text-[var(--neutral-700)] mb-3 block">Parameters</Label>
                <div className="grid grid-cols-2 gap-4">
                  {partData.parameters.map((param) => (
                    <div key={param.name}>
                      <Label className="text-xs text-[var(--neutral-500)]">
                        {param.name} ({param.unit})
                      </Label>
                      <Input
                        type="number"
                        value={parameters[param.name]}
                        onChange={(e) => setParameters({ ...parameters, [param.name]: Number(e.target.value) })}
                        min={param.min}
                        max={param.max}
                        className="h-9 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <Label className="text-sm font-medium text-[var(--neutral-700)] mb-3 block">Quantity</Label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 p-0 bg-transparent"
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-20 h-10 text-center"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 p-0 bg-transparent"
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Price Summary */}
              <div className="pt-4 border-t border-[var(--neutral-200)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[var(--neutral-500)]">Unit Price</span>
                  <span className="font-medium text-[var(--neutral-900)]">
                    ${(partData.basePrice * selectedMaterial.priceMultiplier).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[var(--neutral-500)]">Lead Time</span>
                  <span className="font-medium text-[var(--neutral-900)]">{partData.leadTime}</span>
                </div>
                <div className="flex items-center justify-between text-lg">
                  <span className="font-medium text-[var(--neutral-900)]">Total</span>
                  <span className="font-bold text-[var(--primary-700)]">${calculatedPrice}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 bg-transparent">
                  Add to Workspace
                </Button>
                <Button className="flex-1 bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-[var(--neutral-900)]">
                  Get Quote
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
