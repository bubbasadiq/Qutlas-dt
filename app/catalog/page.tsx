"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Icon } from "@/components/ui/icon"
import { Logo } from "@/components/logo"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/lib/auth-context"

const categories = [
  { id: "all", label: "All Parts" },
  { id: "fasteners", label: "Fasteners" },
  { id: "brackets", label: "Brackets" },
  { id: "enclosures", label: "Enclosures" },
  { id: "shafts", label: "Shafts" },
  { id: "gears", label: "Gears" },
]

const materials = ["Aluminum", "Steel", "Brass", "ABS", "Nylon"]
const processes = ["CNC Milling", "Laser Cutting", "3D Printing", "Sheet Metal"]

interface CatalogPart {
  id: string
  name: string
  description?: string
  category: string
  material: string
  process?: string
  basePrice: number
  leadTime?: string
  leadTimeDays?: number
  manufacturability?: number
  thumbnail?: string
  materials?: Array<{ name: string; priceMultiplier: number }>
}

function CatalogContent() {
  const { user } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [unitSystem, setUnitSystem] = useState<"mm" | "in">("mm")
  const [parts, setParts] = useState<CatalogPart[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const fetchParts = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeCategory !== "all") {
        params.set("category", activeCategory)
      }
      if (searchQuery) {
        params.set("search", searchQuery)
      }

      const response = await fetch(`/api/catalog?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setParts(data.items || [])
        setTotalCount(data.total || 0)
      }
    } catch (error) {
      console.error("Failed to fetch catalog:", error)
    } finally {
      setIsLoading(false)
    }
  }, [activeCategory, searchQuery])

  useEffect(() => {
    fetchParts()
  }, [fetchParts])

  const handlePreview = (partId: string) => {
    router.push(`/catalog/${partId}`)
  }

  const handleAddToProject = (partId: string) => {
    router.push(`/catalog/${partId}?action=addToWorkspace`)
  }

  return (
    <div className="min-h-screen bg-[var(--bg-50)]">
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
            <Link href="/catalog" className="text-sm font-medium text-[var(--primary-700)]">
              Catalog
            </Link>
            <Link
              href="/studio"
              className="text-sm font-medium text-[var(--neutral-500)] hover:text-[var(--neutral-900)]"
            >
              Workspace
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-[var(--neutral-900)]">{user?.name}</p>
              <p className="text-xs text-[var(--neutral-500)]">{user?.company}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push("/")}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-[var(--neutral-200)]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-serif text-[var(--neutral-900)] mb-2">Parts Catalog</h1>
          <p className="text-[var(--neutral-500)]">Browse thousands of ready-to-manufacture parts</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <div className="mb-6">
              <div className="relative">
                <Icon
                  name="search"
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--neutral-400)]"
                />
                <Input
                  placeholder="Search parts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 bg-white"
                />
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-400)] mb-3">
                Categories
              </h3>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeCategory === cat.id
                        ? "bg-[var(--primary-700)] text-white font-medium"
                        : "text-[var(--neutral-700)] hover:bg-[var(--neutral-100)]"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-400)] mb-3">
                Materials
              </h3>
              <div className="space-y-2">
                {materials.map((mat) => (
                  <label key={mat} className="flex items-center gap-2 text-sm text-[var(--neutral-700)] cursor-pointer">
                    <input type="checkbox" className="rounded border-[var(--neutral-300)]" />
                    {mat}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-400)] mb-3">Process</h3>
              <div className="space-y-2">
                {processes.map((proc) => (
                  <label
                    key={proc}
                    className="flex items-center gap-2 text-sm text-[var(--neutral-700)] cursor-pointer"
                  >
                    <input type="checkbox" className="rounded border-[var(--neutral-300)]" />
                    {proc}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-400)] mb-3">Units</h3>
              <div className="flex bg-[var(--neutral-100)] rounded-lg p-1">
                <button
                  onClick={() => setUnitSystem("mm")}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    unitSystem === "mm" ? "bg-white text-[var(--neutral-900)] shadow-sm" : "text-[var(--neutral-500)]"
                  }`}
                >
                  Metric (mm)
                </button>
                <button
                  onClick={() => setUnitSystem("in")}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    unitSystem === "in" ? "bg-white text-[var(--neutral-900)] shadow-sm" : "text-[var(--neutral-500)]"
                  }`}
                >
                  Imperial (in)
                </button>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-[var(--neutral-500)]">
                {isLoading ? "Loading..." : `${totalCount} parts found`}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-[var(--neutral-100)]" : ""}`}
                >
                  <svg className="w-5 h-5 text-[var(--neutral-500)]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg ${viewMode === "list" ? "bg-[var(--neutral-100)]" : ""}`}
                >
                  <svg className="w-5 h-5 text-[var(--neutral-500)]" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-700)]"></div>
              </div>
            ) : (
              <div
                className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}
              >
                {parts.map((part) => (
                  <div
                    key={part.id}
                    className={`bg-white rounded-xl border border-[var(--neutral-200)] overflow-hidden hover:border-[var(--primary-500)] hover:shadow-lg transition-all cursor-pointer ${viewMode === "list" ? "flex" : ""}`}
                    onClick={() => handlePreview(part.id)}
                  >
                    <div className={`bg-[var(--bg-100)] ${viewMode === "list" ? "w-40 h-32" : "aspect-square"}`}>
                      <img
                        src={part.thumbnail || "/placeholder.svg"}
                        alt={part.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="p-4 flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-[var(--neutral-900)]">{part.name}</h3>
                          <p className="text-xs text-[var(--neutral-500)]">{part.material}</p>
                        </div>
                        {part.manufacturability && (
                          <span className="text-xs px-2 py-1 rounded-full bg-[var(--accent-100)] text-[var(--accent-700)]">
                            {part.manufacturability}%
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div>
                          <p className="text-lg font-semibold text-[var(--neutral-900)]">${part.basePrice}</p>
                          <p className="text-xs text-[var(--neutral-500)]">{part.leadTime || "5 days"}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAddToProject(part.id)
                          }}
                        >
                          Quick Quote
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default function CatalogPage() {
  return (
    <AuthGuard>
      <CatalogContent />
    </AuthGuard>
  )
}
