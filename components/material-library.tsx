"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCurrency } from "@/hooks/use-currency"

export interface Material {
  id: string
  name: string
  category: 'metal' | 'plastic' | 'composite' | 'other'
  properties: {
    density?: number // g/cm³
    tensileStrength?: number // MPa
    yieldStrength?: number // MPa
    hardness?: string
    thermalConductivity?: number
  }
  color: string
  cost?: number // per kg
  description?: string
}

export const MATERIALS: Material[] = [
  {
    id: 'aluminum-6061',
    name: 'Aluminum 6061-T6',
    category: 'metal',
    properties: {
      density: 2.7,
      tensileStrength: 310,
      yieldStrength: 276,
      hardness: '95 HB',
      thermalConductivity: 167,
    },
    color: '#C0C0C0',
    cost: 5,
    description: 'Excellent machinability, corrosion resistant'
  },
  {
    id: 'aluminum-7075',
    name: 'Aluminum 7075-T6',
    category: 'metal',
    properties: {
      density: 2.81,
      tensileStrength: 572,
      yieldStrength: 503,
      hardness: '150 HB',
    },
    color: '#B0B0B0',
    cost: 8,
    description: 'High strength, aerospace grade'
  },
  {
    id: 'steel-304',
    name: 'Stainless Steel 304',
    category: 'metal',
    properties: {
      density: 8.0,
      tensileStrength: 505,
      yieldStrength: 215,
      hardness: '70 HRB',
    },
    color: '#A8A8A8',
    cost: 6,
    description: 'Corrosion resistant, food grade'
  },
  {
    id: 'steel-4140',
    name: 'Alloy Steel 4140',
    category: 'metal',
    properties: {
      density: 7.85,
      tensileStrength: 655,
      yieldStrength: 415,
      hardness: '197 HB',
    },
    color: '#808080',
    cost: 4,
    description: 'High strength, wear resistant'
  },
  {
    id: 'brass-360',
    name: 'Brass 360',
    category: 'metal',
    properties: {
      density: 8.5,
      tensileStrength: 338,
      yieldStrength: 124,
    },
    color: '#DAA520',
    cost: 10,
    description: 'Excellent machinability, decorative'
  },
  {
    id: 'copper-101',
    name: 'Copper 101',
    category: 'metal',
    properties: {
      density: 8.94,
      tensileStrength: 220,
      thermalConductivity: 391,
    },
    color: '#B87333',
    cost: 12,
    description: 'High conductivity, anti-microbial'
  },
  {
    id: 'titanium-ti6al4v',
    name: 'Titanium Ti-6Al-4V',
    category: 'metal',
    properties: {
      density: 4.43,
      tensileStrength: 950,
      yieldStrength: 880,
    },
    color: '#9FA0A3',
    cost: 35,
    description: 'Lightweight, biocompatible, aerospace'
  },
  {
    id: 'abs',
    name: 'ABS Plastic',
    category: 'plastic',
    properties: {
      density: 1.05,
      tensileStrength: 40,
    },
    color: '#FFFACD',
    cost: 2,
    description: 'Impact resistant, easy to machine'
  },
  {
    id: 'nylon-6',
    name: 'Nylon 6',
    category: 'plastic',
    properties: {
      density: 1.14,
      tensileStrength: 75,
    },
    color: '#F5F5DC',
    cost: 3,
    description: 'Wear resistant, low friction'
  },
  {
    id: 'peek',
    name: 'PEEK',
    category: 'plastic',
    properties: {
      density: 1.32,
      tensileStrength: 100,
    },
    color: '#DEB887',
    cost: 80,
    description: 'High temperature, chemical resistant'
  },
  {
    id: 'delrin',
    name: 'Delrin (Acetal)',
    category: 'plastic',
    properties: {
      density: 1.41,
      tensileStrength: 68,
    },
    color: '#FFFAF0',
    cost: 4,
    description: 'Excellent dimensional stability'
  },
  {
    id: 'carbon-fiber',
    name: 'Carbon Fiber Composite',
    category: 'composite',
    properties: {
      density: 1.6,
      tensileStrength: 600,
    },
    color: '#2F4F4F',
    cost: 50,
    description: 'High strength-to-weight ratio'
  },
];

interface MaterialLibraryProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (material: Material) => void
  currentMaterial?: string
}

export function MaterialLibrary({ isOpen, onClose, onSelect, currentMaterial }: MaterialLibraryProps) {
  const { formatPrice } = useCurrency()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredMaterials = MATERIALS.filter(m => {
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'metal', label: 'Metals' },
    { id: 'plastic', label: 'Plastics' },
    { id: 'composite', label: 'Composites' },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Material Library</DialogTitle>
        </DialogHeader>

        {/* Search and Filter */}
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--neutral-200)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
          />

          <div className="flex gap-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-[var(--primary-700)] text-white'
                    : 'bg-[var(--bg-100)] text-[var(--neutral-700)] hover:bg-[var(--bg-200)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Materials Grid */}
        <div className="flex-1 overflow-y-auto mt-4">
          <div className="grid grid-cols-2 gap-3">
            {filteredMaterials.map(material => (
              <button
                key={material.id}
                onClick={() => {
                  onSelect(material)
                  onClose()
                }}
                className={`text-left p-4 rounded-lg border transition-all ${
                  currentMaterial === material.id
                    ? 'border-[var(--primary-700)] bg-[var(--primary-50)]'
                    : 'border-[var(--neutral-200)] hover:border-[var(--neutral-300)] hover:bg-[var(--bg-100)]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="w-12 h-12 rounded-lg border border-[var(--neutral-200)] flex-shrink-0"
                    style={{ backgroundColor: material.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-[var(--neutral-900)] mb-1">
                      {material.name}
                    </h4>
                    <p className="text-xs text-[var(--neutral-500)] mb-2 line-clamp-2">
                      {material.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {material.properties.density && (
                        <span className="text-xs px-2 py-0.5 rounded bg-[var(--bg-200)] text-[var(--neutral-600)]">
                          {material.properties.density} g/cm³
                        </span>
                      )}
                      {material.properties.tensileStrength && (
                        <span className="text-xs px-2 py-0.5 rounded bg-[var(--bg-200)] text-[var(--neutral-600)]">
                          {material.properties.tensileStrength} MPa
                        </span>
                      )}
                      {material.cost && (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                          {formatPrice(material.cost)}/kg
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {filteredMaterials.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[var(--neutral-500)]">No materials found</p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
