"use client"

import React, { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/loading-spinner"
import { toast } from "sonner"

export const dynamic = 'force-dynamic'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [status, setStatus] = useState("verifying")
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    const emailParam = searchParams.get("email")
    const tokenParam = searchParams.get("token")
    const typeParam = searchParams.get("type")

    if (emailParam) {
      setEmail(emailParam)
    }

    if (user) {
      if (typeof window !== "undefined") {
        const pendingIntent = sessionStorage.getItem("qutlas_pending_intent_after_verify")
        const redirectPath = sessionStorage.getItem("redirectAfterAuth_after_verify")

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

      router.push("/dashboard")
      return
    }

    const verifyEmailToken = async () => {
      if (tokenParam && typeParam && emailParam) {
        try {
          setStatus("verifying")
          const response = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: tokenParam, type: typeParam, email: emailParam }),
          })

          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error || 'Verification failed')
          }

          setStatus("success")
          
          setTimeout(() => {
            if (typeof window !== "undefined") {
              const pendingIntent = sessionStorage.getItem("qutlas_pending_intent_after_verify")
              const redirectPath = sessionStorage.getItem("redirectAfterAuth_after_verify")

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

            router.push("/dashboard")
          }, 2000)

        } catch (err) {
          console.error("Email verification error:", err)
          let errorMessage = "Failed to verify email. Please try again."
          if (err instanceof Error) {
            if (err.message.includes("token") || err.message.includes("expired")) {
              errorMessage = "The verification link has expired. Please request a new one."
            } else if (err.message.includes("already")) {
              errorMessage = "This email has already been verified. You can now sign in."
            }
          }
          setError(errorMessage)
          setStatus("error")
          toast.error(errorMessage)
        }
      } else if (emailParam) {
        setStatus("pending")
      } else {
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
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to resend')
      }

      setStatus("resent")
      toast.success("Verification email sent!")
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
      toast.error(errorMessage)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-50)]">
      <div className="max-w-md p-8 bg-white shadow-lg rounded-xl text-center">
        {status === "verifying" && (
          <>
            <h1 className="text-2xl font-semibold mb-4">Verifying Your Email</h1>
            <p className="text-[var(--neutral-500)] mb-6">
              Please wait while we verify your email address...
            </p>
            <LoadingSpinner className="mx-auto" />
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold mb-4">Email Verified!</h1>
            <p className="text-[var(--neutral-500)] mb-6">
              Your email has been successfully verified. Redirecting you to your dashboard...
            </p>
            <LoadingSpinner className="mx-auto" />
          </>
        )}

        {status === "pending" && (
          <>
            <div className="w-16 h-16 rounded-full bg-[var(--primary-100)] flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[var(--primary-700)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold mb-4">Verify Your Email</h1>
            <p className="text-[var(--neutral-500)] mb-6">
              We sent a confirmation email to <strong>{email}</strong>. Click the link in the email to verify your account.
            </p>
            <p className="text-[var(--neutral-500)] mb-6 text-sm">
              Didn&apos;t receive the email? Check your spam folder or request a new verification email.
            </p>
            <Button
              onClick={handleResendEmail}
              disabled={isResending}
              className="bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white"
            >
              {isResending ? <LoadingSpinner className="h-4 w-4" /> : "Resend Verification Email"}
            </Button>
          </>
        )}

        {status === "resent" && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold mb-4">Verification Email Sent</h1>
            <p className="text-[var(--neutral-500)] mb-6">
              We&apos;ve sent a new verification email to <strong>{email}</strong>. Please check your inbox.
            </p>
            <Button
              onClick={handleResendEmail}
              disabled={isResending}
              variant="outline"
            >
              Send Again
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
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
                {isResending ? <LoadingSpinner className="h-4 w-4" /> : "Request New Verification Email"}
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}