"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState<string>("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") // e.g. /auth/verify-email?token=xxxx

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("Verification token is missing.")
      return
    }

    const verifyEmail = async () => {
      const { error } = await supabase.auth.verifyOtp({ token, type: "signup" })
      if (error) {
        setStatus("error")
        setMessage(error.message)
      } else {
        setStatus("success")
        setMessage("Your email has been successfully verified!")
      }
    }

    verifyEmail()
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-50)]">
      <div className="max-w-md p-8 bg-white shadow-lg rounded-lg text-center">
        {status === "loading" && <p>Verifying your email...</p>}
        {status === "success" && (
          <>
            <p className="text-green-600 mb-4">{message}</p>
            <Button onClick={() => router.push("/auth/login")}>Go to Login</Button>
          </>
        )}
        {status === "error" && (
          <>
            <p className="text-red-600 mb-4">{message}</p>
            <Button onClick={() => router.push("/auth/signup")}>Try Again</Button>
          </>
        )}
      </div>
    </div>
  )
}
