"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

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
  resendVerificationEmail: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    let supabaseClient: any = null

    const initSupabase = async () => {
      try {
        const supabaseModule = await import("@/lib/supabaseClient")
        supabaseClient = supabaseModule.supabase
        setSupabase(supabaseClient)
      } catch (error) {
        console.warn("Failed to initialize Supabase:", error)
        setIsLoading(false)
        return
      }

      if (!supabaseClient) {
        setIsLoading(false)
        return
      }

      const getSession = async () => {
        try {
          const { data } = await supabaseClient.auth.getSession()
          if (data.session?.user) {
            const u = data.session.user
            setUser({ 
              id: u.id, 
              email: u.email || "", 
              name: u.user_metadata?.name, 
              company: u.user_metadata?.company 
            })
          }
        } catch (error) {
          console.warn("Failed to get session:", error)
        } finally {
          setIsLoading(false)
        }
      }

      getSession()

      const { data: listener } = supabaseClient.auth.onAuthStateChange((_event: string, session: any) => {
        if (session?.user) {
          const u = session.user
          setUser({ 
            id: u.id, 
            email: u.email || "", 
            name: u.user_metadata?.name, 
            company: u.user_metadata?.company 
          })
        } else {
          setUser(null)
        }
      })

      return () => {
        if (listener?.unsubscribe) {
          listener.unsubscribe()
        }
      }
    }

    const cleanup = initSupabase()
    
    return () => {
      cleanup.then(fn => fn && typeof fn === 'function' ? fn() : undefined).catch(() => {})
    }
  }, [])

  const login = async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase not initialized")
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setIsLoading(false)
    if (error) {
      let errorMessage = error.message
      if (error.message.includes('invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please try again.'
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (error.message.includes('email not confirmed')) {
        errorMessage = 'Please verify your email address before signing in.'
      }
      throw new Error(errorMessage)
    }
  }

  const signup = async (email: string, password: string, name: string, company: string) => {
    if (!supabase) throw new Error("Supabase not initialized")
    setIsLoading(true)

    const redirectUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${redirectUrl}/auth/verify-email`,
        data: {
          name,
          company
        }
      }
    })

    setIsLoading(false)
    if (error) {
      let errorMessage = error.message
      if (error.message.includes('already registered')) {
        errorMessage = 'Email already exists. Did you forget to verify it?'
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (error.message.includes('invalid email')) {
        errorMessage = 'Please enter a valid email address.'
      } else if (error.message.includes('weak password')) {
        errorMessage = 'Password is too weak. Please use at least 8 characters.'
      }
      throw new Error(errorMessage)
    }
    
    return data
  }

  const logout = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
  }

  const resendVerificationEmail = async (email: string) => {
    if (!supabase) throw new Error("Supabase not initialized")
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    })
    if (error) throw new Error(error.message)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, resendVerificationEmail }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    // Return a default value for SSR to prevent errors
    return {
      user: null,
      isLoading: true,
      login: async () => { throw new Error("AuthProvider not initialized") },
      signup: async () => { throw new Error("AuthProvider not initialized") },
      logout: async () => {},
      resendVerificationEmail: async () => { throw new Error("AuthProvider not initialized") },
    }
  }
  return context
}
