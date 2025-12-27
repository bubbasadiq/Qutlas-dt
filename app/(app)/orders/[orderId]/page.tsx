"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Icon } from "@/components/ui/icon"
import { Logo } from "@/components/logo"
import { useAuth } from "@/lib/auth-context"
import { formatPriceNGN } from "@/lib/quote/estimate"
import { toast } from "sonner"

interface OrderDetail {
  id: string
  status: string
  createdAt: string
  updatedAt: string
  totalPrice: number
  quantity: number
  material: string
  process: string
  estimatedCompletion?: string
  deliveryAddress?: string
  tracking?: {
    carrier?: string
    trackingNumber?: string
    estimatedDelivery?: string
    timeline: Array<{
      status: string
      timestamp: string
      note?: string
    }>
  }
  payment?: {
    status: string
    method: string
    reference: string
    amount: number
    paidAt?: string
  }
  breakdown?: {
    subtotal: number
    platformFee: number
    shipping: number
    tax: number
    total: number
  }
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, logout } = useAuth()
  const orderId = params.orderId as string
  
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch(`/api/orders/${orderId}`)
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Order not found")
          }
          throw new Error("Failed to fetch order")
        }
        
        const data = await response.json()
        setOrder(data)
      } catch (err) {
        console.error("Error fetching order:", err)
        setError(err instanceof Error ? err.message : "Failed to load order")
        toast.error("Failed to load order details")
      } finally {
        setIsLoading(false)
      }
    }

    if (orderId) {
      fetchOrder()
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchOrder, 30000)
      return () => clearInterval(interval)
    }
  }, [orderId])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in-production":
      case "in_production":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "shipped":
        return "bg-purple-100 text-purple-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-50)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-700)]"></div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[var(--bg-50)]">
        <header className="sticky top-0 z-50 bg-white border-b border-[var(--neutral-200)]">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Logo variant="blue" size="md" href="/" />
            <Link href="/orders">
              <Button variant="outline" size="sm">Back to Orders</Button>
            </Link>
          </div>
        </header>
        <div className="max-w-3xl mx-auto px-6 py-12">
          <Card className="bg-white border-[var(--neutral-200)]">
            <CardContent className="p-12 text-center">
              <Icon name="alert-circle" size={48} className="text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-[var(--neutral-900)] mb-2">{error || "Order not found"}</h2>
              <p className="text-[var(--neutral-500)] mb-6">
                The order you're looking for doesn't exist or you don't have access to it.
              </p>
              <Link href="/orders">
                <Button className="bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white">
                  Back to Orders
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-50)]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-[var(--neutral-200)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo variant="blue" size="md" href="/" />
          
          <div className="flex items-center gap-4">
            <Link href="/orders">
              <Button variant="outline" size="sm">
                <Icon name="arrow-left" size={16} className="mr-2" />
                Back to Orders
              </Button>
            </Link>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-[var(--neutral-900)]">{user?.name}</p>
              <p className="text-xs text-[var(--neutral-500)]">{user?.company}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Order Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-serif text-[var(--neutral-900)] mb-2">
                Order #{order.id.slice(0, 8)}
              </h1>
              <p className="text-[var(--neutral-500)]">
                Placed on {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {order.status.replace("_", " ")}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <Card className="bg-white border-[var(--neutral-200)]">
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[var(--neutral-500)]">Material</p>
                    <p className="font-medium text-[var(--neutral-900)]">{order.material}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--neutral-500)]">Process</p>
                    <p className="font-medium text-[var(--neutral-900)]">{order.process}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--neutral-500)]">Quantity</p>
                    <p className="font-medium text-[var(--neutral-900)]">{order.quantity} units</p>
                  </div>
                  {order.estimatedCompletion && (
                    <div>
                      <p className="text-sm text-[var(--neutral-500)]">Est. Completion</p>
                      <p className="font-medium text-[var(--neutral-900)]">
                        {new Date(order.estimatedCompletion).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            {order.tracking?.timeline && order.tracking.timeline.length > 0 && (
              <Card className="bg-white border-[var(--neutral-200)]">
                <CardHeader>
                  <CardTitle className="text-lg">Order Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.tracking.timeline.slice().reverse().map((event, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-[var(--primary-700)]" />
                          {idx < order.tracking!.timeline.length - 1 && (
                            <div className="w-0.5 h-full bg-[var(--neutral-200)] mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium text-[var(--neutral-900)]">{event.status}</p>
                          {event.note && (
                            <p className="text-sm text-[var(--neutral-500)] mt-1">{event.note}</p>
                          )}
                          <p className="text-xs text-[var(--neutral-400)] mt-1">
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tracking Information */}
            {order.tracking?.trackingNumber && (
              <Card className="bg-white border-[var(--neutral-200)]">
                <CardHeader>
                  <CardTitle className="text-lg">Shipping Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-[var(--neutral-500)]">Carrier</p>
                    <p className="font-medium text-[var(--neutral-900)]">{order.tracking.carrier || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--neutral-500)]">Tracking Number</p>
                    <p className="font-mono text-sm text-[var(--neutral-900)]">{order.tracking.trackingNumber}</p>
                  </div>
                  {order.tracking.estimatedDelivery && (
                    <div>
                      <p className="text-sm text-[var(--neutral-500)]">Estimated Delivery</p>
                      <p className="font-medium text-[var(--neutral-900)]">
                        {new Date(order.tracking.estimatedDelivery).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {order.deliveryAddress && (
                    <div>
                      <p className="text-sm text-[var(--neutral-500)]">Delivery Address</p>
                      <p className="text-sm text-[var(--neutral-900)] whitespace-pre-line">{order.deliveryAddress}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Payment & Cost */}
          <div className="space-y-6">
            {/* Payment Information */}
            {order.payment && (
              <Card className="bg-white border-[var(--neutral-200)]">
                <CardHeader>
                  <CardTitle className="text-lg">Payment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-[var(--neutral-500)]">Status</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.payment.status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {order.payment.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-[var(--neutral-500)]">Method</p>
                    <p className="font-medium text-[var(--neutral-900)]">{order.payment.method}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-[var(--neutral-500)]">Reference</p>
                    <p className="font-mono text-xs text-[var(--neutral-900)]">{order.payment.reference.slice(0, 12)}...</p>
                  </div>
                  {order.payment.paidAt && (
                    <div className="flex justify-between">
                      <p className="text-sm text-[var(--neutral-500)]">Paid At</p>
                      <p className="text-sm text-[var(--neutral-900)]">
                        {new Date(order.payment.paidAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Cost Breakdown */}
            <Card className="bg-white border-[var(--neutral-200)]">
              <CardHeader>
                <CardTitle className="text-lg">Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.breakdown ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <p className="text-[var(--neutral-500)]">Subtotal</p>
                      <p className="text-[var(--neutral-900)]">{formatPriceNGN(order.breakdown.subtotal)}</p>
                    </div>
                    <div className="flex justify-between text-sm">
                      <p className="text-[var(--neutral-500)]">Platform Fee</p>
                      <p className="text-[var(--neutral-900)]">{formatPriceNGN(order.breakdown.platformFee)}</p>
                    </div>
                    {order.breakdown.shipping > 0 && (
                      <div className="flex justify-between text-sm">
                        <p className="text-[var(--neutral-500)]">Shipping</p>
                        <p className="text-[var(--neutral-900)]">{formatPriceNGN(order.breakdown.shipping)}</p>
                      </div>
                    )}
                    {order.breakdown.tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <p className="text-[var(--neutral-500)]">Tax</p>
                        <p className="text-[var(--neutral-900)]">{formatPriceNGN(order.breakdown.tax)}</p>
                      </div>
                    )}
                    <div className="flex justify-between pt-3 border-t border-[var(--neutral-200)] font-semibold">
                      <p className="text-[var(--neutral-900)]">Total</p>
                      <p className="text-[var(--primary-700)] text-lg">{formatPriceNGN(order.breakdown.total)}</p>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between font-semibold">
                    <p className="text-[var(--neutral-900)]">Total</p>
                    <p className="text-[var(--primary-700)] text-lg">{formatPriceNGN(order.totalPrice)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="bg-white border-[var(--neutral-200)]">
              <CardContent className="p-4 space-y-2">
                <Button className="w-full" variant="outline" onClick={() => window.print()}>
                  <Icon name="download" size={16} className="mr-2" />
                  Download Invoice
                </Button>
                {order.status !== "cancelled" && (
                  <Button className="w-full" variant="outline" onClick={() => {
                    if (confirm("Are you sure you want to cancel this order?")) {
                      toast.info("Contact support to cancel this order")
                    }
                  }}>
                    Cancel Order
                  </Button>
                )}
                <Button className="w-full bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white" onClick={() => router.push("/studio")}>
                  <Icon name="plus" size={16} className="mr-2" />
                  Create New Order
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
