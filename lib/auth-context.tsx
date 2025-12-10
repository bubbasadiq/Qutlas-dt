"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "./supabaseClient"

interface User {
  id: string
  email: string
  name?: string
  company?: string
  role: "user" | "hub" | "admin"
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string, company: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load session on mount
  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) mapSupabaseUser(data.session.user)
      setIsLoading(false)
    }

    loadSession()

    // Realtime session updates
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) mapSupabaseUser(session.user)
      else setUser(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const mapSupabaseUser = (sUser: any) => {
    setUser({
      id: sUser.id,
      email: sUser.email,
      name: sUser.user_metadata?.name || "",
      company: sUser.user_metadata?.company || "",
      role: "user", // you can extend this later with RLS or metadata
    })
  }

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw new Error(error.message)
    if (data.user) mapSupabaseUser(data.user)
    setIsLoading(false)
  }

  const signup = async (email: string, password: string, name: string, company: string) => {
    setIsLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, company },
      },
    })

    if (error) throw new Error(error.message)
    // User must verify email before login
    setIsLoading(false)
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

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
