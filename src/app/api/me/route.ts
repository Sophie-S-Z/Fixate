import { NextRequest, NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'
import { createServiceClient } from '@/lib/supabaseClient'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const session = await auth0.getSession(req)
  if (!session?.user?.sub) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.sub

  const supabase = createServiceClient()
  const { data: windows } = await supabase
    .from('focus_windows')
    .select('strain_score, ts, blink_rate, nudge_triggered')
    .eq('user_id', userId)
    .gte('ts', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('ts', { ascending: true })

  return NextResponse.json({ user_id: userId, windows: windows ?? [] })
}
