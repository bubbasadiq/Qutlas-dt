"use client"

import { useState } from "react"
import Link from "next/link"

export default function HeroSection() {
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  return (
    <section
      className="min-h-screen w-full flex items-center justify-center pt-24 md:pt-20 pb-12 md:pb-20 overflow-hidden relative"
      style={{
        backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%20Nov%2011%2C%202025%2C%2011_00_55%20AM-7322ls4kojU3FiPLdrWbhua8eS6rp8.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />

      <div className="relative z-10 max-w-2xl px-4 md:px-6">
        <div className="glass bg-white/10 border border-white/20 rounded-xl md:rounded-2xl px-4 md:px-8 py-8 md:py-12">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-light text-white mb-3 md:mb-4 leading-tight">
            Build Yours.
            <span className="text-amber-500"> Become.</span>
          </h1>

          <p className="text-base md:text-lg text-white font-sans font-light mb-8 md:mb-12">
            Turn ideas into parts, faster than ever before.
          </p>

          <div className="mb-8">
            <div
              className={`transition-all duration-300 px-3 md:px-6 py-3 md:py-4 bg-white rounded-lg flex flex-col md:flex-row items-stretch md:items-center gap-2 ${searchFocused ? "ring-2 ring-amber-500" : ""}`}
            >
              <input
                type="text"
                placeholder="Search components…"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="flex-1 bg-transparent font-sans text-sm md:text-base text-indigo-950 placeholder-gray-400 outline-none"
              />
              <Link
                href={`/catalog?search=${encodeURIComponent(searchValue)}`}
                className="px-4 py-2 bg-amber-500 text-white font-sans font-medium rounded hover:bg-amber-600 transition-colors text-sm whitespace-nowrap text-center"
              >
                Search
              </Link>
            </div>
          </div>

          <Link
            href="/workspace"
            className="inline-block px-6 md:px-8 py-2 md:py-3 bg-amber-500 text-white font-sans font-medium rounded-lg hover:bg-amber-600 transition-colors duration-300 text-sm md:text-base"
          >
            Open Workspace →
          </Link>
        </div>
      </div>
    </section>
  )
}
