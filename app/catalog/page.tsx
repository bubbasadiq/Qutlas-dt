"use client"

import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { useState } from "react"
import Link from "next/link"

const CATALOG_ITEMS = [
  {
    id: 1,
    name: "Steel Bracket",
    category: "Fasteners",
    material: "Stainless Steel",
    price: "£12.50",
    supplier: "ManHub North",
  },
  {
    id: 2,
    name: "Aluminum Plate",
    category: "Sheets",
    material: "Aluminum",
    price: "£24.00",
    supplier: "ManHub Central",
  },
  {
    id: 3,
    name: "Assembly Kit",
    category: "Assemblies",
    material: "Mixed",
    price: "£89.99",
    supplier: "ManHub South",
  },
]

export default function CatalogPage() {
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [cart, setCart] = useState<typeof CATALOG_ITEMS>([])

  const categories = ["all", "Fasteners", "Sheets", "Assemblies", "Electronics"]

  const filtered = CATALOG_ITEMS.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const addToCart = (item: (typeof CATALOG_ITEMS)[0]) => {
    setCart([...cart, item])
  }

  return (
    <main className="w-full bg-white">
      <Navbar />

      <section className="pt-20 md:pt-32 pb-12 md:pb-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <h1 className="section-heading text-3xl md:text-4xl">The Catalog</h1>
            {cart.length > 0 && (
              <Link
                href="/checkout"
                className="button-primary flex items-center gap-2 whitespace-nowrap text-sm md:text-base"
              >
                Checkout ({cart.length})
              </Link>
            )}
          </div>

          {/* Filters - horizontal scroll on mobile */}
          <div className="mb-8 md:mb-12 flex gap-2 md:gap-4 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 md:px-4 py-2 rounded-lg font-sans text-xs md:text-sm transition-all whitespace-nowrap ${
                  selectedCategory === cat ? "bg-indigo-950 text-white" : "glass hover:bg-gray-50"
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="mb-8 md:mb-12">
            <input
              type="text"
              placeholder="Search components…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass w-full px-4 md:px-6 py-2 md:py-3 font-sans text-sm md:text-base outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Grid - 1 column mobile, 2 tablet, 3 desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filtered.map((item) => (
              <div key={item.id} className="glass p-4 md:p-6 hover:shadow-lg transition-all duration-300">
                <div className="w-full h-24 md:h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                  <div className="text-indigo-950 font-serif text-xl md:text-2xl">■</div>
                </div>
                <h3 className="font-serif text-base md:text-lg text-indigo-950 mb-2">{item.name}</h3>
                <p className="text-xs md:text-sm text-gray-600 font-sans mb-4">
                  {item.category} • {item.material}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-indigo-950 text-sm md:text-base">{item.price}</span>
                  <button
                    onClick={() => addToCart(item)}
                    className="button-primary text-xs md:text-sm px-2 md:px-3 py-2"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
