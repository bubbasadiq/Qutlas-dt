"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Icon } from "@/components/ui/icon"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "layout" },
    { href: "/studio", label: "Studio", icon: "cube" },
    { href: "/catalog", label: "Catalog", icon: "catalog" },
    { href: "/pricing", label: "Pricing", icon: "dollar-sign" },
  ]

  return (
    <>
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[var(--neutral-200)]">
        <Link href="/" className="flex items-center gap-2">
          <Icon name="logo" size={28} />
          <span className="font-semibold">Qutlas</span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-[var(--bg-100)] rounded-lg"
          >
            <Icon name={isOpen ? "x" : "menu"} size={24} />
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 top-[61px] bg-white z-40">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  pathname === item.href
                    ? "bg-[var(--primary-100)] text-[var(--primary-700)]"
                    : "hover:bg-[var(--bg-100)]"
                }`}
              >
                <Icon name={item.icon} size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
            <div className="border-t border-[var(--neutral-200)] my-4" />
            <button
              onClick={() => {
                fetch('/api/auth/logout', { method: 'POST' })
                window.location.href = '/'
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[var(--bg-100)] w-full text-left text-red-600"
            >
              <Icon name="log-out" size={20} />
              <span className="font-medium">Sign Out</span>
            </button>
          </nav>
        </div>
      )}
    </>
  )
}
