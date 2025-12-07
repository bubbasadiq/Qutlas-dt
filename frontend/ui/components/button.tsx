import React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconPosition = "left",
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-[var(--motion-mid)] rounded-[var(--radius-md)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary-700)] disabled:opacity-50 disabled:cursor-not-allowed"

    const variants = {
      primary: "bg-[var(--primary-700)] text-white hover:bg-[var(--primary-900)] active:bg-[var(--primary-900)]",
      secondary:
        "bg-[var(--neutral-100)] text-[var(--neutral-900)] hover:bg-[var(--neutral-200)] border border-[var(--neutral-300)]",
      outline: "border-2 border-[var(--primary-700)] text-[var(--primary-700)] hover:bg-[var(--primary-100)]",
      ghost: "text-[var(--neutral-700)] hover:bg-[var(--neutral-100)] hover:text-[var(--neutral-900)]",
      danger: "bg-[var(--error)] text-white hover:bg-red-600 active:bg-red-700",
    }

    const sizes = {
      sm: "px-3 py-1.5 text-sm gap-2",
      md: "px-4 py-2 text-base gap-2",
      lg: "px-6 py-3 text-lg gap-3",
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {icon && iconPosition === "left" && !loading && <span className="flex items-center">{icon}</span>}
        {children}
        {icon && iconPosition === "right" && !loading && <span className="flex items-center">{icon}</span>}
      </button>
    )
  },
)

Button.displayName = "Button"
