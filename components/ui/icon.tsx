"use client"

interface IconProps {
  name: string
  size?: number | 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  title?: string
}

export function Icon({ name, size = 24, className = "", title }: IconProps) {
  const iconId = name.startsWith("icon-") ? name : `icon-${name}`
  
  const sizeMap = {
    xs: 12,
    sm: 16,
    md: 24,
    lg: 32,
  }
  
  const actualSize = typeof size === 'string' ? sizeMap[size] : size

  return (
    <svg
      width={actualSize}
      height={actualSize}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      role="img"
      aria-label={title || name}
    >
      <use href={`/design/icons/sprite.svg#${iconId}`} />
    </svg>
  )
}
