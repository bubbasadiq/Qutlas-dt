"use client"

import React, { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { supabase } = useAuth() // optional: if you want to use context, or import supabase directly

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setMessage("")

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`
      })
      if (error) throw error
      setMessage("Check your inbox for the password reset link.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-50)]">
      <form className="max-w-md w-full p-8 bg-white rounded shadow-lg space-y-5" onSubmit={handleReset}>
        <h2 className="text-2xl font-semibold text-center">Reset Password</h2>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {message && <p className="text-green-600 text-sm">{message}</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Sending..." : "Send Reset Link"}
        </Button>

        <p className="text-sm text-center">
          Remember your password?{" "}
          <Link href="/auth/login" className="text-[var(--primary-700)] hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}
