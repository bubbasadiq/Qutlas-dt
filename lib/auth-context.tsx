"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { mapErrorMessage } from "@/lib/error-utils"

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

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session?.user) {
        const u = data.session.user
        setUser({ id: u.id, email: u.email || "", name: u.user_metadata?.name, company: u.user_metadata?.company })
      }
      setIsLoading(false)
    }
    getSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user
        setUser({ id: u.id, email: u.email || "", name: u.user_metadata?.name, company: u.user_metadata?.company })
      } else {
        setUser(null)
      }
    })
    return () => listener?.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setIsLoading(false)
    if (error) {
      throw new Error(mapErrorMessage(error))
    }
  }

  const signup = async (email: string, password: string, name: string, company: string) => {
  setIsLoading(true)

  const redirectUrl = (typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || '')

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${redirectUrl}/auth/verify-email?onboarding=true`,
      data: {
        name,
        company
      }
    }
  })

  setIsLoading(false)
  if (error) {
    throw new Error(mapErrorMessage(error))
  }

  return data
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
