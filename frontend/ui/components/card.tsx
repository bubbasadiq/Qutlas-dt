import React from "react"
import { cn } from "@/lib/utils"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outlined" | "elevated"
  padding?: "sm" | "md" | "lg"
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", padding = "md", ...props }, ref) => {
    const variants = {
      default: "bg-[var(--bg-surface)] border border-[var(--neutral-100)]",
      outlined: "bg-[var(--bg-surface-alt)] border-2 border-[var(--primary-300)]",
      elevated: "bg-[var(--bg-surface)] shadow-[var(--shadow-1)]",
    }

    const paddings = {
      sm: "p-3",
      md: "p-6",
      lg: "p-8",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[var(--radius-lg)] transition-all duration-[var(--motion-mid)]",
          variants[variant],
          paddings[padding],
          className,
        )}
        {...props}
      />
    )
  },
)

Card.displayName = "Card"

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("pb-4 border-b border-[var(--neutral-100)]", className)} {...props} />
)

export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("text-xl font-semibold text-[var(--neutral-900)]", className)} {...props} />
)

export const CardDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-[var(--neutral-500)] mt-1", className)} {...props} />
)

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("pt-4", className)} {...props} />
)

export const CardFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex justify-between pt-6 border-t border-[var(--neutral-100)]", className)} {...props} />
)
