"use client"

import React, { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function VerifyEmailPage() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    // Check if user is already authenticated (email verified)
    if (user) {
      // Check for pending intent or redirect path after verification
      if (typeof window !== "undefined") {
        const pendingIntent = sessionStorage.getItem("qutlas_pending_intent_after_verify")
        const redirectPath = sessionStorage.getItem("redirectAfterAuth_after_verify")
        
        // Clean up the after_verify items
        sessionStorage.removeItem("qutlas_pending_intent_after_verify")
        sessionStorage.removeItem("redirectAfterAuth_after_verify")
        
        if (pendingIntent) {
          router.push(`/studio?intent=${pendingIntent}`)
          return
        }
        
        if (redirectPath) {
          router.push(redirectPath)
          return
        }
      }
      
      // Default redirect to dashboard
      router.push("/dashboard")
    }
  }, [user, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-50)]">
      <div className="max-w-md p-8 bg-white shadow-lg rounded text-center">
        <h1 className="text-2xl font-semibold mb-4">Verify Your Email</h1>
        <p className="text-[var(--neutral-500)] mb-4">
          We sent a confirmation email to your inbox. Click the link in the email to verify your account.
        </p>
        <Link href="/auth/login" className="text-[var(--primary-700)] hover:underline">
          Back to Login
        </Link>
      </div>
    </div>
  )
}
