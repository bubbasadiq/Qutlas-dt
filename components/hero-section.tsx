"use client"

import { useState } from "react"
import Link from "next/link"

export default function HeroSection() {
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  return (
    <section
      className="min-h-screen w-full flex items-center justify-center pt-20 pb-20 overflow-hidden relative"
      style={{
        backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%20Nov%2011%2C%202025%2C%2011_00_55%20AM-7322ls4kojU3FiPLdrWbhua8eS6rp8.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />

      <div className="relative z-10 max-w-2xl px-6">
        <div className="glass bg-white/10 border border-white/20 rounded-2xl px-8 py-12 backdrop-blur-sm">
          <h1 className="text-6xl md:text-7xl font-serif font-light text-white mb-4">
            Build Yours.
            <span className="text-amber-500"> Become.</span>
          </h1>

          <p className="text-lg text-white font-sans font-light mb-12">
            Turn ideas into parts, faster than ever before.
          </p>

          <div className="mb-8">
            <div
              className={`mx-auto transition-all duration-300 px-6 py-4 bg-white rounded-lg flex items-center gap-2 ${searchFocused ? "ring-2 ring-amber-500" : ""}`}
            >
              <input
                type="text"
                placeholder="Search components, tools, or materials…"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="flex-1 bg-transparent font-sans text-indigo-950 placeholder-gray-400 outline-none"
              />
              <Link
                href={`/catalog?search=${encodeURIComponent(searchValue)}`}
                className="px-4 py-2 bg-amber-500 text-white font-sans font-medium rounded hover:bg-amber-600 transition-colors text-sm whitespace-nowrap"
              >
                Search Catalog
              </Link>
            </div>
          </div>

          {/* CTA Button */}
          <Link
            href="/workspace"
            className="inline-block px-8 py-3 bg-amber-500 text-white font-sans font-medium rounded-lg hover:bg-amber-600 transition-colors duration-300"
          >
            Open Workspace →
          </Link>

          {/* Scroll Cue */}
          <div className="animate-bounce text-white text-center">
            <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}
