// app/studio/components/manufacturability-panel.tsx
// Manufacturability analysis panel component

"use client"

import type React from "react"
import { useMemo } from "react"
import { assessManufacturability, simplifyResult, getScoreColorClass, getScoreBgColorClass, type ManufacturabilityIssue, type Severity } from "@/lib/manufacturability/assess"
import { useWorkspace } from "@/hooks/use-workspace"
import { useIsMobile } from "@/hooks/use-media-query"
import { Icon } from "@/components/ui/icon"
import { cn } from "@/lib/utils"

export function ManufacturabilityPanel() {
  const isMobile = useIsMobile()
  const { getObjectGeometry, selectedObjectId } = useWorkspace()

  const analysis = useMemo(() => {
    if (!selectedObjectId) return null
    
    const obj = getObjectGeometry(selectedObjectId)
    if (!obj) return null

    return assessManufacturability({
      dimensions: obj.dimensions,
      features: obj.features || [],
      material: obj.material || 'aluminum-6061',
      process: 'cnc-milling',
    })
  }, [selectedObjectId, getObjectGeometry])

  const simplified = useMemo(() => {
    if (!analysis) return null
    return simplifyResult(analysis)
  }, [analysis])

  if (!selectedObjectId) {
    return (
      <div className="p-4 text-center text-[var(--neutral-500)]">
        <Icon name="info" className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Select an object to analyze manufacturability</p>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="p-4 text-center text-[var(--neutral-500)]">
        <p>Unable to analyze selected object</p>
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

  return (
    <div className={cn("flex flex-col h-full", isMobile ? '' : '')}>
      {/* Score Header */}
      <div className={cn(
        "p-4 border-b",
        getScoreBgColorClass(analysis.score)
      )}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--neutral-600)]">
            Manufacturability Score
          </h3>
          <span className={cn(
            "text-3xl font-bold",
            getScoreColorClass(analysis.score)
          )}>
            {analysis.score}
          </span>
        </div>
        
        {/* Score Bar */}
        <div className="w-full bg-white/50 rounded-full h-2 mb-2">
          <div
            className={cn(
              "h-2 rounded-full transition-all",
              analysis.score >= 80 ? 'bg-green-500' :
              analysis.score >= 60 ? 'bg-yellow-500' :
              analysis.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
            )}
            style={{ width: `${analysis.score}%` }}
          />
        </div>
        
        <p className="text-xs text-[var(--neutral-600)]">
          {simplified?.rating === 'excellent' && 'Excellent - Ready for production'}
          {simplified?.rating === 'good' && 'Good - Minor considerations'}
          {simplified?.rating === 'fair' && 'Fair - Some adjustments needed'}
          {simplified?.rating === 'poor' && 'Poor - Significant issues to address'}
          {simplified?.rating === 'critical' && 'Critical - Design changes required'}
        </p>
      </div>

      {/* Compatibility Status */}
      <div className="p-3 border-b bg-[var(--neutral-50)]">
        <div className="flex items-center gap-2">
          {analysis.compatible ? (
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
        {analysis.issues.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="check-circle" className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p className="text-[var(--neutral-600)] font-medium">No manufacturability issues</p>
            <p className="text-sm text-[var(--neutral-400)] mt-1">
              {analysis.passedChecks} of {analysis.totalChecks} checks passed
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Errors */}
            {analysis.issues.filter(v => v.severity === 'error' || v.severity === 'critical').length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wider flex items-center gap-1">
                  <Icon name="alert-circle" className="w-3 h-3" />
                  Errors ({analysis.issues.filter(v => v.severity === 'error' || v.severity === 'critical').length})
                </h4>
                {analysis.issues
                  .filter(v => v.severity === 'error' || v.severity === 'critical')
                  .map((issue, idx) => (
                    <IssueCard key={idx} issue={issue} getSeverityIcon={getSeverityIcon} getSeverityBg={getSeverityBg} />
                  ))}
              </div>
            )}

            {/* Warnings */}
            {analysis.issues.filter(v => v.severity === 'warning').length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-yellow-600 uppercase tracking-wider flex items-center gap-1">
                  <Icon name="alert-triangle" className="w-3 h-3" />
                  Warnings ({analysis.issues.filter(v => v.severity === 'warning').length})
                </h4>
                {analysis.issues
                  .filter(v => v.severity === 'warning')
                  .map((issue, idx) => (
                    <IssueCard key={idx} issue={issue} getSeverityIcon={getSeverityIcon} getSeverityBg={getSeverityBg} />
                  ))}
              </div>
            )}

            {/* Info */}
            {analysis.issues.filter(v => v.severity === 'info').length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                  <Icon name="info" className="w-3 h-3" />
                  Suggestions ({analysis.issues.filter(v => v.severity === 'info').length})
                </h4>
                {analysis.issues
                  .filter(v => v.severity === 'info')
                  .map((issue, idx) => (
                    <IssueCard key={idx} issue={issue} getSeverityIcon={getSeverityIcon} getSeverityBg={getSeverityBg} />
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confidence */}
      <div className="p-3 border-t bg-[var(--neutral-50)] text-xs text-[var(--neutral-500)]">
        <div className="flex justify-between">
          <span>Analysis Confidence</span>
          <span>{(analysis.confidence * 100).toFixed(0)}%</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Checks Passed</span>
          <span>{analysis.passedChecks} / {analysis.totalChecks}</span>
        </div>
      </div>
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
