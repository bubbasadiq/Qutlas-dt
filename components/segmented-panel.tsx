'use client'

import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import * as Icons from 'lucide-react'
import { cn } from '@/lib/utils'

interface SegmentedPanelProps {
  title: string
  icon?: keyof typeof Icons
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
  className?: string
}

export function SegmentedPanel({
  title,
  icon,
  isOpen,
  onToggle,
  children,
  className,
}: SegmentedPanelProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState<number | 'auto'>(0)
  const IconComponent = icon ? (Icons[icon] as React.ElementType) : null

  useEffect(() => {
    if (contentRef.current) {
      if (isOpen) {
        setContentHeight(contentRef.current.scrollHeight)
        const timer = setTimeout(() => {
          setContentHeight('auto')
        }, 200)
        return () => clearTimeout(timer)
      } else {
        if (contentHeight === 'auto') {
          setContentHeight(contentRef.current.scrollHeight)
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
    <div className={cn('border-b border-[var(--neutral-200)] bg-white', className)}>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'w-full flex items-center justify-between px-4 py-4',
          'hover:bg-[var(--neutral-50)] transition-colors duration-200 ease-in-out',
          'focus:outline-none group'
        )}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          {IconComponent && (
            <IconComponent
              className="w-5 h-5 text-[var(--neutral-500)] group-hover:text-[var(--primary-600)] transition-colors duration-200"
            />
          )}
          <span className="text-[15px] font-semibold text-[var(--neutral-800)]">
            {title}
          </span>
        </div>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-[var(--neutral-400)] transition-transform duration-200 ease-in-out',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      <div
        ref={contentRef}
        style={{ height: contentHeight }}
        className="overflow-hidden transition-all duration-200 ease-in-out"
      >
        <div className="px-4 pb-6 pt-0">
          {children}
        </div>
      </div>
    </div>
  )
}

interface SegmentedPanelGroupProps {
  children: React.ReactNode
  allowMultipleOpen?: boolean
  className?: string
}

export function SegmentedPanelGroup({
  children,
  allowMultipleOpen = false,
  className,
}: SegmentedPanelGroupProps) {
  const [openIndexes, setOpenIndexes] = useState<Set<number>>(new Set([0])) // Default first open

  const handleToggle = (index: number) => {
    setOpenIndexes((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        if (!allowMultipleOpen) {
          next.clear()
        }
        next.add(index)
      }
      return next
    })
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement<SegmentedPanelProps>(child)) {
          return React.cloneElement(child, {
            isOpen: openIndexes.has(index),
            onToggle: () => handleToggle(index),
          })
        }
        return child
      })}
    </div>
  )
}
