'use client'

import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  className,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [contentHeight, setContentHeight] = useState<number | 'auto'>(0)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (contentRef.current) {
      if (isOpen) {
        setContentHeight(contentRef.current.scrollHeight)
        const timer = setTimeout(() => {
          setContentHeight('auto')
        }, 200)
        return () => clearTimeout(timer)
      } else {
        // First set to scrollHeight so it can animate down from there
        if (contentHeight === 'auto') {
          setContentHeight(contentRef.current.scrollHeight)
          // Small delay to ensure the browser has a chance to set the height before we change it to 0
          const timer = setTimeout(() => {
            setContentHeight(0)
          }, 10)
          return () => clearTimeout(timer)
        } else {
          setContentHeight(0)
        }
      }
    }
  }, [isOpen])

  return (
    <div className={cn('flex flex-col border-b border-[var(--neutral-100)] last:border-b-0', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between py-3 w-full text-left group"
      >
        <span className="text-sm font-medium text-[var(--neutral-700)] group-hover:text-[var(--primary-600)] transition-colors">
          {title}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-[var(--neutral-400)] transition-transform duration-200 ease-in-out',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <div
        ref={contentRef}
        style={{ height: contentHeight }}
        className="overflow-hidden transition-all duration-200 ease-in-out"
      >
        <div className="pb-4 pt-1">
          {children}
        </div>
      </div>
    </div>
  )
}
