// app/studio/components/quote-panel.tsx
// Quote and pricing panel component

"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { generateQuote, formatPriceNGN, type DetailedQuoteResult } from "@/lib/quote/estimate"
import { useWorkspace } from "@/hooks/use-workspace"
import { useIsMobile } from "@/hooks/use-media-query"
import { Icon } from "@/components/ui/icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { CheckoutModal } from "./checkout-modal"
import { exportQuoteAsPDF, downloadQuoteAsJSON } from "@/lib/quote/pdf-export"

const PROCESSES = [
  { id: 'cnc-milling', name: 'CNC Milling', icon: 'settings' },
  { id: 'cnc-turning', name: 'CNC Turning', icon: 'rotate-cw' },
  { id: 'laser-cutting', name: 'Laser Cutting', icon: 'zap' },
  { id: '3d-printing', name: '3D Printing', icon: 'box' },
  { id: 'sheet-metal', name: 'Sheet Metal', icon: 'layers' },
]

export function QuotePanel() {
  const isMobile = useIsMobile()
  const router = useRouter()
  const { getObjectGeometry, selectedObjectId, objects, activeTool } = useWorkspace()

  const [quantity, setQuantity] = useState(1)
  const [selectedProcess, setSelectedProcess] = useState('cnc-milling')
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)

  const quote = useMemo<DetailedQuoteResult | null>(() => {
    if (!selectedObjectId) return null
    
    const obj = getObjectGeometry(selectedObjectId)
    if (!obj) return null

    return generateQuote({
      geometryParams: obj.dimensions,
      objectType: obj.type,
      material: obj.material || 'aluminum-6061',
      process: selectedProcess,
      quantity,
      features: obj.features || [],
    })
  }, [selectedObjectId, getObjectGeometry, quantity, selectedProcess])

  const breakdown = quote?.breakdown

  const submitDisabledReason =
    quote && quote.manufacturability.score <= 50
      ? "Manufacturability score must be above 50"
      : !breakdown || breakdown.totalPrice <= 0
        ? "Quote not ready"
        : null

  const workspaceData = useMemo(
    () => ({
      objects,
      selectedObjectId,
      activeTool,
    }),
    [objects, selectedObjectId, activeTool]
  )

  if (!selectedObjectId) {
    return (
      <div className="p-4 text-center text-[var(--neutral-500)]">
        <Icon name="shopping-cart" className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Select an object to get a quote</p>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="p-4 text-center text-[var(--neutral-500)]">
        <p>Unable to generate quote</p>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full", isMobile ? '' : '')}>
      {/* Process Selection */}
      <div className="p-3 border-b">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--neutral-600)] mb-3">
          Manufacturing Process
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {PROCESSES.map((process) => (
            <button
              key={process.id}
              onClick={() => setSelectedProcess(process.id)}
              className={cn(
                "p-2 rounded-lg border text-left transition-colors",
                selectedProcess === process.id
                  ? "border-[var(--primary-700)] bg-[var(--primary-50)] text-[var(--primary-900)]"
                  : "border-[var(--neutral-200)] hover:border-[var(--neutral-300)]"
              )}
            >
              <Icon name={process.icon} className="w-4 h-4 mb-1" />
              <span className="text-xs font-medium block">{process.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quantity */}
      <div className="p-3 border-b">
        <Label className="text-xs font-medium text-[var(--neutral-600)] mb-2 block">
          Quantity
        </Label>
        <Input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          min={1}
          className={isMobile ? "h-10" : "h-8"}
        />
        {quantity >= 10 && (
          <p className="text-xs text-green-600 mt-1">
            ✓ Quantity discount applied
          </p>
        )}
      </div>

      {/* Price Display */}
      <div className="p-4 bg-gradient-to-br from-[var(--primary-50)] to-[var(--accent-50)] border-b">
        <div className="text-center">
          <p className="text-sm text-[var(--neutral-600)] mb-1">Estimated Total</p>
          <p className="text-3xl font-bold text-[var(--primary-700)]">
            {formatPriceNGN(breakdown?.totalPrice || 0)}
          </p>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-[var(--neutral-500)]">
            <span>Unit: {formatPriceNGN(breakdown?.unitPrice || 0)}</span>
            <span>•</span>
            <span>Lead time: {breakdown?.leadTimeDays || 0} days</span>
          </div>
        </div>
      </div>

      {/* Quick Summary */}
      <div className="p-3 border-b space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--neutral-600)]">Material:</span>
          <span className="font-medium">{quote.material.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--neutral-600)]">Volume:</span>
          <span className="font-medium">{quote.geometry.volumeCm3.toFixed(2)} cm³</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--neutral-600)]">Process:</span>
          <span className="font-medium">{selectedProcess}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--neutral-600)]">Manufacturability:</span>
          <span className={cn(
            "font-medium",
            quote.manufacturability.score >= 80 ? 'text-green-600' :
            quote.manufacturability.score >= 60 ? 'text-yellow-600' : 'text-red-600'
          )}>
            {quote.manufacturability.score}/100
          </span>
        </div>
      </div>

      {/* Toggle Breakdown */}
      <button
        onClick={() => setShowBreakdown(!showBreakdown)}
        className="flex items-center justify-between p-3 border-b hover:bg-[var(--bg-50)] transition-colors"
      >
        <span className="text-sm font-medium">Cost Breakdown</span>
        <Icon name={showBreakdown ? 'chevron-up' : 'chevron-down'} className="w-4 h-4" />
      </button>

      {/* Full Breakdown */}
      {showBreakdown && breakdown && (
        <div className="p-3 space-y-2 bg-[var(--neutral-50)]">
          <BreakdownRow label="Material Cost" value={breakdown.materialCost} />
          <BreakdownRow label="Machine Time" value={breakdown.machineCost} showMinutes={breakdown.machineTimeMinutes} />
          <BreakdownRow label="Tooling" value={breakdown.toolCost} />
          <BreakdownRow label="Labor" value={breakdown.laborCost} />
          <BreakdownRow label="Setup" value={breakdown.setupCost} />
          <div className="pt-2 mt-2 border-t border-[var(--neutral-200)]">
            <BreakdownRow label="Subtotal" value={breakdown.subtotal} bold />
            <div className="flex justify-between text-xs text-[var(--neutral-500)] mt-1">
              <span>Platform Fee ({(breakdown.platformFeePercent * 100).toFixed(0)}%)</span>
              <span>{formatPriceNGN(breakdown.platformFee)}</span>
            </div>
            <div className="flex justify-between font-bold text-[var(--primary-700)] mt-2 pt-2 border-t">
              <span>Total</span>
              <span>{formatPriceNGN(breakdown.totalPrice)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-3 border-t space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => {
              downloadQuoteAsJSON(quote)
              toast.success('Quote downloaded as JSON')
            }}
            variant="outline"
            size={isMobile ? "default" : "sm"}
            className="w-full"
          >
            <Icon name="download" className="w-4 h-4 mr-1" />
            JSON
          </Button>
          <Button
            onClick={async () => {
              try {
                await exportQuoteAsPDF(quote, {
                  includeBreakdown: true,
                  includeNotes: true,
                })
                toast.success('Quote PDF opened for printing')
              } catch (error) {
                toast.error('Failed to export PDF')
              }
            }}
            variant="outline"
            size={isMobile ? "default" : "sm"}
            className="w-full"
          >
            <Icon name="file-text" className="w-4 h-4 mr-1" />
            PDF
          </Button>
        </div>
        <Button
          onClick={() => setShowCheckout(true)}
          size={isMobile ? "default" : "sm"}
          className="w-full"
          disabled={!!submitDisabledReason}
          title={submitDisabledReason || undefined}
        >
          <Icon name="send" className="w-4 h-4 mr-2" />
          Submit for Manufacturing
        </Button>
        {submitDisabledReason && (
          <p className="text-xs text-[var(--neutral-500)] text-center">
            {submitDisabledReason}
          </p>
        )}
      </div>

      {/* Warnings */}
      {quote.details.notes.length > 0 && (
        <div className="p-3 border-t bg-yellow-50">
          <h4 className="text-xs font-semibold text-yellow-700 mb-2 flex items-center gap-1">
            <Icon name="alert-triangle" className="w-3 h-3" />
            Notes
          </h4>
          <ul className="text-xs text-yellow-700 space-y-1">
            {quote.details.notes.map((note, idx) => (
              <li key={idx}>• {note}</li>
            ))}
          </ul>
        </div>
      )}

      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        quote={quote}
        workspaceData={workspaceData}
        onCompleted={(id) => {
          setShowCheckout(false)
          router.push(`/jobs/${id}`)
        }}
      />
    </div>
  )
}

interface BreakdownRowProps {
  label: string
  value: number
  showMinutes?: number
  bold?: boolean
}

function BreakdownRow({ label, value, showMinutes, bold }: BreakdownRowProps) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-[var(--neutral-600)]">{label}</span>
      <span className={bold ? "font-bold" : ""}>
        {formatPriceNGN(value)}
        {showMinutes !== undefined && (
          <span className="text-xs text-[var(--neutral-400)] ml-1">
            ({showMinutes} min)
          </span>
        )}
      </span>
    </div>
  )
}
