"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "./supabase"

interface User {
  id: string
  email: string
  name: string
  company?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string, company: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is logged in on mount
  useEffect(() => {
    const session = supabase.auth.session()
    if (session?.user) setUser(session.user as any)
    setIsLoading(false)

    // Subscribe to auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user as any || null)
    })
    return () => listener?.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    const { error } = await supabase.auth.signIn({ email, password })
    setIsLoading(false)
    if (error) throw error
  }

  const signup = async (email: string, password: string, name: string, company: string) => {
    setIsLoading(true)
    const { user, error } = await supabase.auth.signUp(
      { email, password },
      {
        data: { name, company },
        redirectTo: `${window.location.origin}/auth/verify-email`
      }
    )
    setIsLoading(false)
    if (error) throw error
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
