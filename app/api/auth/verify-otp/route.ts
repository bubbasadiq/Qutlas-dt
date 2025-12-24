import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { token, type, email } = await req.json()
    
    if (!token || !type || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    const cookieStore = await cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })
    
    const { error } = await supabase.auth.verifyOtp({
      token,
      type: type as 'email' | 'phone' | 'magiclink',
      email,
    })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('OTP verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    )
  }
}
