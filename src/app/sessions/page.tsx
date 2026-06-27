import { redirect } from 'next/navigation'
import { auth0 } from '@/lib/auth0'
import { createServiceClient } from '@/lib/supabaseClient'
import { SessionsClient } from './SessionsClient'
import type { Session } from '@/lib/types'

export default async function SessionsPage() {
  const session = await auth0.getSession()
  if (!session?.user) redirect('/')

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('sessions')
    .select(
      'id, name, started_at, ended_at, window_count, avg_score, peak_score, duration_min'
    )
    .eq('user_id', session.user.sub)
    .order('started_at', { ascending: false })

  const sessions: Session[] = data ?? []

  return (
    <SessionsClient
      sessions={sessions}
      userLabel={session.user.name ?? session.user.email ?? undefined}
    />
  )
}
