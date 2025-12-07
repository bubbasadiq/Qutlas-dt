import type React from "react"
import { cn } from "@/lib/utils"

export interface IconProps extends React.SVGAttributes<SVGSVGElement> {
  name: string
  size?: "xs" | "sm" | "md" | "lg" | "xl"
}

const sizeMap = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-10 h-10",
}

export const Icon: React.FC<IconProps> = ({ name, size = "md", className, ...props }) => {
  return (
    <svg className={cn(sizeMap[size], "inline-block", className)} {...props}>
      <use href={`/design/icons/sprite.svg#${name}`} />
    </svg>
  )
}
