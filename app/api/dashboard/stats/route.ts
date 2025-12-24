import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const [activeProjectsResult, inProductionResult, completedResult, pendingResult] = await Promise.all([
      supabase
        .from('workspaces')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'active'),
      supabase
        .from('jobs')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'in_production'),
      supabase
        .from('jobs')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'completed'),
      supabase
        .from('jobs')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'pending'),
    ])
    
    return NextResponse.json({
      activeProjects: activeProjectsResult.count || 0,
      inProduction: inProductionResult.count || 0,
      completed: completedResult.count || 0,
      pending: pendingResult.count || 0,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
