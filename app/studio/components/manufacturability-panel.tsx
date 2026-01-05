// app/studio/components/manufacturability-panel.tsx
// Enhanced manufacturability analysis panel with semantic IR integration

"use client"

import type React from "react"
import { useMemo, useState, useEffect, useCallback } from "react"
import { assessManufacturability, simplifyResult, getScoreColorClass, getScoreBgColorClass, type ManufacturabilityIssue, type Severity } from "@/lib/manufacturability/assess"
import { useWorkspace } from "@/hooks/use-workspace"
import { useIsMobile } from "@/hooks/use-media-query"
import { KernelBridge, type SemanticIR, type ManufacturingAnalysis, type ValidationResult } from "@/lib/geometry/kernel-bridge"
import { Icon } from "@/components/ui/icon"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function ManufacturabilityPanel() {
  const isMobile = useIsMobile()
  const { getObjectGeometry, selectedObjectId, objects } = useWorkspace()

  // Enhanced state for semantic IR integration
  const [kernelBridge] = useState(() => new KernelBridge())
  const [isKernelReady, setIsKernelReady] = useState(false)
  const [activeMode, setActiveMode] = useState<'legacy' | 'semantic'>('legacy')
  const [semanticAnalysis, setSemanticAnalysis] = useState<ManufacturingAnalysis | null>(null)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedProcess, setSelectedProcess] = useState('cnc-milling')

  // Initialize kernel
  useEffect(() => {
    const initKernel = async () => {
      try {
        await kernelBridge.initialize()
        setIsKernelReady(kernelBridge.isKernelReady())
        if (kernelBridge.isKernelReady()) {
          setActiveMode('semantic')
        }
      } catch (error) {
        console.warn('Kernel initialization failed, using legacy mode:', error)
      }
    }
    initKernel()
  }, [kernelBridge])

  // Legacy analysis (preserved)
  const legacyAnalysis = useMemo(() => {
    if (!selectedObjectId) return null

    const obj = getObjectGeometry(selectedObjectId)
    if (!obj) return null

    return assessManufacturability({
      dimensions: obj.dimensions,
      features: obj.features || [],
      material: obj.material || 'aluminum-6061',
      process: selectedProcess,
    })
  }, [selectedObjectId, getObjectGeometry, selectedProcess])

  const simplified = useMemo(() => {
    const analysis = activeMode === 'semantic' ? null : legacyAnalysis
    if (!analysis) return null
    return simplifyResult(analysis)
  }, [legacyAnalysis, activeMode])

  // Generate semantic IR from workspace
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

  // Perform semantic analysis
  const performSemanticAnalysis = useCallback(async () => {
    if (!isKernelReady || !selectedObjectId) return

    setIsAnalyzing(true)
    try {
      const semanticIR = generateSemanticIR()

      // First validate the IR
      const validation = await kernelBridge.validateSemanticIR(semanticIR)
      setValidationResult(validation)

      // Then compile and get manufacturing analysis
      const result = await kernelBridge.compileSemanticIR(semanticIR)

      if (result.manufacturing_analysis) {
        setSemanticAnalysis(result.manufacturing_analysis)
        toast.success("Enhanced manufacturing analysis completed")
      } else {
        toast.warning("No manufacturing analysis available")
      }
    } catch (error) {
      console.error('Semantic analysis failed:', error)
      toast.error("Enhanced analysis failed, using legacy mode")
      setActiveMode('legacy')
    } finally {
      setIsAnalyzing(false)
    }
  }, [isKernelReady, selectedObjectId, generateSemanticIR, kernelBridge])

  // Auto-analyze when selection changes in semantic mode
  useEffect(() => {
    if (activeMode === 'semantic' && selectedObjectId && isKernelReady) {
      performSemanticAnalysis()
    }
  }, [activeMode, selectedObjectId, isKernelReady, performSemanticAnalysis])

  // Get current analysis data
  const currentAnalysis = activeMode === 'semantic' ? semanticAnalysis : legacyAnalysis
  const currentScore = activeMode === 'semantic'
    ? semanticAnalysis?.manufacturability_score || 0
    : legacyAnalysis?.score || 0

  if (!selectedObjectId) {
    return (
      <div className="p-4 text-center text-[var(--neutral-500)]">
        <Icon name="info" className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Select an object to analyze manufacturability</p>
        {isKernelReady && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Icon name="cpu" className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Enhanced Kernel Ready</span>
            </div>
            <p className="text-xs text-blue-700">
              Semantic IR system with manufacturing-aware constraints available
            </p>
          </div>
        )}
      </div>
    )
  }

  if (!currentAnalysis && !isAnalyzing) {
    return (
      <div className="p-4 text-center text-[var(--neutral-500)]">
        <p>Unable to analyze selected object</p>
        {isKernelReady && (
          <Button onClick={performSemanticAnalysis} className="mt-2" size="sm">
            <Icon name="cpu" className="w-4 h-4 mr-2" />
            Run Enhanced Analysis
          </Button>
        )}
      </div>
    )
  }

  const getSeverityIcon = (severity: Severity) => {
    switch (severity) {
      case 'critical':
        return { name: 'alert-octagon', color: 'text-red-600' }
      case 'error':
        return { name: 'alert-circle', color: 'text-red-500' }
      case 'warning':
        return { name: 'alert-triangle', color: 'text-yellow-500' }
      case 'info':
        return { name: 'info', color: 'text-blue-500' }
      default:
        return { name: 'info', color: 'text-gray-500' }
    }
  }

  const getSeverityBg = (severity: Severity) => {
    switch (severity) {
      case 'critical':
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getStatusColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getStatusBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200'
    if (score >= 60) return 'bg-yellow-50 border-yellow-200'
    if (score >= 40) return 'bg-orange-50 border-orange-200'
    return 'bg-red-50 border-red-200'
  }

  return (
    <div className={cn("flex flex-col h-full", isMobile ? '' : '')}>
      {/* Enhanced Header with Mode Switcher */}
      <div className="p-3 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-800">Manufacturability</h2>
            {isKernelReady && (
              <Badge variant="default" className="text-xs">Enhanced</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isKernelReady && (
              <div className="flex rounded-md border border-gray-200 p-1">
                <button
                  onClick={() => setActiveMode('legacy')}
                  className={cn(
                    "px-2 py-1 text-xs rounded transition-colors",
                    activeMode === 'legacy'
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  )}
                >
                  Legacy
                </button>
                <button
                  onClick={() => setActiveMode('semantic')}
                  className={cn(
                    "px-2 py-1 text-xs rounded transition-colors",
                    activeMode === 'semantic'
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  )}
                >
                  Enhanced
                </button>
              </div>
            )}
            {activeMode === 'semantic' && (
              <Button
                size="sm"
                variant="outline"
                onClick={performSemanticAnalysis}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <Icon name="loader" className="w-3 h-3 animate-spin" />
                ) : (
                  <Icon name="refresh-cw" className="w-3 h-3" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {activeMode === 'semantic' ? (
        // Enhanced Semantic Analysis View
        <div className="flex-1 overflow-y-auto">
          {isAnalyzing ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <Icon name="loader" className="w-6 h-6 mx-auto animate-spin text-blue-500 mb-2" />
                <p className="text-sm text-gray-600">Running enhanced analysis...</p>
              </div>
            </div>
          ) : semanticAnalysis ? (
            <Tabs defaultValue="score" className="h-full">
              <TabsList className="grid w-full grid-cols-3 m-2">
                <TabsTrigger value="score" className="text-xs">Score</TabsTrigger>
                <TabsTrigger value="constraints" className="text-xs">Constraints</TabsTrigger>
                <TabsTrigger value="processes" className="text-xs">Processes</TabsTrigger>
              </TabsList>

              <div className="px-3">
                <TabsContent value="score" className="mt-0 space-y-4">
                  {/* Enhanced Score Display */}
                  <Card className={getStatusBg(semanticAnalysis.manufacturability_score)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-800">Manufacturability Score</h3>
                        <span className={cn("text-3xl font-bold", getStatusColor(semanticAnalysis.manufacturability_score))}>
                          {semanticAnalysis.manufacturability_score.toFixed(0)}
                        </span>
                      </div>
                      <Progress value={semanticAnalysis.manufacturability_score} className="mb-3" />
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Complexity: {semanticAnalysis.complexity_score.toFixed(1)}</span>
                        <span>
                          {semanticAnalysis.manufacturability_score >= 80 ? 'Excellent' :
                           semanticAnalysis.manufacturability_score >= 60 ? 'Good' :
                           semanticAnalysis.manufacturability_score >= 40 ? 'Fair' : 'Poor'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Validation Status */}
                  {validationResult && (
                    <Card className={validationResult.valid ? 'border-green-200' : 'border-red-200'}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <Icon
                            name={validationResult.valid ? "check-circle" : "x-circle"}
                            className={cn("w-4 h-4", validationResult.valid ? "text-green-600" : "text-red-600")}
                          />
                          <span className="text-sm font-medium">
                            {validationResult.valid ? "Structure Valid" : "Structure Issues"}
                          </span>
                        </div>
                        {validationResult.errors.length > 0 && (
                          <p className="text-xs text-red-600 mt-1">
                            {validationResult.errors.length} error(s) found
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="constraints" className="mt-0 space-y-3">
                  {semanticAnalysis.constraint_violations.length > 0 ? (
                    semanticAnalysis.constraint_violations.map((violation, index) => (
                      <Card key={index} className="border-red-200">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-red-800">{violation.description}</p>
                              <p className="text-xs text-red-600 mt-1">
                                {violation.constraint_type} | Node: {violation.node_id}
                              </p>
                            </div>
                            <Badge
                              variant={violation.severity === 'critical' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {violation.severity}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Icon name="check-circle" className="w-8 h-8 mx-auto mb-2 text-green-500" />
                        <p className="text-sm text-gray-600">No constraint violations</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="processes" className="mt-0 space-y-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Compatible Processes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {semanticAnalysis.compatible_processes.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {semanticAnalysis.compatible_processes.map((process) => (
                            <Badge key={process} variant="default" className="text-xs">
                              {process.replace(/([A-Z])/g, ' $1').trim()}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No compatible processes found</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Tool Access Issues */}
                  {semanticAnalysis.tool_access_issues.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-orange-600">Tool Access Issues</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {semanticAnalysis.tool_access_issues.map((issue, index) => (
                          <div key={index} className="p-2 bg-orange-50 border border-orange-200 rounded text-xs">
                            <p className="font-medium text-orange-800">{issue.description}</p>
                            <p className="text-orange-600 mt-1">Node: {issue.node_id}</p>
                            {issue.solutions.length > 0 && (
                              <div className="mt-2">
                                <p className="font-medium text-orange-700">Solutions:</p>
                                <ul className="text-orange-600 mt-1">
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
                </TabsContent>
              </div>
            </Tabs>
          ) : (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <Icon name="cpu" className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">Click refresh to run enhanced analysis</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Legacy Analysis View (preserved)
        <>
          {/* Score Header */}
          <div className={cn(
            "p-4 border-b",
            legacyAnalysis ? getScoreBgColorClass(legacyAnalysis.score) : "bg-gray-50"
          )}>
            {legacyAnalysis && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--neutral-600)]">
                    Manufacturability Score
                  </h3>
                  <span className={cn(
                    "text-3xl font-bold",
                    getScoreColorClass(legacyAnalysis.score)
                  )}>
                    {legacyAnalysis.score}
                  </span>
                </div>

                {/* Score Bar */}
                <div className="w-full bg-white/50 rounded-full h-2 mb-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all",
                      legacyAnalysis.score >= 80 ? 'bg-green-500' :
                      legacyAnalysis.score >= 60 ? 'bg-yellow-500' :
                      legacyAnalysis.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                    )}
                    style={{ width: `${legacyAnalysis.score}%` }}
                  />
                </div>

                <p className="text-xs text-[var(--neutral-600)]">
                  {simplified?.rating === 'excellent' && 'Excellent - Ready for production'}
                  {simplified?.rating === 'good' && 'Good - Minor considerations'}
                  {simplified?.rating === 'fair' && 'Fair - Some adjustments needed'}
                  {simplified?.rating === 'poor' && 'Poor - Significant issues to address'}
                  {simplified?.rating === 'critical' && 'Critical - Design changes required'}
                </p>
              </>
            )}
          </div>

          {/* Compatibility Status */}
          {legacyAnalysis && (
            <>
              <div className="p-3 border-b bg-[var(--neutral-50)]">
                <div className="flex items-center gap-2">
                  {legacyAnalysis.compatible ? (
                    <>
                      <Icon name="check-circle" className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-700 font-medium">
                        Compatible with selected process
                      </span>
                    </>
                  ) : (
                    <>
                      <Icon name="x-circle" className="w-5 h-5 text-red-600" />
                      <span className="text-sm text-red-700 font-medium">
                        Not compatible - see issues below
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Issues List */}
              <div className="flex-1 overflow-y-auto p-3">
                {legacyAnalysis.issues.length === 0 ? (
                  <div className="text-center py-8">
                    <Icon name="check-circle" className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <p className="text-[var(--neutral-600)] font-medium">No manufacturability issues</p>
                    <p className="text-sm text-[var(--neutral-400)] mt-1">
                      {legacyAnalysis.passedChecks} of {legacyAnalysis.totalChecks} checks passed
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Errors */}
                    {legacyAnalysis.issues.filter(v => v.severity === 'error' || v.severity === 'critical').length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wider flex items-center gap-1">
                          <Icon name="alert-circle" className="w-3 h-3" />
                          Errors ({legacyAnalysis.issues.filter(v => v.severity === 'error' || v.severity === 'critical').length})
                        </h4>
                        {legacyAnalysis.issues
                          .filter(v => v.severity === 'error' || v.severity === 'critical')
                          .map((issue, idx) => (
                            <IssueCard key={idx} issue={issue} getSeverityIcon={getSeverityIcon} getSeverityBg={getSeverityBg} />
                          ))}
                      </div>
                    )}

                    {/* Warnings */}
                    {legacyAnalysis.issues.filter(v => v.severity === 'warning').length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-yellow-600 uppercase tracking-wider flex items-center gap-1">
                          <Icon name="alert-triangle" className="w-3 h-3" />
                          Warnings ({legacyAnalysis.issues.filter(v => v.severity === 'warning').length})
                        </h4>
                        {legacyAnalysis.issues
                          .filter(v => v.severity === 'warning')
                          .map((issue, idx) => (
                            <IssueCard key={idx} issue={issue} getSeverityIcon={getSeverityIcon} getSeverityBg={getSeverityBg} />
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

interface IssueCardProps {
  issue: ManufacturabilityIssue
  getSeverityIcon: (severity: Severity) => { name: string; color: string }
  getSeverityBg: (severity: Severity) => string
}

function IssueCard({ issue, getSeverityIcon, getSeverityBg }: IssueCardProps) {
  const severity = getSeverityIcon(issue.severity)
  const bgClass = getSeverityBg(issue.severity)

  return (
    <div className={cn(
      "p-3 rounded-lg border text-sm",
      bgClass
    )}>
      <div className="flex items-start gap-2">
        <Icon name={severity.name} className={cn("w-4 h-4 mt-0.5 flex-shrink-0", severity.color)} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[var(--neutral-800)]">{issue.message}</p>
          {issue.fix && (
            <p className="mt-1 text-xs text-[var(--neutral-600)]">
              <span className="font-medium">Fix:</span> {issue.fix}
            </p>
          )}
          {issue.currentValue !== undefined && issue.recommendedValue !== undefined && (
            <p className="mt-1 text-xs text-[var(--neutral-500)]">
              Current: {issue.currentValue.toFixed(2)} → Recommended: {issue.recommendedValue.toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
