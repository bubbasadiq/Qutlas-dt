"use client"

interface IconProps {
  name: string
  size?: number
  className?: string
  title?: string
}

export function Icon({ name, size = 24, className = "", title }: IconProps) {
  const iconId = name.startsWith("icon-") ? name : `icon-${name}`

  return (
    <svg
      width={size}
      height={size}
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
