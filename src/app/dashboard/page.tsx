import { redirect } from 'next/navigation'
import { auth0 } from '@/lib/auth0'
import { createServiceClient } from '@/lib/supabaseClient'
import { DashboardClient } from './DashboardClient'
import type { FocusWindowRow, DashboardSummary } from '@/lib/types'

export default async function DashboardPage() {
  const session = await auth0.getSession()
  if (!session?.user) redirect('/')

  const supabase = createServiceClient()
  const userId = session.user.sub

  const { data: windows } = await supabase
    .from('focus_windows')
    .select('*')
    .eq('user_id', userId)
    .gte('ts', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('ts', { ascending: true })

  const rows: FocusWindowRow[] = windows ?? []

  const summary: DashboardSummary = {
    avg_score:
      rows.length > 0
        ? rows.reduce((s, r) => s + r.strain_score, 0) / rows.length
        : 0,
    peak_score: rows.length > 0 ? Math.max(...rows.map((r) => r.strain_score)) : 0,
    min_score: rows.length > 0 ? Math.min(...rows.map((r) => r.strain_score)) : 0,
    total_windows: rows.length,
    nudge_count: rows.filter((r) => r.nudge_triggered).length,
    total_time_min: rows.length,
  }

  return (
    <DashboardClient
      windows={rows}
      summary={summary}
      user={session.user}
      userEmail={session.user.email ?? ''}
    />
  )
}
