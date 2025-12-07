"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Icon } from "@/components/ui/icon"

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

const sampleParts = [
  {
    id: "part-001",
    name: "Precision Bracket",
    category: "brackets",
    material: "Aluminum 6061",
    process: "CNC Milling",
    price: "$32",
    leadTime: "3 days",
    thumbnail: "/placeholder.svg?height=200&width=200",
    manufacturability: 96,
  },
  {
    id: "part-002",
    name: "Hex Socket Bolt M8",
    category: "fasteners",
    material: "Steel",
    process: "CNC",
    price: "$4",
    leadTime: "2 days",
    thumbnail: "/placeholder.svg?height=200&width=200",
    manufacturability: 99,
  },
  {
    id: "part-003",
    name: "Electronics Enclosure",
    category: "enclosures",
    material: "ABS",
    process: "3D Printing",
    price: "$28",
    leadTime: "4 days",
    thumbnail: "/placeholder.svg?height=200&width=200",
    manufacturability: 94,
  },
  {
    id: "part-004",
    name: "Drive Shaft 20mm",
    category: "shafts",
    material: "Steel 1045",
    process: "CNC Turning",
    price: "$45",
    leadTime: "5 days",
    thumbnail: "/placeholder.svg?height=200&width=200",
    manufacturability: 98,
  },
  {
    id: "part-005",
    name: "Spur Gear 24T",
    category: "gears",
    material: "Brass",
    process: "CNC Milling",
    price: "$56",
    leadTime: "6 days",
    thumbnail: "/placeholder.svg?height=200&width=200",
    manufacturability: 91,
  },
  {
    id: "part-006",
    name: "L-Bracket Heavy",
    category: "brackets",
    material: "Steel",
    process: "Sheet Metal",
    price: "$18",
    leadTime: "2 days",
    thumbnail: "/placeholder.svg?height=200&width=200",
    manufacturability: 97,
  },
]

export default function CatalogPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [unitSystem, setUnitSystem] = useState<"mm" | "in">("mm")

  const filteredParts = sampleParts.filter((part) => {
    const matchesSearch = part.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === "all" || part.category === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-[var(--bg-50)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[var(--neutral-200)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-700)] flex items-center justify-center">
              <span className="text-white font-bold text-lg">Q</span>
            </div>
            <span className="font-serif font-semibold text-xl text-[var(--neutral-900)]">Qutlas</span>
          </Link>

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

          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm" className="bg-[var(--primary-700)] text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Page Header */}
      <div className="bg-white border-b border-[var(--neutral-200)]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-serif text-[var(--neutral-900)] mb-2">Parts Catalog</h1>
          <p className="text-[var(--neutral-500)]">Browse thousands of ready-to-manufacture parts</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            {/* Search */}
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

            {/* Categories */}
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

            {/* Materials */}
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

            {/* Processes */}
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

            {/* Unit Toggle */}
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

          {/* Main Content */}
          <main className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-[var(--neutral-500)]">{filteredParts.length} parts found</p>
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

            {/* Parts Grid */}
            <div
              className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}
            >
              {filteredParts.map((part) => (
                <Link key={part.id} href={`/catalog/${part.id}`}>
                  <div
                    className={`bg-white rounded-xl border border-[var(--neutral-200)] overflow-hidden hover:border-[var(--primary-500)] hover:shadow-lg transition-all ${viewMode === "list" ? "flex" : ""}`}
                  >
                    {/* Thumbnail */}
                    <div className={`bg-[var(--bg-100)] ${viewMode === "list" ? "w-40 h-32" : "aspect-square"}`}>
                      <img
                        src={part.thumbnail || "/placeholder.svg"}
                        alt={part.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="p-4 flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-[var(--neutral-900)]">{part.name}</h3>
                          <p className="text-xs text-[var(--neutral-500)]">{part.material}</p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-[var(--accent-100)] text-[var(--accent-700)]">
                          {part.manufacturability}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div>
                          <p className="text-lg font-semibold text-[var(--neutral-900)]">{part.price}</p>
                          <p className="text-xs text-[var(--neutral-500)]">{part.leadTime}</p>
                        </div>
                        <Button size="sm" variant="outline" className="bg-transparent">
                          Quick Quote
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
