"use client"

export const dynamic = "force-dynamic"

import React, { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabaseClient"

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [status, setStatus] = useState("verifying")
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    // Extract email and token from URL
    const emailParam = searchParams.get("email")
    const tokenParam = searchParams.get("token")
    const typeParam = searchParams.get("type")
    const onboardingParam = searchParams.get("onboarding")

    if (emailParam) {
      setEmail(emailParam)
    }

    // If user is already authenticated (email verified), redirect appropriately
    if (user) {
      // Check for pending intent or redirect path after verification
      if (typeof window !== "undefined") {
        const pendingIntent = sessionStorage.getItem("qutlas_pending_intent_after_verify")
        const redirectPath = sessionStorage.getItem("redirectAfterAuth_after_verify")

        // Clean up the after_verify items
        sessionStorage.removeItem("qutlas_pending_intent_after_verify")
        sessionStorage.removeItem("redirectAfterAuth_after_verify")

        if (pendingIntent) {
          router.push(`/studio?intent=${pendingIntent}${onboardingParam === 'true' ? '&onboarding=true' : ''}`)
          return
        }

        if (redirectPath) {
          router.push(`${redirectPath}${redirectPath.includes('?') ? '&' : '?'}onboarding=true`)
          return
        }
      }

      // Default redirect to dashboard
      router.push(`/dashboard${onboardingParam === 'true' ? '?onboarding=true' : ''}`)
      return
    }

    // Handle email verification token if present
    const verifyEmailToken = async () => {
      if (tokenParam && typeParam && emailParam) {
        try {
          setStatus("verifying")
          const { error } = await supabase.auth.verifyOtp({
            token: tokenParam,
            type: typeParam as "email" | "phone" | "magiclink",
            email: emailParam
          })

          if (error) {
            throw error
          }

          // Verification successful
          setStatus("success")
          
          // Give a moment for the auth state to update, then redirect
          setTimeout(() => {
            // Check for pending intent or redirect path after verification
            if (typeof window !== "undefined") {
              const pendingIntent = sessionStorage.getItem("qutlas_pending_intent_after_verify")
              const redirectPath = sessionStorage.getItem("redirectAfterAuth_after_verify")

              // Clean up the after_verify items
              sessionStorage.removeItem("qutlas_pending_intent_after_verify")
              sessionStorage.removeItem("redirectAfterAuth_after_verify")

              if (pendingIntent) {
                router.push(`/studio?intent=${pendingIntent}${onboardingParam === 'true' ? '&onboarding=true' : ''}`)
                return
              }

              if (redirectPath) {
                router.push(`${redirectPath}${redirectPath.includes('?') ? '&' : '?'}onboarding=true`)
                return
              }
            }

            // Default redirect to dashboard
            router.push(`/dashboard${onboardingParam === 'true' ? '?onboarding=true' : ''}`)
          }, 2000)

        } catch (err) {
          console.error("Email verification error:", err)
          let errorMessage = "Failed to verify email. Please try again."
          if (err instanceof Error) {
            if (err.message.includes("token")) {
              errorMessage = "The verification link has expired. Please request a new one."
            } else if (err.message.includes("already")) {
              errorMessage = "This email has already been verified. You can now sign in."
            }
          }
          setError(errorMessage)
          setStatus("error")
        }
      } else if (emailParam) {
        // No token in URL, just show the verification pending state
        setStatus("pending")
      } else {
        // No email parameter, redirect to login
        router.push("/auth/login")
      }
    }

    verifyEmailToken()
  }, [user, router, searchParams])

  const handleResendEmail = async () => {
    if (!email) return

    setIsResending(true)
    setError("")

    try {
      const redirectUrl = (typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || '')
      
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${redirectUrl}/auth/verify-email`
        }
      })

      if (error) throw error

      setStatus("resent")
    } catch (err) {
      console.error("Resend error:", err)
      let errorMessage = "Failed to resend verification email. Please try again."
      if (err instanceof Error) {
        if (err.message.includes("rate limit")) {
          errorMessage = "Too many attempts. Please wait before trying again."
        } else if (err.message.includes("already")) {
          errorMessage = "This email has already been verified. You can now sign in."
        }
      }
      setError(errorMessage)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-50)]">
      <div className="max-w-md p-8 bg-white shadow-lg rounded text-center">
        {status === "verifying" && (
          <>
            <h1 className="text-2xl font-semibold mb-4">Verifying Your Email</h1>
            <p className="text-[var(--neutral-500)] mb-6">
              Please wait while we verify your email address...
            </p>
            <div className="w-8 h-8 border-4 border-[var(--primary-700)] border-t-transparent rounded-full animate-spin mx-auto"></div>
          </>
        )}

        {status === "success" && (
          <>
            <h1 className="text-2xl font-semibold mb-4">Email Verified!</h1>
            <p className="text-[var(--neutral-500)] mb-6">
              Your email has been successfully verified. Redirecting you to your dashboard...
            </p>
            <div className="w-8 h-8 border-4 border-[var(--primary-700)] border-t-transparent rounded-full animate-spin mx-auto"></div>
          </>
        )}

        {status === "pending" && (
          <>
            <h1 className="text-2xl font-semibold mb-4">Verify Your Email</h1>
            <p className="text-[var(--neutral-500)] mb-6">
              We sent a confirmation email to <strong>{email}</strong>. Click the link in the email to verify your account.
            </p>
            <p className="text-[var(--neutral-500)] mb-6">
              Didn't receive the email? Check your spam folder or request a new verification email.
            </p>
            <Button
              onClick={handleResendEmail}
              disabled={isResending}
              className="bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white"
            >
              {isResending ? "Sending..." : "Resend Verification Email"}
            </Button>
          </>
        )}

        {status === "resent" && (
          <>
            <h1 className="text-2xl font-semibold mb-4">Verification Email Sent</h1>
            <p className="text-[var(--neutral-500)] mb-6">
              We've sent a new verification email to <strong>{email}</strong>. Please check your inbox.
            </p>
            <Button
              onClick={handleResendEmail}
              disabled={isResending}
              className="bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white"
            >
              {isResending ? "Sending..." : "Resend Verification Email"}
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-2xl font-semibold mb-4 text-red-600">Verification Failed</h1>
            <p className="text-red-500 mb-6">
              {error}
            </p>
            {error.includes("expired") && (
              <Button
                onClick={handleResendEmail}
                disabled={isResending}
                className="bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white"
              >
                {isResending ? "Sending..." : "Request New Verification Email"}
              </Button>
            )}
            <div className="mt-4">
              <Link href="/auth/login" className="text-[var(--primary-700)] hover:underline">
                Back to Login
              </Link>
            </div>
          </>
        )}

        {!user && status !== "error" && (
          <div className="mt-6">
            <Link href="/auth/login" className="text-[var(--primary-700)] hover:underline">
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}