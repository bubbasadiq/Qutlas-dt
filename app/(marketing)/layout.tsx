import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo variant="blue" size="md" href="/" />

          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/catalog"
              className="text-sm font-medium text-[var(--neutral-600)] hover:text-[var(--primary-700)] transition-colors"
            >
              Catalog
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-[var(--neutral-600)] hover:text-[var(--primary-700)] transition-colors"
            >
              Pricing
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="text-[var(--neutral-700)]">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm" className="bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>
      {children}
    </div>
  )
}
