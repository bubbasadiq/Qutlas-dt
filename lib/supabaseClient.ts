// lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js"

let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient(): ReturnType<typeof createClient> {
  if (supabaseClient) {
    return supabaseClient
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
  }
  
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  return supabaseClient
}

// For backwards compatibility - will throw if called during SSR without credentials
export const supabase = typeof window !== 'undefined' 
  ? (() => {
      try {
        return getSupabaseClient()
      } catch {
        return null
      }
    })()
  : null
