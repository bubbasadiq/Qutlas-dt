"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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
      await signup(formData.email, formData.password, formData.name, formData.company)
      router.push("/auth/verify-email?email=" + encodeURIComponent(formData.email))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-50)]">
      <form className="max-w-md w-full p-8 bg-white rounded shadow-lg space-y-5" onSubmit={handleSignup}>
        <h2 className="text-2xl font-semibold text-center">Create your account</h2>

        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="company">Company</Label>
          <Input id="company" value={formData.company} onChange={(e) => handleChange("company", e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={formData.password} onChange={(e) => handleChange("password", e.target.value)} required />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <Button type="submit" disabled={isLoading}>{isLoading ? "Creating..." : "Create Account"}</Button>

        <p className="text-sm text-center">
          Already have an account? <Link href="/auth/login" className="text-[var(--primary-700)]">Sign in</Link>
        </p>
      </form>
    </div>
  )
}
