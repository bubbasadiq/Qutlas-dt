"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icon } from "@/components/ui/icon"
import { useWorkspace } from "@/hooks/use-workspace"
import { toast } from "sonner"

export interface PropertiesPanelProps {
  selectedObject?: string
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedObject }) => {
  const [activeTab, setActiveTab] = useState("properties")
  const { getObjectParameters, updateObjectParameters, getObjectGeometry } = useWorkspace()
  const [params, setParams] = useState<Record<string, number>>({})
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    if (selectedObject) {
      const p = getObjectParameters(selectedObject)
      if (p) setParams(p)
    }
  }, [selectedObject, getObjectParameters])

  const handleChange = (key: string, value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue) || numValue <= 0) return
    setParams((prev) => ({ ...prev, [key]: numValue }))
  }

  const handleApply = () => {
    if (!selectedObject) return
    
    setApplying(true)
    try {
      // Update the object parameters in workspace context
      // This will trigger a re-render in canvas-viewer which will rebuild the mesh
      updateObjectParameters(selectedObject, params)
      toast.success('Parameters updated')
    } catch (error) {
      toast.error('Failed to update parameters')
    } finally {
      setApplying(false)
    }
  }

  // Get dynamic parameters based on object type
  const getParametersForObject = () => {
    if (!selectedObject) return []
    
    const obj = getObjectGeometry(selectedObject)
    if (!obj) return []

    const type = obj.type

    switch (type) {
      case 'cylinder':
        return [
          { key: 'radius', label: 'Radius', unit: 'mm' },
          { key: 'diameter', label: 'Diameter', unit: 'mm' },
          { key: 'height', label: 'Height', unit: 'mm' },
        ]
      case 'sphere':
        return [
          { key: 'radius', label: 'Radius', unit: 'mm' },
          { key: 'diameter', label: 'Diameter', unit: 'mm' },
        ]
      case 'box':
      default:
        return [
          { key: 'length', label: 'Length', unit: 'mm' },
          { key: 'width', label: 'Width', unit: 'mm' },
          { key: 'height', label: 'Height', unit: 'mm' },
        ]
    }
  }

  const tabs = [
    { id: "properties", label: "Properties" },
    { id: "toolpath", label: "Toolpath" },
    { id: "hubs", label: "Hubs" },
  ]

  return (
    <div className="w-80 bg-white border-l border-[var(--neutral-200)] flex flex-col">
      {/* Tabs */}
      <div className="border-b border-[var(--neutral-200)] p-2">
        <div className="flex gap-1 bg-[var(--neutral-100)] rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === tab.id ? "bg-white text-[var(--neutral-900)] shadow-sm" : "text-[var(--neutral-500)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "properties" && (
          <div className="space-y-6">
            {/* Object Info */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--neutral-900)] mb-1">
                {selectedObject || "No Selection"}
              </h3>
              <p className="text-xs text-[var(--neutral-500)]">Parametric Object</p>
            </div>

            {/* Transform / Parameters */}
            {selectedObject ? (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-400)]">
                  Parameters
                </h4>
                {getParametersForObject().map((param) => (
                  <div key={param.key}>
                    <Label className="text-xs text-[var(--neutral-500)]">
                      {param.label} ({param.unit})
                    </Label>
                    <Input
                      type="number"
                      value={params[param.key] || 0}
                      onChange={(e) => handleChange(param.key, e.target.value)}
                      className="h-8 text-sm"
                      min={0.1}
                      step={0.1}
                    />
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full bg-transparent" 
                  onClick={handleApply}
                  disabled={applying}
                >
                  {applying ? 'Applying...' : 'Apply Changes'}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-[var(--neutral-500)]">Select an object to edit its properties</p>
            )}
          </div>
        )}

        {/* Toolpath and Hubs tabs can remain static or be wired to backend */}
        {activeTab === "toolpath" && <div className="text-sm text-[var(--neutral-500)]">Toolpath UI placeholder</div>}
        {activeTab === "hubs" && <div className="text-sm text-[var(--neutral-500)]">Hubs UI placeholder</div>}
      </div>
    </div>
  )
}
