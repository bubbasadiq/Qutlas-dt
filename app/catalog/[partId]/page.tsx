"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icon } from "@/components/ui/icon"
import { Logo } from "@/components/logo"
import { toast } from "sonner"
import { useCurrency } from "@/hooks/use-currency"
import { PriceDisplay } from "@/components/price-display"
import { CurrencySelector } from "@/components/currency-selector"

interface PartDetail {
  id: string
  name: string
  description: string
  category: string
  material: string
  process: string
  basePrice: number
  leadTime: string
  leadTimeDays: number
  manufacturability: number
  thumbnail: string
  cadFilePath?: string
  parameters: Array<{ name: string; value: number; unit: string; min: number; max: number }>
  materials: Array<{ name: string; priceMultiplier: number }>
  specifications: Array<{ label: string; value: string }>
}

interface QuoteData {
  quoteId: string
  quantity: number
  material: string
  unitPrice: number
  subtotal: number
  platformFee: number
  totalPrice: number
  leadTimeDays: number
  manufacturability: number
  currency?: string
}

interface HubMatch {
  hubId: string
  hubName: string
  hubLocation: string
  rating: number
  completedJobs: number
  priceEstimate: number
  leadTimeDays: number
  fitsLeadTime: boolean
  score: number
}

export default function PartDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const partId = params.partId as string
  const { currency, formatPrice, convertPrice } = useCurrency()

  const [part, setPart] = useState<PartDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedMaterial, setSelectedMaterial] = useState<{ name: string; priceMultiplier: number } | null>(null)
  const [parameters, setParameters] = useState<Record<string, number>>({})
  const [showPreview, setShowPreview] = useState(false)
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [hubMatches, setHubMatches] = useState<HubMatch[]>([])
  const [selectedHub, setSelectedHub] = useState<HubMatch | null>(null)
  const [isCreatingQuote, setIsCreatingQuote] = useState(false)
  const [isCreatingJob, setIsCreatingJob] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const fetchPart = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/catalog/${partId}`)
      if (response.ok) {
        const data = await response.json()
        setPart(data)
        setSelectedMaterial(data.materials?.[0] || { name: data.material, priceMultiplier: 1 })
        const initialParams: Record<string, number> = {}
        data.parameters?.forEach((p: any) => {
          initialParams[p.name] = p.value
        })
        setParameters(initialParams)
      } else {
        toast.error("Part not found")
        router.push("/catalog")
      }
    } catch (error) {
      console.error("Failed to fetch part:", error)
      toast.error("Failed to load part")
    } finally {
      setIsLoading(false)
    }
  }, [partId, router])

  useEffect(() => {
    fetchPart()
    if (searchParams.get("action") === "addToWorkspace") {
      setShowQuoteModal(true)
    }
  }, [fetchPart, searchParams])

  const calculatePrice = useCallback(() => {
    if (!part || !selectedMaterial) return 0
    const multiplier = selectedMaterial.priceMultiplier
    let price = part.basePrice * multiplier * quantity
    if (quantity >= 10) price *= 0.95
    if (quantity >= 50) price *= 0.9
    return Math.round(price * 100) / 100
  }, [part, selectedMaterial, quantity])

  const handlePreview3D = () => {
    setShowPreview(true)
    toast.info("3D Preview - Opening viewer...")
  }

  const handleDownloadCAD = async () => {
    if (!part) return
    try {
      const response = await fetch(`/api/cad/download/${partId}`)
      if (response.ok) {
        const data = await response.json()
        toast.success(`Downloading ${data.filename}...`)
        window.open(data.downloadUrl, "_blank")
      } else {
        toast.error("CAD file not available")
      }
    } catch (error) {
      toast.error("Failed to download CAD file")
    }
  }

  const handleAddToWorkspace = () => {
    if (!part) return
    const workspaceData = {
      type: "catalog-part",
      partId: part.id,
      name: part.name,
      parameters,
      material: selectedMaterial?.name,
    }
    localStorage.setItem(`workspace-import-${Date.now()}`, JSON.stringify(workspaceData))
    toast.success("Part prepared for workspace. Redirecting...")
    router.push(`/studio?import=${part.id}`)
  }

  const handleGetQuote = async () => {
    if (!part) return
    setIsCreatingQuote(true)
    try {
      const response = await fetch("/api/quote/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partId: part.id,
          quantity,
          material: selectedMaterial?.name,
          parameters,
          currency: currency.code,
        }),
      })

      if (response.ok) {
        const quoteData = await response.json()
        setQuote(quoteData)
        setShowQuoteModal(true)
        await findHubs(quoteData)
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to create quote")
      }
    } catch (error) {
      toast.error("Failed to create quote")
    } finally {
      setIsCreatingQuote(false)
    }
  }

  const findHubs = async (quoteData: QuoteData) => {
    try {
      const response = await fetch("/api/hubs/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partId: part?.id,
          material: selectedMaterial?.name,
          process: part?.process,
          quantity,
          leadTimeRequirement: quoteData.leadTimeDays + 2,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setHubMatches(data.matches || [])
        if (data.matches?.[0]) {
          setSelectedHub(data.matches[0])
        }
      }
    } catch (error) {
      console.error("Failed to find hubs:", error)
    }
  }

  const handleCreateJob = async () => {
    if (!selectedHub || !quote) return
    setIsCreatingJob(true)
    try {
      const jobResponse = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partId: part?.id,
          quoteId: quote.quoteId,
          hubId: selectedHub.hubId,
          quantity,
          material: selectedMaterial?.name,
          parameters,
          totalPrice: quote.totalPrice,
        }),
      })

      if (jobResponse.ok) {
        const job = await jobResponse.json()
        setShowPaymentModal(true)
      } else {
        const error = await jobResponse.json()
        toast.error(error.error || "Failed to create job")
      }
    } catch (error) {
      toast.error("Failed to create job")
    } finally {
      setIsCreatingJob(false)
    }
  }

  const handlePaymentSuccess = async (reference: string) => {
    toast.success("Payment successful! Job is now being processed.")
    router.push("/dashboard")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-50)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-700)]"></div>
      </div>
    )
  }

  if (!part) {
    return (
      <div className="min-h-screen bg-[var(--bg-50)] flex items-center justify-center">
        <p>Part not found</p>
      </div>
    )
  }

  const calculatedPrice = calculatePrice()

  return (
    <div className="min-h-screen bg-[var(--bg-50)]">
      <header className="sticky top-0 z-50 bg-white border-b border-[var(--neutral-200)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo variant="blue" size="md" href="/" />
            <div className="hidden sm:flex items-center gap-2 text-sm text-[var(--neutral-400)]">
              <span>/</span>
              <Link href="/catalog" className="hover:text-[var(--neutral-700)]">
                Catalog
              </Link>
              <span>/</span>
              <span className="text-[var(--neutral-700)]">{part.name}</span>
            </div>
          </div>
          <CurrencySelector />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <div className="bg-white rounded-2xl border border-[var(--neutral-200)] overflow-hidden">
              <div className="aspect-square bg-[var(--bg-100)] flex items-center justify-center relative">
                {showPreview ? (
                  <div className="flex flex-col items-center justify-center w-full h-full">
                    <Icon name="cube" size={64} className="text-[var(--neutral-400)] mb-4" />
                    <p className="text-[var(--neutral-500)]">3D Preview would render here</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowPreview(false)}>
                      Close Preview
                    </Button>
                  </div>
                ) : (
                  <img src={part.thumbnail || "/placeholder.svg"} alt={part.name} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="p-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={handlePreview3D}>
                  <Icon name="simulation" size={16} className="mr-2" />
                  3D Preview
                </Button>
                <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={handleDownloadCAD}>
                  <Icon name="download" size={16} className="mr-2" />
                  Download CAD
                </Button>
              </div>
            </div>

            <div className="mt-6 bg-white rounded-xl border border-[var(--neutral-200)] p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--neutral-400)] mb-4">
                Specifications
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {part.specifications.map((spec, idx) => (
                  <div key={idx}>
                    <p className="text-xs text-[var(--neutral-500)]">{spec.label}</p>
                    <p className="text-sm font-medium text-[var(--neutral-900)]">{spec.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-6">
              <span className="text-sm text-[var(--accent-600)] font-medium">{part.category}</span>
              <h1 className="text-3xl font-serif text-[var(--neutral-900)] mt-1">{part.name}</h1>
              <p className="text-[var(--neutral-500)] mt-3 leading-relaxed">{part.description}</p>
            </div>

            <div className="bg-[var(--accent-50)] border border-[var(--accent-200)] rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[var(--neutral-700)]">Manufacturability Score</span>
                <span className="text-lg font-bold text-[var(--accent-700)]">{part.manufacturability}%</span>
              </div>
              <div className="w-full h-2 bg-[var(--accent-200)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--accent-500)] rounded-full" style={{ width: `${part.manufacturability}%` }} />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[var(--neutral-200)] p-6 space-y-6">
              <div>
                <Label className="text-sm font-medium text-[var(--neutral-700)] mb-3 block">Material</Label>
                <div className="grid grid-cols-2 gap-2">
                  {part.materials.map((mat) => (
                    <button
                      key={mat.name}
                      onClick={() => setSelectedMaterial(mat)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        selectedMaterial?.name === mat.name
                          ? "border-[var(--primary-500)] bg-[var(--primary-50)]"
                          : "border-[var(--neutral-200)] hover:border-[var(--neutral-300)]"
                      }`}
                    >
                      <p className="text-sm font-medium text-[var(--neutral-900)]">{mat.name}</p>
                      {mat.priceMultiplier !== 1 && (
                        <p className="text-xs text-[var(--neutral-500)]">
                          {mat.priceMultiplier > 1 ? "+" : ""}
                          {((mat.priceMultiplier - 1) * 100).toFixed(0)}%
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-[var(--neutral-700)] mb-3 block">Parameters</Label>
                <div className="grid grid-cols-2 gap-4">
                  {part.parameters.map((param) => (
                    <div key={param.name}>
                      <Label className="text-xs text-[var(--neutral-500)]">
                        {param.name} ({param.unit})
                      </Label>
                      <Input
                        type="number"
                        value={parameters[param.name] || param.value}
                        onChange={(e) => setParameters({ ...parameters, [param.name]: Number(e.target.value) })}
                        min={param.min}
                        max={param.max}
                        className="h-9 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-[var(--neutral-700)] mb-3 block">Quantity</Label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 p-0 bg-transparent"
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-20 h-10 text-center"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 p-0 bg-transparent"
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--neutral-200)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[var(--neutral-500)]">Unit Price</span>
                  <span className="font-medium text-[var(--neutral-900)]">
                    <PriceDisplay amount={part.basePrice * (selectedMaterial?.priceMultiplier || 1)} variant="compact" />
                  </span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[var(--neutral-500)]">Lead Time</span>
                  <span className="font-medium text-[var(--neutral-900)]">{part.leadTime}</span>
                </div>
                <div className="flex items-center justify-between text-lg">
                  <span className="font-medium text-[var(--neutral-900)]">Total</span>
                  <span className="font-bold text-[var(--primary-700)]">
                    <PriceDisplay amount={calculatedPrice} variant="default" />
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={handleAddToWorkspace}>
                  Add to Workspace
                </Button>
                <Button
                  className="flex-1 bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-[var(--neutral-900)]"
                  onClick={handleGetQuote}
                  disabled={isCreatingQuote}
                >
                  {isCreatingQuote ? "Creating Quote..." : "Get Quote"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showQuoteModal && quote && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[var(--neutral-200)]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[var(--neutral-900)]">Quote Summary</h2>
                <button onClick={() => setShowQuoteModal(false)} className="text-[var(--neutral-400)] hover:text-[var(--neutral-600)]">
                  <Icon name="x" size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-[var(--bg-50)] rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[var(--neutral-500)]">Part</p>
                    <p className="font-medium text-[var(--neutral-900)]">{part.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--neutral-500)]">Quantity</p>
                    <p className="font-medium text-[var(--neutral-900)]">{quote.quantity} units</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--neutral-500)]">Material</p>
                    <p className="font-medium text-[var(--neutral-900)]">{quote.material}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--neutral-500)]">Lead Time</p>
                    <p className="font-medium text-[var(--neutral-900)]">{quote.leadTimeDays} days</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[var(--neutral-700)] mb-3">Recommended Manufacturing Hubs</h3>
                <div className="space-y-3">
                  {hubMatches.map((hub) => (
                    <div
                      key={hub.hubId}
                      className={`border rounded-xl p-4 cursor-pointer transition-colors ${
                        selectedHub?.hubId === hub.hubId
                          ? "border-[var(--primary-500)] bg-[var(--primary-50)]"
                          : "border-[var(--neutral-200)] hover:border-[var(--neutral-300)]"
                      }`}
                      onClick={() => setSelectedHub(hub)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-[var(--neutral-900)]">{hub.hubName}</p>
                          <p className="text-sm text-[var(--neutral-500)]">{hub.hubLocation}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[var(--primary-700)]">${hub.priceEstimate.toFixed(2)}</p>
                          <p className="text-sm text-[var(--neutral-500)]">{hub.leadTimeDays} days</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-[var(--neutral-500)]">★ {hub.rating}</span>
                        <span className="text-xs text-[var(--neutral-500)]">{hub.completedJobs} jobs</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-[var(--neutral-200)] pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--neutral-500)]">Subtotal</span>
                  <span className="text-[var(--neutral-900)]">
                    <PriceDisplay amount={quote.subtotal} variant="compact" />
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--neutral-500)]">Platform Fee (15%)</span>
                  <span className="text-[var(--neutral-900)]">
                    <PriceDisplay amount={quote.platformFee} variant="compact" />
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-[var(--neutral-900)]">Total</span>
                  <span className="text-[var(--primary-700)]">
                    <PriceDisplay amount={quote.totalPrice} variant="default" />
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowQuoteModal(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-[var(--neutral-900)]"
                  onClick={handleCreateJob}
                  disabled={!selectedHub || isCreatingJob}
                >
                  {isCreatingJob ? "Creating Job..." : "Proceed to Payment"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && selectedHub && quote && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-[var(--neutral-200)]">
              <h2 className="text-xl font-semibold text-[var(--neutral-900)]">Payment Required</h2>
            </div>
            <div className="p-6">
              <p className="text-[var(--neutral-600)] mb-4">
                Job created! Complete payment to route your order to <strong>{selectedHub.hubName}</strong>.
              </p>
              <div className="bg-[var(--bg-50)] rounded-xl p-4 mb-6">
                <p className="text-sm text-[var(--neutral-500)]">Amount Due</p>
                <PriceDisplay amount={quote.totalPrice} variant="large" className="text-[var(--primary-700)]" />
              </div>
              <PaymentModalWrapper
                jobId={`job-${Date.now()}`}
                jobCost={quote.totalPrice}
                description={`Manufacturing order for ${part.name} x ${quantity}`}
                onSuccess={handlePaymentSuccess}
                onClose={() => setShowPaymentModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PaymentModalWrapper({
  jobId,
  jobCost,
  description,
  onSuccess,
  onClose,
}: {
  jobId: string
  jobCost: number
  description: string
  onSuccess: (reference: string) => Promise<void>
  onClose: () => void
}) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null
  }

  const PaymentModal = require("@/app/studio/components/payment-modal").default
  return <PaymentModal isOpen={true} jobId={jobId} jobCost={jobCost} description={description} currency={currency.code} onSuccess={onSuccess} onClose={onClose} />
}
