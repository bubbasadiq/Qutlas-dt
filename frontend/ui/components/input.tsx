import React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-[var(--neutral-900)] mb-2">{label}</label>}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 flex items-center text-[var(--neutral-500)] pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full px-4 py-2 rounded-[var(--radius-md)] border border-[var(--neutral-300)] bg-[var(--bg-surface)] text-[var(--neutral-900)] placeholder:text-[var(--neutral-500)] transition-all duration-[var(--motion-mid)] focus:outline-none focus:border-[var(--primary-700)] focus:ring-2 focus:ring-[var(--primary-100)]",
              icon && "pl-10",
              error && "border-[var(--error)] focus:ring-red-100",
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-sm text-[var(--error)]">{error}</p>}
        {hint && !error && <p className="mt-1 text-sm text-[var(--neutral-500)]">{hint}</p>}
      </div>
    )
  },
)

Input.displayName = "Input"
