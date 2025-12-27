"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Icon } from "@/components/ui/icon"
import { Logo } from "@/components/logo"
import { useAuth } from "@/lib/auth-context"
import { formatPriceNGN } from "@/lib/quote/estimate"
import { toast } from "sonner"

interface Order {
  id: string
  status: string
  createdAt: string
  updatedAt: string
  totalPrice: number
  quantity: number
  material: string
  process: string
  estimatedCompletion?: string
}

export default function OrdersPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch("/api/orders")
        if (!response.ok) {
          throw new Error("Failed to fetch orders")
        }
        
        const data = await response.json()
        setOrders(data.orders || [])
      } catch (err) {
        console.error("Error fetching orders:", err)
        setError(err instanceof Error ? err.message : "Failed to load orders")
        toast.error("Failed to load orders")
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in-production":
      case "in_production":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-50)]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-[var(--neutral-200)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo variant="blue" size="md" href="/" />

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-[var(--neutral-500)] hover:text-[var(--neutral-900)]"
            >
              Dashboard
            </Link>
            <Link
              href="/studio"
              className="text-sm font-medium text-[var(--neutral-500)] hover:text-[var(--neutral-900)]"
            >
              Workspace
            </Link>
            <Link
              href="/catalog"
              className="text-sm font-medium text-[var(--neutral-500)] hover:text-[var(--neutral-900)]"
            >
              Catalog
            </Link>
            <Link
              href="/orders"
              className="text-sm font-medium text-[var(--primary-700)] border-b-2 border-[var(--primary-700)] pb-1"
            >
              Orders
            </Link>
          </nav>

          <div className="flex items-center gap-4">
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
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif text-[var(--neutral-900)] mb-2">Orders</h1>
            <p className="text-[var(--neutral-500)]">Track and manage your manufacturing orders</p>
          </div>
          <Button onClick={() => router.push("/studio")} className="bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white">
            <Icon name="plus" size={16} className="mr-2" />
            New Order
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-700)]"></div>
          </div>
        ) : error ? (
          <Card className="bg-white border-[var(--neutral-200)]">
            <CardContent className="p-12 text-center">
              <Icon name="alert-circle" size={48} className="text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Card className="bg-white border-[var(--neutral-200)]">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[var(--bg-200)] flex items-center justify-center mx-auto mb-4">
                <Icon name="shopping-cart" size={32} className="text-[var(--neutral-400)]" />
              </div>
              <h3 className="text-lg font-medium text-[var(--neutral-900)] mb-2">No orders yet</h3>
              <p className="text-[var(--neutral-500)] mb-6 max-w-sm mx-auto">
                Start by creating a design in the workspace and getting a quote.
              </p>
              <Button onClick={() => router.push("/studio")} className="bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white">
                Go to Workspace
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="bg-white border-[var(--neutral-200)] hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/orders/${order.id}`)}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-[var(--neutral-900)]">Order #{order.id.slice(0, 8)}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-[var(--neutral-500)]">Material</p>
                          <p className="font-medium text-[var(--neutral-900)]">{order.material}</p>
                        </div>
                        <div>
                          <p className="text-[var(--neutral-500)]">Process</p>
                          <p className="font-medium text-[var(--neutral-900)]">{order.process}</p>
                        </div>
                        <div>
                          <p className="text-[var(--neutral-500)]">Quantity</p>
                          <p className="font-medium text-[var(--neutral-900)]">{order.quantity} units</p>
                        </div>
                        <div>
                          <p className="text-[var(--neutral-500)]">Total</p>
                          <p className="font-medium text-[var(--primary-700)]">{formatPriceNGN(order.totalPrice)}</p>
                        </div>
                      </div>
                    </div>
                    <Icon name="chevron-right" size={20} className="text-[var(--neutral-400)]" />
                  </div>
                  <div className="mt-4 pt-4 border-t border-[var(--neutral-100)] flex items-center justify-between text-xs text-[var(--neutral-500)]">
                    <span>Created: {new Date(order.createdAt).toLocaleDateString()}</span>
                    {order.estimatedCompletion && (
                      <span>Est. Completion: {new Date(order.estimatedCompletion).toLocaleDateString()}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
