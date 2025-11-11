"use client"

import Link from "next/link"
import { useState } from "react"
import Image from "next/image"

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (typeof window !== "undefined") {
    window.addEventListener("scroll", () => setScrolled(window.scrollY > 20))
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 glass`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Frame%205%20%281%29-6oB3D82XKDb8iDQRnxG1fFtgbUa3qd.png"
            alt="QUTLAS"
            width={80}
            height={32}
            priority
            className="h-6 md:h-8 w-auto"
          />
        </Link>

        <button className="md:hidden text-indigo-950 text-2xl" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          ☰
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/catalog"
            className="text-indigo-950 font-sans font-medium hover:text-amber-500 transition-colors duration-300"
          >
            Catalog
          </Link>
          <Link
            href="/workspace"
            className="text-indigo-950 font-sans font-medium hover:text-amber-500 transition-colors duration-300"
          >
            Workspace
          </Link>
          <Link
            href="/learn"
            className="text-indigo-950 font-sans font-medium hover:text-amber-500 transition-colors duration-300"
          >
            Learn
          </Link>
          <Link
            href="/login"
            className="button-secondary text-sm px-4 py-2 hover:bg-amber-500 hover:text-white transition-colors duration-300"
          >
            Login
          </Link>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 md:hidden">
            <div className="flex flex-col gap-4 p-4">
              <Link
                href="/catalog"
                className="text-indigo-950 font-sans font-medium hover:text-amber-500 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Catalog
              </Link>
              <Link
                href="/workspace"
                className="text-indigo-950 font-sans font-medium hover:text-amber-500 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Workspace
              </Link>
              <Link
                href="/learn"
                className="text-indigo-950 font-sans font-medium hover:text-amber-500 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Learn
              </Link>
              <Link
                href="/login"
                className="button-secondary text-sm px-4 py-2 hover:bg-amber-500 hover:text-white transition-colors block text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
