"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button, Card, CardContent, Modal, Input, Label } from "@/components/ui"
import { toast } from "sonner"
import { loadFlutterwaveScript, isFlutterwaveLoaded, initiatePayment } from "@/lib/flutterwave-client"

interface PaymentModalProps {
  isOpen: boolean
  jobId: string
  jobCost: number
  description: string
  customerEmail?: string
  customerName?: string
  onSuccess: (reference: string) => Promise<void>
  onClose: () => void
}

export default function PaymentModal({
  isOpen,
  jobId,
  jobCost,
  description,
  customerEmail = "",
  customerName = "",
  onSuccess,
  onClose,
}: PaymentModalProps) {
  const [email, setEmail] = useState(customerEmail)
  const [name, setName] = useState(customerName)
  const [phone, setPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)

  useEffect(() => {
    if (isOpen && !isScriptLoaded) {
      loadFlutterwaveScript()
        .then(() => {
          setIsScriptLoaded(true)
        })
        .catch((err) => {
          console.error("Failed to load Flutterwave:", err)
          toast.error("Failed to load payment system")
        })
    }
  }, [isOpen, isScriptLoaded])

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !name || !phone) {
      toast.error("Please fill in all fields")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          amount: jobCost,
          email,
          name,
          phone,
          description,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Payment initialization failed")
      }

      const { link, tx_ref } = await response.json()

      if (isFlutterwaveLoaded()) {
        initiatePayment({
          public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY!,
          tx_ref,
          amount: jobCost,
          currency: "NGN",
          payment_options: "card,ussd,bank_transfer,mobilemoneyrwanda,mobilemoneyzambia,mobilemoneyuganda,mobilemoneytanzania,mobilemoneykenya,mobilemoneyghana",
          customer: {
            email,
            phone_number: phone,
            name,
          },
          customizations: {
            title: "Qutlas Manufacturing",
            description: description || "Manufacturing service payment",
            logo: "/logo.png",
          },
          callback: async (response: any) => {
            if (response.status === "successful" || response.transaction_id) {
              try {
                const verifyResponse = await fetch("/api/payment/verify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    transaction_id: response.transaction_id,
                    tx_ref: response.tx_ref,
                  }),
                })

                if (verifyResponse.ok) {
                  const verifyData = await verifyResponse.json()
                  if (verifyData.success) {
                    await onSuccess(response.transaction_id || tx_ref)
                    toast.success("Payment successful! Your job is being processed.")
                    onClose()
                  } else {
                    toast.error("Payment verification failed")
                  }
                } else {
                  toast.error("Payment verification failed")
                }
              } catch (err) {
                toast.error("Payment verification error")
              }
            } else {
              toast.error("Payment was not completed")
            }
            setIsLoading(false)
          },
          onClose: () => {
            setIsLoading(false)
          },
        })
      } else {
        toast.error("Payment system is still loading. Please try again.")
        setIsLoading(false)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Payment failed")
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Payment" size="md">
      <form onSubmit={handlePayment} className="space-y-4">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label className="text-sm font-medium">Full Name</Label>
              <Input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Email</Label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Phone Number</Label>
              <Input
                type="tel"
                placeholder="+234 800 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[var(--neutral-300)]">
              <span className="text-lg font-semibold">Total: ₦{jobCost.toLocaleString()}</span>
              <Button type="submit" disabled={isLoading || !isScriptLoaded}>
                {isLoading ? "Processing..." : "Pay & Route Job"}
              </Button>
            </div>

            <p className="text-xs text-[var(--neutral-500)] text-center">
              Secured by Flutterwave. You will be redirected to complete payment.
            </p>
          </CardContent>
        </Card>
      </form>
    </Modal>
  )
}
