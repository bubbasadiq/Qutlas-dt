"use client"

import * as LucideIcons from "lucide-react"

interface IconProps {
  name: string
  size?: number | 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  title?: string
}

const sizeMap = {
  xs: 12,
  sm: 16,
  md: 24,
  lg: 32,
}

const explicitMap: Record<string, keyof typeof LucideIcons> = {
  '3d-printing': 'Box',
  'shopping-cart': 'ShoppingCart',
  'rotate-cw': 'RotateCw',
  'file-text': 'FileText',
  'send': 'Send',
  'alert-triangle': 'AlertTriangle',
  'alert-circle': 'AlertCircle',
  'alert-octagon': 'AlertOctagon',
  'check-circle': 'CheckCircle',
  'x-circle': 'XCircle',
  'chevron-up': 'ChevronUp',
  'chevron-down': 'ChevronDown',
  'chevron-right': 'ChevronRight',
  'info': 'Info',
  'filter': 'Filter',
  'box': 'Box',
  'x': 'X',
}

function toPascalCase(value: string) {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

export function Icon({ name, size = 24, className = "", title }: IconProps) {
  const actualSize = typeof size === 'string' ? sizeMap[size] : size

  const rawName = name.startsWith('icon-') ? name.slice('icon-'.length) : name

  const mapped = explicitMap[rawName]
  const pascal = toPascalCase(rawName)

  const IconComponent =
    (mapped ? (LucideIcons as any)[mapped] : undefined) ?? (LucideIcons as any)[pascal] ?? LucideIcons.HelpCircle

  return <IconComponent size={actualSize} className={className} aria-label={title || rawName} />
}
