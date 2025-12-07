"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icon } from "@/components/ui/icon"

export interface PropertiesPanelProps {
  selectedObject?: string
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedObject }) => {
  const [activeTab, setActiveTab] = useState("properties")

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
              <p className="text-xs text-[var(--neutral-500)]">Parametric Box</p>
            </div>

            {/* Transform */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-400)]">Transform</h4>
              <div className="grid grid-cols-3 gap-2">
                {["X", "Y", "Z"].map((axis) => (
                  <div key={axis}>
                    <Label className="text-xs text-[var(--neutral-500)]">{axis}</Label>
                    <Input type="number" defaultValue="0" className="h-8 text-sm" />
                  </div>
                ))}
              </div>
            </div>

            {/* Parameters */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-400)]">Parameters</h4>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-[var(--neutral-500)]">Length (mm)</Label>
                  <Input type="number" defaultValue="100" className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-[var(--neutral-500)]">Width (mm)</Label>
                  <Input type="number" defaultValue="50" className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-[var(--neutral-500)]">Height (mm)</Label>
                  <Input type="number" defaultValue="25" className="h-8 text-sm" />
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full bg-transparent">
                Apply Changes
              </Button>
            </div>

            {/* Manufacturability */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-400)]">
                Manufacturability
              </h4>
              <div className="bg-[var(--bg-100)] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--neutral-700)]">Score</span>
                  <span className="text-lg font-semibold text-[var(--accent-600)]">92%</span>
                </div>
                <div className="w-full h-2 bg-[var(--neutral-200)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--accent-500)] rounded-full" style={{ width: "92%" }} />
                </div>
                <div className="mt-3 p-2 bg-[var(--accent-50)] rounded-lg border border-[var(--accent-200)]">
                  <p className="text-xs text-[var(--accent-700)]">
                    <span className="font-medium">Suggestion:</span> Increase wall thickness to 2mm for better
                    machinability
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "toolpath" && (
          <div className="space-y-4">
            {/* Preview */}
            <div className="aspect-square bg-[var(--bg-100)] rounded-xl flex items-center justify-center border-2 border-dashed border-[var(--neutral-200)]">
              <div className="text-center">
                <Icon name="toolpath" size={40} className="mx-auto mb-2 text-[var(--neutral-400)]" />
                <p className="text-xs text-[var(--neutral-500)]">No toolpath generated</p>
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-[var(--neutral-500)]">Process</Label>
                <select className="w-full h-8 text-sm border border-[var(--neutral-200)] rounded-lg px-3">
                  <option>CNC Milling</option>
                  <option>Laser Cutting</option>
                  <option>3D Printing</option>
                </select>
              </div>
              <div>
                <Label className="text-xs text-[var(--neutral-500)]">Material</Label>
                <select className="w-full h-8 text-sm border border-[var(--neutral-200)] rounded-lg px-3">
                  <option>Aluminum 6061</option>
                  <option>Steel 1018</option>
                  <option>ABS Plastic</option>
                </select>
              </div>
            </div>

            <Button className="w-full bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white">
              Generate Toolpath
            </Button>
          </div>
        )}

        {activeTab === "hubs" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-[var(--neutral-900)]">Recommended Hubs</h4>
              <span className="text-xs text-[var(--neutral-500)]">3 available</span>
            </div>

            <div className="space-y-2">
              {[
                { name: "TechHub LA", time: "3 days", price: "$45", rating: 4.9 },
                { name: "MechPrecision Toronto", time: "5 days", price: "$38", rating: 4.7 },
                { name: "FastCut NYC", time: "2 days", price: "$62", rating: 4.8 },
              ].map((hub, i) => (
                <button
                  key={i}
                  className="w-full p-3 rounded-xl text-left border border-[var(--neutral-200)] hover:border-[var(--primary-500)] hover:bg-[var(--primary-50)] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm text-[var(--neutral-900)]">{hub.name}</p>
                      <p className="text-xs text-[var(--neutral-500)] mt-0.5">
                        Est. {hub.time} • {hub.price}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[var(--accent-600)]">
                      <span>★</span>
                      <span>{hub.rating}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <Button className="w-full bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-[var(--neutral-900)]">
              Get Quote
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="border-t border-[var(--neutral-200)] p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--neutral-500)]">Estimated Cost</span>
          <span className="font-semibold text-[var(--neutral-900)]">$45 - $62</span>
        </div>
        <Button className="w-full h-10 bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white">
          Submit to Production
        </Button>
      </div>
    </div>
  )
}
