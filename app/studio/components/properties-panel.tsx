"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icon } from "@/components/ui/icon"
import { useWorkspace } from "@/hooks/use-workspace"
import { useOcctWorker } from "@/hooks/use-occt-worker"

export interface PropertiesPanelProps {
  selectedObject?: string
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedObject }) => {
  const [activeTab, setActiveTab] = useState("properties")
  const { getObjectParameters, updateObjectParameters } = useWorkspace()
  const { applyParameters } = useOcctWorker()
  const [params, setParams] = useState({ length: 100, width: 50, height: 25 })

  useEffect(() => {
    if (selectedObject) {
      const p = getObjectParameters(selectedObject)
      if (p) setParams(p)
    }
  }, [selectedObject, getObjectParameters])

  const handleChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  const handleApply = async () => {
    if (!selectedObject) return
    const result = await applyParameters({ id: selectedObject, params })
    updateObjectParameters(selectedObject, params)
    // Optionally update viewer with new mesh
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
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-400)]">
                Parameters
              </h4>
              {["length", "width", "height"].map((key) => (
                <div key={key}>
                  <Label className="text-xs text-[var(--neutral-500)]">{key.charAt(0).toUpperCase() + key.slice(1)} (mm)</Label>
                  <Input
                    type="number"
                    value={params[key as keyof typeof params]}
                    onChange={(e) => handleChange(key, parseFloat(e.target.value))}
                    className="h-8 text-sm"
                  />
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full bg-transparent" onClick={handleApply}>
                Apply Changes
              </Button>
            </div>
          </div>
        )}

        {/* Toolpath and Hubs tabs can remain static or be wired to backend */}
        {activeTab === "toolpath" && <div className="text-sm text-[var(--neutral-500)]">Toolpath UI placeholder</div>}
        {activeTab === "hubs" && <div className="text-sm text-[var(--neutral-500)]">Hubs UI placeholder</div>}
      </div>
    </div>
  )
}
