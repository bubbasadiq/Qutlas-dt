import Image from "next/image"
import Link from "next/link"

export default function Footer() {
  return (
    <footer className="py-8 md:py-16" style={{ backgroundColor: "#2a2a72" }}>
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-8 mb-8 items-start">
          {/* Logo Section */}
          <div>
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Frame%206-dHR0YgW92ZxpUsgjQymaChkuLzI4ZD.png"
              alt="QUTLAS"
              width={160}
              height={60}
              className="mb-4 h-10 md:h-auto w-auto"
            />
            <p className="text-white/70 text-xs md:text-sm font-sans font-light">Global network, local making.</p>
          </div>

          {/* Links Section */}
          <div className="flex flex-wrap gap-3 md:gap-6 md:justify-center font-sans text-xs md:text-sm">
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

          {/* Location Section */}
          <div className="text-left md:text-right text-xs md:text-sm font-sans text-white/70 font-light">
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
