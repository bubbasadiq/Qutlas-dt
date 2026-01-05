"use client"

import React, { useState, useCallback, useMemo } from "react"
import { useWorkspace } from "@/hooks/use-workspace"
import { useIsMobile } from "@/hooks/use-media-query"
import { EnhancedGeometryFactory } from "@/lib/geometry/enhanced-geometry-factory"
import { EnhancedWorkspaceObject } from "@/lib/geometry/semantic-ir-generator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Icon } from "@/components/ui/icon"
import { toast } from "sonner"
import {
  Settings,
  Zap,
  AlertTriangle,
  CheckCircle,
  Info,
  Wrench,
  Factory,
  DollarSign,
  Clock,
  Gauge,
  Target,
  ShieldAlert,
  TrendingUp,
  Plus,
  Trash2
} from "lucide-react"

interface AdvancedFeaturesPanelProps {
  className?: string
}

export function AdvancedFeaturesPanel({ className }: AdvancedFeaturesPanelProps) {
  const isMobile = useIsMobile()
  const { selectedObjectId, objects, updateObject } = useWorkspace()
  const [activeTab, setActiveTab] = useState('features')
  const [isAddingFeature, setIsAddingFeature] = useState(false)

  // Get the selected object as enhanced object
  const selectedObject = useMemo(() => {
    if (!selectedObjectId || !objects[selectedObjectId]) return null
    return objects[selectedObjectId] as EnhancedWorkspaceObject
  }, [selectedObjectId, objects])

  // Calculate manufacturing analysis
  const manufacturingAnalysis = useMemo(() => {
    if (!selectedObject) return null
    return EnhancedGeometryFactory.estimateComplexity(selectedObject)
  }, [selectedObject])

  // Validate manufacturability
  const manufacturabilityCheck = useMemo(() => {
    if (!selectedObject) return null
    return EnhancedGeometryFactory.validateManufacturability(selectedObject, 'cnc_milling')
  }, [selectedObject])

  // Add manufacturing feature to selected object
  const addFeature = useCallback(async (featureType: string) => {
    if (!selectedObject || !selectedObjectId) return

    try {
      setIsAddingFeature(true)

      // Clone the object to avoid mutations
      const updatedObject = { ...selectedObject }

      // Add the feature using the factory
      const newFeature = EnhancedGeometryFactory.addFeature(
        updatedObject,
        featureType,
        undefined, // Use default parameters
        undefined  // Use default location
      )

      // Update the workspace object
      updateObject(selectedObjectId, updatedObject)

      toast.success(`Added ${featureType} feature to ${selectedObject.type}`)
    } catch (error) {
      toast.error(`Failed to add feature: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsAddingFeature(false)
    }
  }, [selectedObject, selectedObjectId, updateObject])

  // Remove feature from object
  const removeFeature = useCallback((featureId: string) => {
    if (!selectedObject || !selectedObjectId) return

    const updatedObject = { ...selectedObject }
    if (updatedObject.features) {
      updatedObject.features = updatedObject.features.filter(f => f.id !== featureId)
    }

    updateObject(selectedObjectId, updatedObject)
    toast.success('Feature removed')
  }, [selectedObject, selectedObjectId, updateObject])

  if (!selectedObject) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings size={20} />
            Advanced Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Settings size={48} className="mx-auto mb-4 opacity-50" />
            <p>Select an object to view advanced manufacturing features</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getComplexityColor = (score: number) => {
    if (score < 3) return "text-green-600"
    if (score < 6) return "text-yellow-600"
    return "text-red-600"
  }

  const getComplexityBadge = (score: number) => {
    if (score < 3) return <Badge variant="secondary" className="bg-green-100 text-green-800">Simple</Badge>
    if (score < 6) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Moderate</Badge>
    return <Badge variant="secondary" className="bg-red-100 text-red-800">Complex</Badge>
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap size={20} />
          Advanced Features
          <Badge variant="outline" className="ml-auto">
            {selectedObject.type?.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mx-6 mt-2">
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="manufacturing">Manufacturing</TabsTrigger>
            <TabsTrigger value="material">Material</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          <div className="p-6">
            <TabsContent value="features" className="space-y-4 mt-0">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Manufacturing Features</h3>
                <Badge variant="outline">
                  {selectedObject.features?.length || 0} Features
                </Badge>
              </div>

              {selectedObject.features && selectedObject.features.length > 0 ? (
                <div className="space-y-3">
                  {selectedObject.features.map((feature) => (
                    <div key={feature.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Wrench size={14} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium capitalize">{feature.type}</p>
                            <p className="text-xs text-muted-foreground">
                              {feature.toolAccess} access
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFeature(feature.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(feature.parameters).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground capitalize">
                              {key.replace('_', ' ')}:
                            </span>
                            <span className="font-medium">{value}mm</span>
                          </div>
                        ))}
                      </div>

                      {feature.manufacturingProcess && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {feature.manufacturingProcess.map((process) => (
                            <Badge key={process} variant="outline" className="text-xs">
                              {process.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-6">
                  <Plus size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No manufacturing features added</p>
                  <p className="text-xs">Add features to enhance functionality</p>
                </div>
              )}

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Add Manufacturing Features</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addFeature('through_hole')}
                    disabled={isAddingFeature}
                    className="flex items-center gap-2"
                  >
                    <div className="w-4 h-4 rounded-full border-2 border-current" />
                    Through Hole
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addFeature('counterbore')}
                    disabled={isAddingFeature}
                    className="flex items-center gap-2"
                  >
                    <div className="w-4 h-4 rounded border border-current" />
                    Counterbore
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addFeature('edge_fillet')}
                    disabled={isAddingFeature}
                    className="flex items-center gap-2"
                  >
                    <div className="w-4 h-4 rounded-full bg-current opacity-20" />
                    Fillet
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addFeature('chamfer_45')}
                    disabled={isAddingFeature}
                    className="flex items-center gap-2"
                  >
                    <div className="w-4 h-4 border-l-2 border-b-2 border-current" />
                    Chamfer
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="manufacturing" className="space-y-4 mt-0">
              <div className="flex items-center gap-2 mb-4">
                <Factory size={20} />
                <h3 className="font-medium">Manufacturing Analysis</h3>
              </div>

              {manufacturingAnalysis && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className={`text-2xl font-bold ${getComplexityColor(manufacturingAnalysis.complexity_score)}`}>
                        {manufacturingAnalysis.complexity_score.toFixed(1)}
                      </div>
                      <p className="text-xs text-muted-foreground">Complexity Score</p>
                      {getComplexityBadge(manufacturingAnalysis.complexity_score)}
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {manufacturingAnalysis.cost_multiplier.toFixed(2)}x
                      </div>
                      <p className="text-xs text-muted-foreground">Cost Multiplier</p>
                      <Badge variant="secondary">Estimated</Badge>
                    </div>
                  </div>

                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={16} />
                      <span className="font-medium">Manufacturing Time</span>
                    </div>
                    <Progress value={manufacturingAnalysis.manufacturing_time * 20} className="mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {manufacturingAnalysis.manufacturing_time.toFixed(1)}x base time
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Target size={16} />
                      Recommended Processes
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {manufacturingAnalysis.recommended_processes.map((process) => (
                        <Badge key={process} variant="default" className="capitalize">
                          {process.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {manufacturabilityCheck && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <ShieldAlert size={16} />
                      Manufacturability Check
                    </h4>

                    <div className={`p-3 rounded-lg border ${
                      manufacturabilityCheck.isValid
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {manufacturabilityCheck.isValid ? (
                          <CheckCircle size={16} className="text-green-600" />
                        ) : (
                          <AlertTriangle size={16} className="text-red-600" />
                        )}
                        <span className="font-medium">
                          {manufacturabilityCheck.isValid ? 'Manufacturable' : 'Issues Detected'}
                        </span>
                      </div>

                      {manufacturabilityCheck.errors.length > 0 && (
                        <div className="mb-2">
                          <p className="text-sm font-medium text-red-700 mb-1">Errors:</p>
                          {manufacturabilityCheck.errors.map((error, index) => (
                            <p key={index} className="text-xs text-red-600">• {error}</p>
                          ))}
                        </div>
                      )}

                      {manufacturabilityCheck.warnings.length > 0 && (
                        <div className="mb-2">
                          <p className="text-sm font-medium text-yellow-700 mb-1">Warnings:</p>
                          {manufacturabilityCheck.warnings.map((warning, index) => (
                            <p key={index} className="text-xs text-yellow-600">• {warning}</p>
                          ))}
                        </div>
                      )}

                      {manufacturabilityCheck.suggestions.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-blue-700 mb-1">Suggestions:</p>
                          {manufacturabilityCheck.suggestions.map((suggestion, index) => (
                            <p key={index} className="text-xs text-blue-600">• {suggestion}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="material" className="space-y-4 mt-0">
              <div className="flex items-center gap-2 mb-4">
                <Gauge size={20} />
                <h3 className="font-medium">Material Properties</h3>
              </div>

              {selectedObject.material && (
                <div className="space-y-4">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-medium mb-2">{selectedObject.material.name}</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Density:</span>
                        <span>{selectedObject.material.density} g/cm³</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tensile Strength:</span>
                        <span>{selectedObject.material.tensile_strength} MPa</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Yield Strength:</span>
                        <span>{selectedObject.material.yield_strength} MPa</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Elastic Modulus:</span>
                        <span>{selectedObject.material.elastic_modulus} GPa</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Manufacturing Ratings</h4>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>CNC Milling</span>
                          <span>{selectedObject.material.manufacturability.cnc_rating}/10</span>
                        </div>
                        <Progress value={selectedObject.material.manufacturability.cnc_rating * 10} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>3D Printing</span>
                          <span>{selectedObject.material.manufacturability.printing_rating}/10</span>
                        </div>
                        <Progress value={selectedObject.material.manufacturability.printing_rating * 10} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Injection Molding</span>
                          <span>{selectedObject.material.manufacturability.molding_rating}/10</span>
                        </div>
                        <Progress value={selectedObject.material.manufacturability.molding_rating * 10} />
                      </div>
                    </div>
                  </div>

                  {selectedObject.material.cost_per_kg && (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2">
                        <DollarSign size={16} className="text-green-600" />
                        <span className="font-medium">Material Cost</span>
                      </div>
                      <span className="font-bold text-green-700">
                        ${selectedObject.material.cost_per_kg.toFixed(2)}/kg
                      </span>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4 mt-0">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={20} />
                <h3 className="font-medium">Geometric Analysis</h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="text-lg font-bold">
                      {selectedObject.dimensions ? Object.keys(selectedObject.dimensions).length : 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Parameters</p>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="text-lg font-bold">
                      {selectedObject.manufacturingConstraints?.length || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Constraints</p>
                  </div>
                </div>

                {selectedObject.dimensions && (
                  <div>
                    <h4 className="font-medium mb-2">Dimensions</h4>
                    <div className="space-y-2">
                      {Object.entries(selectedObject.dimensions).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm p-2 bg-muted/30 rounded">
                          <span className="capitalize text-muted-foreground">
                            {key.replace(/([A-Z])/g, ' $1')}:
                          </span>
                          <span className="font-medium">{value} mm</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedObject.tolerances && selectedObject.tolerances.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Tolerances</h4>
                    <div className="space-y-2">
                      {selectedObject.tolerances.map((tolerance, index) => (
                        <div key={index} className="p-2 bg-muted/30 rounded">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{tolerance.type}</span>
                            <span className="font-medium">
                              ±{tolerance.value} {tolerance.unit}
                            </span>
                          </div>
                          {tolerance.grade && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Grade: {tolerance.grade}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedObject.surfaceFinish && (
                  <div>
                    <h4 className="font-medium mb-2">Surface Finish</h4>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Roughness (Ra):</span>
                        <span className="font-medium">{selectedObject.surfaceFinish.roughness} μm</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Process:</span>
                        <span className="font-medium capitalize">{selectedObject.surfaceFinish.process}</span>
                      </div>
                      {selectedObject.surfaceFinish.requirements && (
                        <div className="flex flex-wrap gap-1">
                          {selectedObject.surfaceFinish.requirements.map((req, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {req}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
