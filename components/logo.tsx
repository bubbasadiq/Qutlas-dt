import Image from "next/image"
import Link from "next/link"

interface LogoProps {
  variant?: "blue" | "orange" | "white"
  size?: "sm" | "md" | "lg"
  href?: string
  className?: string
}

const sizes = {
  sm: { width: 80, height: 24 },
  md: { width: 120, height: 36 },
  lg: { width: 160, height: 48 },
}

export function Logo({ variant = "blue", size = "md", href = "/", className = "" }: LogoProps) {
  const logoSrc = variant === "orange" || variant === "white" ? "/images/logo-orange.png" : "/images/logo-blue.png"

  const dimensions = sizes[size]

  const logoImage = (
    <Image
      src={logoSrc || "/placeholder.svg"}
      alt="Qutlas"
      width={dimensions.width}
      height={dimensions.height}
      className={`object-contain ${className}`}
      priority
    />
  )

  if (href) {
    return (
      <Link href={href} className="flex items-center">
        {logoImage}
      </Link>
    )
  }

  return logoImage
}
