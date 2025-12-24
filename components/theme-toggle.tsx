"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled className="w-9 h-9">
        <Icon name="sun" size={18} />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-9 h-9"
    >
      {theme === "dark" ? (
        <Icon name="sun" size={18} />
      ) : (
        <Icon name="moon" size={18} />
      )}
    </Button>
  )
}
