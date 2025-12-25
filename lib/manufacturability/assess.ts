// lib/manufacturability/assess.ts
// Complete manufacturability assessment engine

import { 
  ALL_CONSTRAINT_CHECKS, 
  type ConstraintCheck, 
  type ConstraintParams,
  type ConstraintViolation,
  type Severity 
} from './constraints'

export { type ConstraintViolation, type Severity }

export interface ManufacturabilityIssue {
  id: string
  severity: Severity
  category: string
  message: string
  fix: string
  currentValue?: number
  recommendedValue?: number
}

export interface ManufacturabilityResult {
  score: number
  issues: ManufacturabilityIssue[]
  passedChecks: number
  totalChecks: number
  confidence: number
  estimatedCost: number
  warnings: string[]
  compatible: boolean
}

export interface ManufacturabilityAssessmentInput {
  dimensions: Record<string, number>
  features: Array<{ type: string; parameters: Record<string, any> }>
  material: string
  process: string
  quantity?: number
}

// Severity weights for score calculation
const SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 20,
  error: 15,
  warning: 8,
  info: 2,
}

// Calculate manufacturability score from violations
function calculateScore(violations: ManufacturabilityIssue[]): number {
  if (violations.length === 0) return 100
  
  const totalDeduction = violations.reduce((sum, v) => {
    return sum + SEVERITY_WEIGHTS[v.severity]
  }, 0)
  
  return Math.max(0, 100 - totalDeduction)
}

// Check if the design is manufacturable
function isManufacturable(violations: ManufacturabilityIssue[]): boolean {
  // Critical or error violations make it not manufacturable
  const criticalOrErrors = violations.filter(v => 
    v.severity === 'critical' || v.severity === 'error'
  )
  return criticalOrErrors.length === 0
}

// Estimate additional cost due to manufacturability issues
function estimateCostImpact(
  violations: ManufacturabilityIssue[],
  baseCost: number
): number {
  let impactMultiplier = 1.0
  
  for (const v of violations) {
    switch (v.severity) {
      case 'critical':
        impactMultiplier *= 1.5 // May require special handling
        break
      case 'error':
        impactMultiplier *= 1.25 // May require rework
        break
      case 'warning':
        impactMultiplier *= 1.1 // May need extra care
        break
      case 'info':
        impactMultiplier *= 1.02 // Minor consideration
        break
    }
  }
  
  return baseCost * impactMultiplier
}

export function assessManufacturability(
  input: ManufacturabilityAssessmentInput
): ManufacturabilityResult {
  const { dimensions, features, material, process, quantity = 1 } = input
  
  const params: ConstraintParams = {
    dimensions,
    features,
    material,
    process,
  }
  
  const violations: ManufacturabilityIssue[] = []
  let passedChecks = 0
  let totalChecks = ALL_CONSTRAINT_CHECKS.length
  
  // Run all constraint checks
  for (const check of ALL_CONSTRAINT_CHECKS) {
    try {
      const result = check.check(params)
      totalChecks++
      
      if (result.passed) {
        passedChecks++
      } else if (result.violation) {
        violations.push(result.violation)
      }
    } catch (error) {
      // Skip check if it fails
      console.warn(`Manufacturability check ${check.id} failed:`, error)
    }
  }
  
  // Sort violations by severity
  const severityOrder: Record<Severity, number> = {
    critical: 0,
    error: 1,
    warning: 2,
    info: 3,
  }
  violations.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
  
  // Calculate score
  const score = calculateScore(violations)
  
  // Check if manufacturable
  const compatible = isManufacturable(violations)
  
  // Estimate cost impact (base on quantity)
  const baseCost = quantity * 1000
  const estimatedCost = estimateCostImpact(violations, baseCost)
  
  // Calculate confidence (based on how many checks passed)
  const confidence = passedChecks / totalChecks
  
  // Extract warnings
  const warnings = violations
    .filter(v => v.severity === 'warning' || v.severity === 'info')
    .map(v => v.message)
  
  return {
    score,
    issues: violations,
    passedChecks,
    totalChecks,
    confidence,
    estimatedCost,
    warnings,
    compatible,
  }
}

// Create a simplified result for UI display
export interface SimplifiedManufacturabilityResult {
  score: number
  rating: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
  issues: {
    errors: ManufacturabilityIssue[]
    warnings: ManufacturabilityIssue[]
    info: ManufacturabilityIssue[]
  }
  manufacturability: string
}

export function simplifyResult(result: ManufacturabilityResult): SimplifiedManufacturabilityResult {
  const rating: SimplifiedManufacturabilityResult['rating'] = 
    result.score >= 90 ? 'excellent' :
    result.score >= 75 ? 'good' :
    result.score >= 60 ? 'fair' :
    result.score >= 40 ? 'poor' : 'critical'
  
  const manufacturability = result.compatible
    ? result.score >= 75 ? 'This design is manufacturable with standard processes'
      : result.score >= 60 ? 'This design is manufacturable with minor adjustments'
      : 'This design requires significant changes for manufacturing'
    : 'This design cannot be manufactured with current settings'
  
  return {
    score: result.score,
    rating,
    issues: {
      errors: result.issues.filter(v => v.severity === 'critical' || v.severity === 'error'),
      warnings: result.issues.filter(v => v.severity === 'warning'),
      info: result.issues.filter(v => v.severity === 'info'),
    },
    manufacturability,
  }
}

// Get color class for score display
export function getScoreColorClass(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  if (score >= 40) return 'text-orange-600'
  return 'text-red-600'
}

// Get background color class for score display
export function getScoreBgColorClass(score: number): string {
  if (score >= 80) return 'bg-green-100'
  if (score >= 60) return 'bg-yellow-100'
  if (score >= 40) return 'bg-orange-100'
  return 'bg-red-100'
}

// Get icon name for severity
export function getSeverityIcon(severity: Severity): string {
  switch (severity) {
    case 'critical':
      return 'alert-octagon'
    case 'error':
      return 'alert-circle'
    case 'warning':
      return 'alert-triangle'
    case 'info':
      return 'info'
    default:
      return 'info'
  }
}

// Export helper for formatting
export function formatScoreDisplay(score: number): string {
  return `${score}/100`
}

// Validate that all required parameters are present
export function validateAssessmentInput(
  input: Partial<ManufacturabilityAssessmentInput>
): { valid: boolean; missing: string[] } {
  const required: (keyof ManufacturabilityAssessmentInput)[] = [
    'dimensions',
    'features',
    'material',
    'process',
  ]
  
  const missing = required.filter(field => !input[field])
  
  return {
    valid: missing.length === 0,
    missing,
  }
}
