"use client"

import type React from "react"
import { useState } from "react"
import { Button, Card, CardContent, Modal, Input } from "@/components/ui"

interface PaymentModalProps {
  isOpen: boolean
  jobCost: number
  onConfirm: (paymentIntentId: string) => Promise<void>
  onClose: () => void
}

export default function PaymentModal({ isOpen, jobCost, onConfirm, onClose }: PaymentModalProps) {
  const [cardNumber, setCardNumber] = useState("")
  const [expiryMonth, setExpiryMonth] = useState("")
  const [expiryYear, setExpiryYear] = useState("")
  const [cvc, setCvc] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/v1/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardNumber: cardNumber.replace(/\s/g, ""),
          expiryMonth: Number.parseInt(expiryMonth),
          expiryYear: Number.parseInt(expiryYear),
          cvc: cvc,
          amount: Math.round(jobCost * 100), // cents
        }),
      })

      if (!response.ok) {
        throw new Error((await response.json()).error || "Payment failed")
      }

      const data = await response.json()
      await onConfirm(data.paymentIntentId)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Payment" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Card Number</label>
              <Input
                type="text"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                maxLength={19}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-2">MM</label>
                <Input
                  type="text"
                  placeholder="12"
                  value={expiryMonth}
                  onChange={(e) => setExpiryMonth(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  maxLength={2}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">YY</label>
                <Input
                  type="text"
                  placeholder="25"
                  value={expiryYear}
                  onChange={(e) => setExpiryYear(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  maxLength={2}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">CVC</label>
                <Input
                  type="text"
                  placeholder="123"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  maxLength={4}
                  required
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[var(--neutral-300)]">
              <span className="text-lg font-semibold">Total: ${jobCost.toFixed(2)}</span>
              <Button type="submit" disabled={isLoading} className="px-6">
                {isLoading ? "Processing..." : "Pay & Route Job"}
              </Button>
            </div>

            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </CardContent>
        </Card>
      </form>
    </Modal>
  )
}
