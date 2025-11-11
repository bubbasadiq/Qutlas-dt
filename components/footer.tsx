import Image from "next/image"
import Link from "next/link"

export default function Footer() {
  return (
    <footer className="py-16" style={{ backgroundColor: "#2a2a72" }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-3 gap-8 mb-8 items-start">
          {/* Left: Logo */}
          <div>
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Frame%206-dHR0YgW92ZxpUsgjQymaChkuLzI4ZD.png"
              alt="QUTLAS"
              width={160}
              height={60}
              className="mb-4"
            />
            <p className="text-white/70 text-sm font-sans font-light">Global network, local making.</p>
          </div>

          {/* Center: Links */}
          <div className="flex gap-6 justify-center font-sans text-sm">
            <Link href="/catalog" className="text-white/70 hover:text-amber-500 transition-colors font-light">
              Catalog
            </Link>
            <Link href="/workspace" className="text-white/70 hover:text-amber-500 transition-colors font-light">
              Workspace
            </Link>
            <Link href="/learn" className="text-white/70 hover:text-amber-500 transition-colors font-light">
              Learn
            </Link>
          </div>

          {/* Right: Legal & Location */}
          <div className="text-right text-sm font-sans text-white/70 font-light">
            <p>Made in Manchester</p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 text-center text-xs text-white/50 font-sans font-light">
          © 2025 QUTLAS. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
