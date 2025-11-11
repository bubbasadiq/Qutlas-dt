"use client"

import type React from "react"

import { useState } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    console.log("Login attempted:", { email, password })
    setIsLoading(false)
  }

  return (
    <main className="w-full bg-white min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-6 pt-20">
        <div className="w-full max-w-md">
          <h1 className="text-4xl font-serif font-light text-indigo-950 mb-2">Welcome Back</h1>
          <p className="text-gray-600 font-sans font-light mb-8">Sign in to your QUTLAS account</p>

          <form onSubmit={handleLogin} className="glass p-8 rounded-2xl border border-gray-200">
            <div className="mb-6">
              <label className="block text-sm font-sans font-medium text-indigo-950 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg font-sans focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="mb-8">
              <label className="block text-sm font-sans font-medium text-indigo-950 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg font-sans focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full button-primary py-3 font-sans font-medium disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 font-sans mt-6">
            Don't have an account?{" "}
            <Link href="/signup" className="text-amber-500 hover:text-amber-600 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </main>
  )
}
