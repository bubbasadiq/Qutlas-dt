"use client"

import type React from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export interface TabProps {
  label: string
  value: string
  children: React.ReactNode
  icon?: React.ReactNode
}

export interface TabsProps {
  tabs: TabProps[]
  defaultValue?: string
  onChange?: (value: string) => void
}

export const Tabs: React.FC<TabsProps> = ({ tabs, defaultValue, onChange }) => {
  const [activeTab, setActiveTab] = useState(defaultValue || tabs[0]?.value)

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    onChange?.(value)
  }

  return (
    <div>
      {/* Tab list */}
      <div className="flex gap-1 border-b border-[var(--neutral-200)]">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={cn(
              "px-4 py-3 font-medium transition-all duration-[var(--motion-mid)] flex items-center gap-2",
              activeTab === tab.value
                ? "text-[var(--primary-700)] border-b-2 border-[var(--primary-700)]"
                : "text-[var(--neutral-500)] hover:text-[var(--neutral-700)]",
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="pt-4">{tabs.find((t) => t.value === activeTab)?.children}</div>
    </div>
  )
}
