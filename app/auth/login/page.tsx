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

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      await login(email, password)
      
      // Check if there's a pending intent or redirect path
      if (typeof window !== "undefined") {
        const pendingIntent = sessionStorage.getItem("qutlas_pending_intent")
        const redirectPath = sessionStorage.getItem("redirectAfterAuth")
        
        if (pendingIntent) {
          // Redirect to studio with the pending intent
          sessionStorage.removeItem("qutlas_pending_intent")
          router.push(`/studio?intent=${pendingIntent}`)
          return
        }
        
        if (redirectPath) {
          // Redirect to the originally requested page
          sessionStorage.removeItem("redirectAfterAuth")
          router.push(redirectPath)
          return
        }
      }
      
      // Default redirect to dashboard
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
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
            <h2 className="text-3xl font-serif text-[var(--neutral-900)] mb-2">Welcome back</h2>
            <p className="text-[var(--neutral-500)]">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[var(--neutral-700)]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-white border-[var(--neutral-200)] focus:border-[var(--primary-500)] focus:ring-[var(--primary-500)]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[var(--neutral-700)]">
                  Password
                </Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-[var(--primary-700)] hover:text-[var(--primary-800)]"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 bg-white border-[var(--neutral-200)] focus:border-[var(--primary-500)] focus:ring-[var(--primary-500)]"
              />
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
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[var(--neutral-500)]">
              Don't have an account?{" "}
              <Link
                href="/auth/signup"
                className="text-[var(--primary-700)] hover:text-[var(--primary-800)] font-medium"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
