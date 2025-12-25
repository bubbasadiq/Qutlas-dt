"use client"

import { useMemo, useState } from "react"
import { Modal, Card, CardContent, Button } from "@/components/ui"
import PaymentModal from "@/app/studio/components/payment-modal"
import { formatPriceNGN, type DetailedQuoteResult } from "@/lib/quote/estimate"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  quote: DetailedQuoteResult
  workspaceData: unknown
  onCompleted?: (jobId: string) => void
}

export function CheckoutModal({ isOpen, onClose, quote, workspaceData, onCompleted }: CheckoutModalProps) {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [showPayment, setShowPayment] = useState(false)

  const total = quote.breakdown.totalPrice

  const canSubmit = useMemo(() => {
    return quote.manufacturability.score > 50 && total > 0
  }, [quote.manufacturability.score, total])

  const submitJob = async () => {
    if (!canSubmit) return

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/jobs/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceData,
          quote,
          manufacturability: quote.manufacturability,
          toolpath: quote.toolpath,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit job")
      }

      setJobId(data.jobId)
      setShowPayment(true)
    } catch (e) {
      toast.error(e instanceof Error ? `Failed to submit: ${e.message}` : "Failed to submit")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Submit for Manufacturing" size="lg">
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--neutral-600)]">Process</span>
                <span className="font-medium">{quote.process}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--neutral-600)]">Material</span>
                <span className="font-medium">{quote.material.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--neutral-600)]">Lead time</span>
                <span className="font-medium">{quote.breakdown.leadTimeDays} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--neutral-600)]">Manufacturability</span>
                <span className="font-medium">{quote.manufacturability.score}/100</span>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-[var(--neutral-200)]">
                <span className="text-sm font-medium">Total</span>
                <span className="text-xl font-bold text-[var(--primary-700)]">{formatPriceNGN(total)}</span>
              </div>
            </CardContent>
          </Card>

          {!canSubmit && (
            <p className="text-sm text-red-600">
              This design must have a manufacturability score above 50 before it can be submitted.
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={submitJob} disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Submitting…" : "Continue to Payment"}
            </Button>
          </div>
        </div>
      </Modal>

      {jobId && (
        <PaymentModal
          isOpen={showPayment}
          jobId={jobId}
          jobCost={total}
          description={`Manufacturing payment for ${quote.geometry.type}`}
          customerEmail={user?.email}
          customerName={user?.name}
          onClose={() => {
            setShowPayment(false)
            onClose()
          }}
          onSuccess={async () => {
            toast.success("Payment confirmed. Redirecting to job tracking…")
            onCompleted?.(jobId)
          }}
        />
      )}
    </>
  )
}
