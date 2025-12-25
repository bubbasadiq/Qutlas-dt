"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { useIsMobile, useIsTablet, useIsDesktop } from "@/hooks/use-media-query"

interface ResponsiveContainerProps {
  children: {
    mobile?: React.ReactNode
    tablet?: React.ReactNode
    desktop?: React.ReactNode
    default?: React.ReactNode
  }
  className?: string
}

export function ResponsiveContainer({ children, className }: ResponsiveContainerProps) {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const isDesktop = useIsDesktop()

  if (isMobile && children.mobile) {
    return <div className={className}>{children.mobile}</div>
  }

  if (isTablet && children.tablet) {
    return <div className={className}>{children.tablet}</div>
  }

  if (isDesktop && children.desktop) {
    return <div className={className}>{children.desktop}</div>
  }

  return <div className={className}>{children.default || children.mobile || children.tablet || children.desktop}</div>
}

// Breakpoint-aware container
interface BreakpointContainerProps {
  children: React.ReactNode
  className?: string
  showMobile?: boolean
  showTablet?: boolean
  showDesktop?: boolean
}

export function BreakpointContainer({
  children,
  className,
  showMobile,
  showTablet,
  showDesktop,
}: BreakpointContainerProps) {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const isDesktop = useIsDesktop()

  const shouldShow =
    (showMobile && isMobile) ||
    (showTablet && isTablet) ||
    (showDesktop && isDesktop) ||
    (!showMobile && !showTablet && !showDesktop)

  if (!shouldShow) {
    return null
  }

  return <div className={className}>{children}</div>
}

// Flex layout with responsive directions
interface ResponsiveFlexProps {
  children: React.ReactNode
  className?: string
  direction?: {
    mobile?: string
    tablet?: string
    desktop?: string
  }
  gap?: {
    mobile?: string
    tablet?: string
    desktop?: string
  }
}

export function ResponsiveFlex({
  children,
  className,
  direction = { mobile: "flex-col", tablet: "md:flex-row", desktop: "lg:flex-row" },
  gap,
}: ResponsiveFlexProps) {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()

  const getClass = (value: string | undefined, fallback: string) =>
    value || fallback

  return (
    <div
      className={cn(
        "flex",
        isMobile
          ? getClass(direction.mobile, "flex-col")
          : isTablet
          ? getClass(direction.tablet, "md:flex-row")
          : getClass(direction.desktop, "lg:flex-row"),
        gap &&
          (isMobile
            ? getClass(gap.mobile, "gap-2")
            : isTablet
            ? getClass(gap.tablet, "md:gap-4")
            : getClass(gap.desktop, "lg:gap-4")),
        className
      )}
    >
      {children}
    </div>
  )
}

// Width-aware container
interface ResponsiveWidthProps {
  children: React.ReactNode
  className?: string
  widths?: {
    mobile?: string
    tablet?: string
    desktop?: string
  }
}

export function ResponsiveWidth({
  children,
  className,
  widths = { mobile: "w-full", tablet: "md:w-1/2", desktop: "lg:w-80" },
}: ResponsiveWidthProps) {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()

  const widthClass = isMobile
    ? widths.mobile || "w-full"
    : isTablet
    ? widths.tablet || "md:w-1/2"
    : widths.desktop || "lg:w-80"

  return <div className={cn(widthClass, className)}>{children}</div>
}
