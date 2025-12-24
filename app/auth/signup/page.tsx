"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { Logo } from "@/components/logo"

export default function SignupPage() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", company: "" })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { signup } = useAuth()
  const router = useRouter()

  const handleChange = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }))

  const handleSignup = async (e: React.FormEvent) => {
   e.preventDefault()
   setIsLoading(true)
   setError("")

   try {
     // Validate email format
     if (!formData.email.includes('@') || !formData.email.includes('.')) {
       throw new Error('Please enter a valid email address.')
     }

     // Validate password strength
     if (formData.password.length < 8) {
       throw new Error('Password must be at least 8 characters.')
     }

     await signup(
       formData.email,
       formData.password,
       formData.name,
       formData.company
     )

     // Store pending intent and redirect path for after email verification
     if (typeof window !== "undefined") {
       const pendingIntent = sessionStorage.getItem("qutlas_pending_intent")
       const redirectPath = sessionStorage.getItem("redirectAfterAuth")

       // Store these in sessionStorage to be used after email verification
       if (pendingIntent) {
         sessionStorage.setItem("qutlas_pending_intent_after_verify", pendingIntent)
       }
       if (redirectPath) {
         sessionStorage.setItem("redirectAfterAuth_after_verify", redirectPath)
       }
     }

     router.push("/auth/verify-email?email=" + encodeURIComponent(formData.email))
   } catch (err) {
     // The error is already user-friendly from the auth context
     setError(err instanceof Error ? err.message : "Signup failed. Please try again.")
   } finally {
     setIsLoading(false)
   }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--primary-700)] items-center justify-center p-12">
        <div className="max-w-md">
          <div className="mb-12">
            <Logo variant="orange" size="lg" href="/" />
          </div>
          <h1 className="text-4xl font-serif text-white mb-6 leading-tight">
            Design. Validate. <span className="text-[var(--accent-500)]">Produce.</span>
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Transform your ideas into manufactured parts. Upload your design, get instant manufacturability feedback,
            and route to certified production hubs worldwide.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[var(--bg-50)]">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="mb-10 lg:hidden">
            <Logo variant="blue" size="md" href="/" />
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-serif text-[var(--neutral-900)] mb-2">Create your account</h2>
            <p className="text-[var(--neutral-500)]">Start designing and manufacturing in minutes</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[var(--neutral-700)]">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                  className="h-12 bg-white border-[var(--neutral-200)] focus:border-[var(--primary-500)] focus:ring-[var(--primary-500)]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company" className="text-[var(--neutral-700)]">Company</Label>
                <Input
                  id="company"
                  placeholder="Acme Inc"
                  value={formData.company}
                  onChange={(e) => handleChange("company", e.target.value)}
                  required
                  className="h-12 bg-white border-[var(--neutral-200)] focus:border-[var(--primary-500)] focus:ring-[var(--primary-500)]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[var(--neutral-700)]">Work Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
                className="h-12 bg-white border-[var(--neutral-200)] focus:border-[var(--primary-500)] focus:ring-[var(--primary-500)]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[var(--neutral-700)]">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                required
                className="h-12 bg-white border-[var(--neutral-200)] focus:border-[var(--primary-500)] focus:ring-[var(--primary-500)]"
              />
              <p className="text-xs text-[var(--neutral-400)]">Must be at least 8 characters</p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white font-medium"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[var(--neutral-500)]">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-[var(--primary-700)] hover:text-[var(--primary-800)] font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
