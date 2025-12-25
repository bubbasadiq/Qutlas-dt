"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icon } from "@/components/ui/icon"
import { useWorkspace } from "@/hooks/use-workspace"
import { useIsMobile } from "@/hooks/use-media-query"
import { toast } from "sonner"
import { MaterialLibrary, MATERIALS, type Material } from "@/components/material-library"
import { selectToolpath } from "@/lib/toolpath/select-toolpath"
import { assessManufacturability } from "@/lib/manufacturability/assess"
import { estimateQuote } from "@/lib/quote/estimate"

export interface PropertiesPanelProps {
  selectedObject?: string
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedObject }) => {
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState("properties")
  const { getObjectParameters, updateObjectParameters, getObjectGeometry, updateObject } = useWorkspace()
  const [params, setParams] = useState<Record<string, number>>({})
  const [applying, setApplying] = useState(false)
  const [showMaterialLibrary, setShowMaterialLibrary] = useState(false)
  const [selectedProcess, setSelectedProcess] = useState("CNC Milling")
  const [quantity, setQuantity] = useState(1)

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

  const handleMaterialSelect = (material: Material) => {
    if (!selectedObject) return
    updateObject(selectedObject, { material: material.id })
    toast.success(`Material changed to ${material.name}`)
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
  ]

  // Mobile optimized styles
  const mobileTabClass = isMobile
    ? "flex-1 px-4 py-3 text-sm font-medium rounded-md transition-colors min-h-[44px]"
    : "flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors"

  const mobileInputClass = isMobile ? "h-12 text-base" : "h-8 text-sm"

  return (
    <div className={`bg-white ${isMobile ? '' : 'border-l border-[var(--neutral-200)] flex flex-col'}`}>
      {/* Tabs */}
      <div className={`${isMobile ? 'p-2' : 'border-b border-[var(--neutral-200)] p-2'}`}>
        <div className={`flex gap-1 ${isMobile ? 'bg-gray-100 p-1 rounded-xl' : 'bg-[var(--neutral-100)] rounded-lg p-1'}`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${mobileTabClass} ${
                activeTab === tab.id 
                  ? "bg-white text-[var(--neutral-900)] shadow-sm" 
                  : "text-[var(--neutral-500)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 overflow-y-auto ${isMobile ? 'p-4' : 'p-4'}`}>
        {activeTab === "properties" && (
          <div className="space-y-6">
            {/* Object Info */}
            <div>
              <h3 className="text-base font-semibold text-[var(--neutral-900)] mb-1">
                {selectedObject || "No Selection"}
              </h3>
              <p className="text-sm text-[var(--neutral-500)]">Parametric Object</p>
            </div>

            {/* Material Selection */}
            {selectedObject && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-[var(--neutral-400)]">
                  Material
                </h4>
                <button
                  onClick={() => setShowMaterialLibrary(true)}
                  className={`w-full rounded-lg border border-[var(--neutral-200)] hover:border-[var(--neutral-300)] transition-colors text-left touch-manipulation ${
                    isMobile ? 'p-4' : 'p-3'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className={`rounded border border-[var(--neutral-200)] ${
                        isMobile ? 'w-12 h-12' : 'w-8 h-8'
                      }`}
                      style={{ 
                        backgroundColor: MATERIALS.find(m => m.id === (getObjectGeometry(selectedObject)?.material || 'aluminum-6061'))?.color || '#C0C0C0'
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-medium text-[var(--neutral-900)]">
                        {MATERIALS.find(m => m.id === (getObjectGeometry(selectedObject)?.material || 'aluminum-6061'))?.name || 'Aluminum 6061-T6'}
                      </p>
                      <p className="text-sm text-[var(--neutral-500)]">
                        Click to change
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Transform / Parameters */}
            {selectedObject ? (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-[var(--neutral-400)]">
                  Parameters
                </h4>
                {getParametersForObject().map((param) => (
                  <div key={param.key}>
                    <Label className={`text-[var(--neutral-500)] ${isMobile ? 'text-sm mb-2 block' : 'text-xs'}`}>
                      {param.label} ({param.unit})
                    </Label>
                    <Input
                      type="number"
                      value={params[param.key] || 0}
                      onChange={(e) => handleChange(param.key, e.target.value)}
                      className={mobileInputClass}
                      min={0.1}
                      step={0.1}
                    />
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  size={isMobile ? "default" : "sm"} 
                  className={`w-full bg-transparent ${isMobile ? 'h-12 text-base' : ''}`}
                  onClick={handleApply}
                  disabled={applying}
                >
                  {applying ? 'Applying...' : 'Apply Changes'}
                </Button>
              </div>
            ) : (
              <p className="text-base text-[var(--neutral-500)]">Select an object to edit its properties</p>
            )}
          </div>
        )}

        {/* Toolpath Tab */}
        {activeTab === "toolpath" && (
          <div className="space-y-6">
            {selectedObject ? (
              <>
                {/* Process Selection */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-[var(--neutral-400)]">
                    Manufacturing Process
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {["CNC Milling", "CNC Turning", "Laser Cutting", "3D Printing", "Sheet Metal"].map((process) => (
                      <button
                        key={process}
                        onClick={() => setSelectedProcess(process)}
                        className={`${isMobile ? 'p-3' : 'p-2'} rounded-lg border transition-colors text-left ${
                          selectedProcess === process
                            ? "border-[var(--primary-700)] bg-[var(--primary-50)] text-[var(--primary-900)]"
                            : "border-[var(--neutral-200)] hover:border-[var(--neutral-300)]"
                        }`}
                      >
                        <div className={`font-medium ${isMobile ? 'text-sm' : 'text-xs'}`}>{process}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toolpath Strategy */}
                {(() => {
                  const obj = getObjectGeometry(selectedObject)
                  const material = MATERIALS.find(m => m.id === (obj?.material || 'aluminum-6061'))
                  const toolpath = selectToolpath({
                    process: selectedProcess,
                    material: material?.name,
                    objectType: obj?.type,
                    geometryParams: params,
                    featureCount: 0
                  })
                  
                  return (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-[var(--neutral-400)]">
                        Toolpath Strategy
                      </h4>
                      <div className={`rounded-lg border border-[var(--neutral-200)] bg-[var(--neutral-50)] ${isMobile ? 'p-4' : 'p-3'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`${isMobile ? 'mt-1' : 'mt-0.5'}`}>
                            <Icon name="settings" className="w-5 h-5 text-[var(--primary-700)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-[var(--neutral-900)] mb-1">{toolpath.name}</h5>
                            <p className={`text-[var(--neutral-600)] ${isMobile ? 'text-sm' : 'text-xs'} mb-2`}>
                              {toolpath.strategy}
                            </p>
                            {toolpath.notes && (
                              <p className={`text-[var(--neutral-500)] italic ${isMobile ? 'text-xs' : 'text-[11px]'}`}>
                                {toolpath.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Manufacturability Assessment */}
                {(() => {
                  const obj = getObjectGeometry(selectedObject)
                  const assessment = assessManufacturability({
                    parameters: params,
                    process: selectedProcess
                  })
                  
                  const getScoreColor = (score: number) => {
                    if (score >= 80) return "text-green-600"
                    if (score >= 60) return "text-yellow-600"
                    return "text-red-600"
                  }
                  
                  return (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-[var(--neutral-400)]">
                        Manufacturability
                      </h4>
                      <div className={`rounded-lg border border-[var(--neutral-200)] ${isMobile ? 'p-4' : 'p-3'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-[var(--neutral-600)]">Score</span>
                          <span className={`text-2xl font-bold ${getScoreColor(assessment.score)}`}>
                            {assessment.score}%
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="text-xs text-[var(--neutral-500)]">
                            {assessment.passedChecks} of {assessment.totalChecks} checks passed
                          </div>
                          {assessment.issues.length > 0 && (
                            <div className="space-y-2 mt-3 pt-3 border-t border-[var(--neutral-200)]">
                              {assessment.issues.slice(0, 3).map((issue, idx) => (
                                <div key={idx} className="text-xs">
                                  <div className="flex items-start gap-2">
                                    <Icon 
                                      name={issue.severity === "error" ? "alert-circle" : "alert-triangle"} 
                                      className={`w-3 h-3 mt-0.5 flex-shrink-0 ${
                                        issue.severity === "error" ? "text-red-500" : 
                                        issue.severity === "warning" ? "text-yellow-500" : "text-blue-500"
                                      }`}
                                    />
                                    <div>
                                      <p className="text-[var(--neutral-700)] font-medium">{issue.message}</p>
                                      <p className="text-[var(--neutral-500)] mt-0.5">{issue.fix}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Quote Estimation */}
                {(() => {
                  const obj = getObjectGeometry(selectedObject)
                  const material = MATERIALS.find(m => m.id === (obj?.material || 'aluminum-6061'))
                  const quote = estimateQuote({
                    quantity,
                    material: material?.name,
                    process: selectedProcess,
                    geometryParams: params,
                    featureCount: 0
                  })
                  
                  return (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-[var(--neutral-400)]">
                        Quote Estimate
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <Label className={`text-[var(--neutral-500)] ${isMobile ? 'text-sm mb-2 block' : 'text-xs'}`}>
                            Quantity
                          </Label>
                          <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className={mobileInputClass}
                            min={1}
                          />
                        </div>
                        <div className={`rounded-lg border border-[var(--neutral-200)] bg-[var(--neutral-50)] ${isMobile ? 'p-4' : 'p-3'} space-y-2`}>
                          <div className="flex justify-between text-sm">
                            <span className="text-[var(--neutral-600)]">Unit Price:</span>
                            <span className="font-medium">{quote.unitPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-[var(--neutral-600)]">Subtotal:</span>
                            <span className="font-medium">{quote.subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-[var(--neutral-600)]">Platform Fee:</span>
                            <span className="font-medium">{quote.platformFee.toFixed(2)}</span>
                          </div>
                          <div className="pt-2 border-t border-[var(--neutral-200)] flex justify-between">
                            <span className="font-semibold text-[var(--neutral-900)]">Total:</span>
                            <span className="font-bold text-lg text-[var(--primary-700)]">{quote.totalPrice.toFixed(2)}</span>
                          </div>
                          <div className="text-xs text-[var(--neutral-500)] pt-2">
                            Lead time: {quote.leadTimeDays} days
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </>
            ) : (
              <p className="text-base text-[var(--neutral-500)]">Select an object to configure toolpath and get a quote</p>
            )}
          </div>
        )}
      </div>

      {/* Material Library Modal */}
      <MaterialLibrary
        isOpen={showMaterialLibrary}
        onClose={() => setShowMaterialLibrary(false)}
        onSelect={handleMaterialSelect}
        currentMaterial={selectedObject ? getObjectGeometry(selectedObject)?.material : undefined}
      />
    </div>
  )
}
