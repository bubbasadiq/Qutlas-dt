"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useWorkspace } from "@/hooks/use-workspace"
import { useIsMobile } from "@/hooks/use-media-query"
import { KernelBridge, type SemanticIR, type ValidationResult, type IRGraphStats, type ManufacturingAnalysis } from "@/lib/geometry/kernel-bridge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Icon } from "@/components/ui/icon"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface SemanticIRPanelProps {
  className?: string
}

export function SemanticIRPanel({ className }: SemanticIRPanelProps) {
  const isMobile = useIsMobile()
  const { selectedObjectId, getObjectGeometry, objects } = useWorkspace()

  // State management
  const [kernelBridge] = useState(() => new KernelBridge())
  const [isKernelReady, setIsKernelReady] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [graphStats, setGraphStats] = useState<IRGraphStats | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [manufacturingAnalysis, setManufacturingAnalysis] = useState<ManufacturingAnalysis | null>(null)
  const [nodeExpanded, setNodeExpanded] = useState<Record<string, boolean>>({})

  // Initialize kernel on component mount
  useEffect(() => {
    initializeKernel()
  }, [])

  const initializeKernel = useCallback(async () => {
    if (isInitializing) return

    setIsInitializing(true)
    try {
      await kernelBridge.initialize()
      setIsKernelReady(kernelBridge.isKernelReady())

      if (kernelBridge.isKernelReady()) {
        toast.success("Enhanced Geometry Kernel initialized")
        await refreshGraphStats()
      } else {
        toast.warning("Kernel running in fallback mode")
      }
    } catch (error) {
      console.error('Failed to initialize kernel:', error)
      toast.error("Failed to initialize geometry kernel")
    } finally {
      setIsInitializing(false)
    }
  }, [isInitializing, kernelBridge])

  const refreshGraphStats = useCallback(async () => {
    if (!isKernelReady) return

    try {
      const stats = await kernelBridge.getIRGraphStats()
      setGraphStats(stats)
    } catch (error) {
      console.error('Failed to get graph stats:', error)
    }
  }, [isKernelReady, kernelBridge])

  // Generate semantic IR from current workspace
  const generateSemanticIR = useCallback((): SemanticIR => {
    const nodes = Object.entries(objects).map(([id, obj]) => ({
      id,
      node_type: 'primitive' as const,
      content: {
        type: obj.type || 'box',
        data: {
          primitive_type: obj.type || 'box',
          parameters: obj.dimensions || {},
          transform: obj.transform || null,
          material: obj.material || 'aluminum',
          manufacturing_constraints: obj.features?.map(f => ({
            type: f.type,
            parameters: f.parameters || {}
          })) || []
        }
      },
      dependencies: [],
      metadata: {
        name: `Object ${id}`,
        created_at: new Date().toISOString()
      }
    }))

    return {
      nodes,
      metadata: {
        version: '1.0',
        created_at: new Date().toISOString(),
        created_by: 'qutlas-studio'
      }
    }
  }, [objects])

  // Validate current semantic IR
  const validateSemanticIR = useCallback(async () => {
    if (!isKernelReady) {
      toast.error("Kernel not ready")
      return
    }

    setIsValidating(true)
    try {
      const semanticIR = generateSemanticIR()
      const result = await kernelBridge.validateSemanticIR(semanticIR)
      setValidationResult(result)
      setManufacturingAnalysis(result.manufacturing_analysis)

      if (result.valid) {
        toast.success("Validation passed")
      } else {
        toast.warning(`Validation failed with ${result.errors.length} errors`)
      }

      await refreshGraphStats()
    } catch (error) {
      console.error('Validation failed:', error)
      toast.error("Validation failed")
    } finally {
      setIsValidating(false)
    }
  }, [isKernelReady, generateSemanticIR, kernelBridge, refreshGraphStats])

  // Analyze manufacturing constraints
  const analyzeManufacturing = useCallback(async () => {
    if (!isKernelReady) {
      toast.error("Kernel not ready")
      return
    }

    setIsAnalyzing(true)
    try {
      const semanticIR = generateSemanticIR()
      const result = await kernelBridge.compileSemanticIR(semanticIR)

      if (result.manufacturing_analysis) {
        setManufacturingAnalysis(result.manufacturing_analysis)
        toast.success("Manufacturing analysis completed")
      } else {
        toast.warning("No manufacturing analysis available")
      }
    } catch (error) {
      console.error('Manufacturing analysis failed:', error)
      toast.error("Manufacturing analysis failed")
    } finally {
      setIsAnalyzing(false)
    }
  }, [isKernelReady, generateSemanticIR, kernelBridge])

  // Get status color for various metrics
  const getStatusColor = useCallback((score: number, thresholds = { good: 80, fair: 60 }) => {
    if (score >= thresholds.good) return 'text-green-600'
    if (score >= thresholds.fair) return 'text-yellow-600'
    return 'text-red-600'
  }, [])

  const getStatusBg = useCallback((score: number, thresholds = { good: 80, fair: 60 }) => {
    if (score >= thresholds.good) return 'bg-green-50 border-green-200'
    if (score >= thresholds.fair) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  }, [])

  // Toggle node expansion
  const toggleNode = useCallback((nodeId: string) => {
    setNodeExpanded(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }))
  }, [])

  // Memoized semantic IR
  const semanticIR = useMemo(() => generateSemanticIR(), [generateSemanticIR])

  if (!isKernelReady && !isInitializing) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <Icon name="cpu" className="w-16 h-16 mx-auto text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-700">Semantic IR System</h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Enhanced geometry kernel with manufacturing-aware constraints and deterministic operations.
            </p>
            <Button onClick={initializeKernel} variant="outline">
              <Icon name="play" className="w-4 h-4 mr-2" />
              Initialize Kernel
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (isInitializing) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <Icon name="loader" className="w-8 h-8 mx-auto animate-spin text-blue-500" />
            <p className="text-sm text-gray-600">Initializing Enhanced Geometry Kernel...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full bg-white", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Icon name="cpu" className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-800">Semantic IR</h2>
          </div>
          <Badge variant={isKernelReady ? "success" : "secondary"} className="text-xs">
            {isKernelReady ? "Enhanced" : "Fallback"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={validateSemanticIR}
            disabled={isValidating}
          >
            {isValidating ? (
              <Icon name="loader" className="w-4 h-4 animate-spin" />
            ) : (
              <Icon name="check-circle" className="w-4 h-4" />
            )}
            {!isMobile && <span className="ml-1">Validate</span>}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={analyzeManufacturing}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <Icon name="loader" className="w-4 h-4 animate-spin" />
            ) : (
              <Icon name="wrench" className="w-4 h-4" />
            )}
            {!isMobile && <span className="ml-1">Analyze</span>}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4 m-2">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="nodes" className="text-xs">Nodes</TabsTrigger>
            <TabsTrigger value="validation" className="text-xs">Validation</TabsTrigger>
            <TabsTrigger value="manufacturing" className="text-xs">Manufacturing</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            {/* Overview Tab */}
            <TabsContent value="overview" className="h-full m-0 p-4 space-y-4 overflow-y-auto">
              {/* Graph Statistics */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Icon name="git-branch" className="w-4 h-4" />
                    IR Graph Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {graphStats ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Nodes</p>
                        <p className="font-semibold">{graphStats.node_count}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Dependencies</p>
                        <p className="font-semibold">{graphStats.edge_count}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Max Depth</p>
                        <p className="font-semibold">{graphStats.max_depth}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Avg Dependencies</p>
                        <p className="font-semibold">{graphStats.avg_dependencies.toFixed(1)}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No graph statistics available</p>
                  )}
                </CardContent>
              </Card>

              {/* System Status */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Icon name="activity" className="w-4 h-4" />
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Kernel Status</span>
                    <Badge variant={isKernelReady ? "success" : "secondary"}>
                      {isKernelReady ? "Ready" : "Fallback"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Objects</span>
                    <span className="font-medium">{Object.keys(objects).length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Selected</span>
                    <span className="font-medium">{selectedObjectId || "None"}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Nodes Tab */}
            <TabsContent value="nodes" className="h-full m-0 p-4 overflow-y-auto">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">IR Nodes ({semanticIR.nodes.length})</h3>
                  <Button size="sm" variant="outline" onClick={refreshGraphStats}>
                    <Icon name="refresh-cw" className="w-3 h-3" />
                  </Button>
                </div>

                {semanticIR.nodes.map((node, index) => (
                  <Card key={node.id || index}>
                    <Collapsible
                      open={nodeExpanded[node.id || index.toString()]}
                      onOpenChange={() => toggleNode(node.id || index.toString())}
                    >
                      <CollapsibleTrigger asChild>
                        <CardHeader className="pb-2 cursor-pointer hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon name="box" className="w-4 h-4 text-blue-600" />
                              <span className="font-medium text-sm">
                                {node.metadata?.name || node.id || `Node ${index}`}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {node.node_type}
                              </Badge>
                            </div>
                            <Icon
                              name={nodeExpanded[node.id || index.toString()] ? "chevron-up" : "chevron-down"}
                              className="w-4 h-4"
                            />
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 space-y-2">
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Type:</span>
                              <span className="font-mono">{node.content.type}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Dependencies:</span>
                              <span className="font-mono">{node.dependencies?.length || 0}</span>
                            </div>
                            {node.metadata?.created_at && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Created:</span>
                                <span className="font-mono">
                                  {new Date(node.metadata.created_at).toLocaleTimeString()}
                                </span>
                              </div>
                            )}
                          </div>

                          {node.content.data && (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                                Node Data
                              </summary>
                              <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                                {JSON.stringify(node.content.data, null, 2)}
                              </pre>
                            </details>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Validation Tab */}
            <TabsContent value="validation" className="h-full m-0 p-4 overflow-y-auto">
              <div className="space-y-4">
                {validationResult ? (
                  <>
                    {/* Validation Status */}
                    <Card className={getStatusBg(validationResult.valid ? 100 : 0)}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Icon
                            name={validationResult.valid ? "check-circle" : "x-circle"}
                            className={cn("w-5 h-5", validationResult.valid ? "text-green-600" : "text-red-600")}
                          />
                          <div>
                            <p className="font-semibold">
                              {validationResult.valid ? "Validation Passed" : "Validation Failed"}
                            </p>
                            <p className="text-sm text-gray-600">{validationResult.summary}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Errors */}
                    {validationResult.errors.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm text-red-600 flex items-center gap-2">
                            <Icon name="alert-circle" className="w-4 h-4" />
                            Errors ({validationResult.errors.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {validationResult.errors.map((error, index) => (
                            <div key={index} className="p-3 bg-red-50 border border-red-200 rounded">
                              <p className="text-sm font-medium text-red-800">{error.message}</p>
                              <p className="text-xs text-red-600 mt-1">Code: {error.code}</p>
                              {error.node_id && (
                                <p className="text-xs text-red-600">Node: {error.node_id}</p>
                              )}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Warnings */}
                    {validationResult.warnings.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm text-yellow-600 flex items-center gap-2">
                            <Icon name="alert-triangle" className="w-4 h-4" />
                            Warnings ({validationResult.warnings.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {validationResult.warnings.map((warning, index) => (
                            <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                              <p className="text-sm font-medium text-yellow-800">{warning.message}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {warning.severity}
                                </Badge>
                                {warning.node_id && (
                                  <span className="text-xs text-yellow-600">Node: {warning.node_id}</span>
                                )}
                              </div>
                              {warning.suggestion && (
                                <p className="text-xs text-yellow-700 mt-1">{warning.suggestion}</p>
                              )}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Icon name="check-square" className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-gray-600">Click "Validate" to check IR structure</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Manufacturing Tab */}
            <TabsContent value="manufacturing" className="h-full m-0 p-4 overflow-y-auto">
              <div className="space-y-4">
                {manufacturingAnalysis ? (
                  <>
                    {/* Manufacturability Score */}
                    <Card className={getStatusBg(manufacturingAnalysis.manufacturability_score)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">Manufacturability Score</h3>
                          <span className={cn("text-2xl font-bold", getStatusColor(manufacturingAnalysis.manufacturability_score))}>
                            {manufacturingAnalysis.manufacturability_score.toFixed(0)}
                          </span>
                        </div>
                        <Progress value={manufacturingAnalysis.manufacturability_score} className="mb-2" />
                        <p className="text-xs text-gray-600">
                          Complexity Score: {manufacturingAnalysis.complexity_score.toFixed(1)}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Compatible Processes */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Icon name="settings" className="w-4 h-4" />
                          Compatible Processes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {manufacturingAnalysis.compatible_processes.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {manufacturingAnalysis.compatible_processes.map((process) => (
                              <Badge key={process} variant="success">
                                {process.replace(/([A-Z])/g, ' $1').trim()}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No compatible processes found</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Constraint Violations */}
                    {manufacturingAnalysis.constraint_violations.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm text-red-600 flex items-center gap-2">
                            <Icon name="alert-octagon" className="w-4 h-4" />
                            Constraint Violations ({manufacturingAnalysis.constraint_violations.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {manufacturingAnalysis.constraint_violations.map((violation, index) => (
                            <div key={index} className="p-3 bg-red-50 border border-red-200 rounded">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-red-800">{violation.description}</p>
                                  <p className="text-xs text-red-600 mt-1">
                                    Node: {violation.node_id} | Type: {violation.constraint_type}
                                  </p>
                                </div>
                                <Badge variant={violation.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">
                                  {violation.severity}
                                </Badge>
                              </div>
                              {violation.affected_processes.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-red-700">Affects:</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {violation.affected_processes.map((process) => (
                                      <Badge key={process} variant="outline" className="text-xs">
                                        {process}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Tool Access Issues */}
                    {manufacturingAnalysis.tool_access_issues.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm text-orange-600 flex items-center gap-2">
                            <Icon name="wrench" className="w-4 h-4" />
                            Tool Access Issues ({manufacturingAnalysis.tool_access_issues.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {manufacturingAnalysis.tool_access_issues.map((issue, index) => (
                            <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded">
                              <p className="text-sm font-medium text-orange-800">{issue.description}</p>
                              <p className="text-xs text-orange-600 mt-1">
                                Node: {issue.node_id} | Type: {issue.issue_type}
                              </p>
                              {issue.solutions.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-orange-700 font-medium">Solutions:</p>
                                  <ul className="text-xs text-orange-600 mt-1 space-y-1">
                                    {issue.solutions.map((solution, sIndex) => (
                                      <li key={sIndex}>• {solution}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Icon name="wrench" className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-gray-600">Click "Analyze" to check manufacturing constraints</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
