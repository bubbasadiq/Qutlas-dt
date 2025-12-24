import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const { name, data } = await req.json()
  
  const { data: savedData, error } = await supabase
    .from('workspaces')
    .insert([
      {
        user_id: user.id,
        name,
        data,
        created_at: new Date().toISOString(),
      }
    ])
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(savedData, { status: 200 })
}