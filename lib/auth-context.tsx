"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  email: string
  name: string
  company?: string
  role: "user" | "hub" | "admin"
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string, company: string) => Promise<void>
  logout: () => void
  hubRegister: (data: any) => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("qutlas_auth")
    if (stored) {
      try {
        const { user, token } = JSON.parse(stored)
        setUser(user)
        setToken(token)
      } catch (err) {
        localStorage.removeItem("qutlas_auth")
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) throw new Error("Login failed")

      const { user, access_token } = await response.json()
      setUser(user)
      setToken(access_token)
      localStorage.setItem("qutlas_auth", JSON.stringify({ user, token: access_token }))
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (email: string, password: string, name: string, company: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, company }),
      })

      if (!response.ok) throw new Error("Signup failed")
      // After signup, user needs to verify email before login
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem("qutlas_auth")
  }

  const hubRegister = async (data: any) => {
    if (!token) throw new Error("Not authenticated")
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/auth/hub/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error("Hub registration failed")
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout, hubRegister }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
