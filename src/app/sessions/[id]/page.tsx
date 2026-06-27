import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth0 } from '@/lib/auth0'
import { createServiceClient } from '@/lib/supabaseClient'
import { DashboardChart } from '@/components/DashboardChart'
import { TopNav } from '@/components/TopNav'
import type { FocusWindowRow, SessionRow } from '@/lib/types'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-[#161b22] rounded-xl border border-white/[0.08] p-4 flex flex-col gap-1">
      <div className="font-dm-mono text-2xl font-bold tabular-nums" style={{ color: color ?? '#e6edf3' }}>
        {value}
      </div>
      <div className="text-xs font-medium text-[#7d8694] uppercase tracking-wide">{label}</div>
    </div>
  )
}

function strainColor(score: number | null) {
  if (score == null) return '#e6edf3'
  if (score < 35) return '#56d364'
  if (score < 65) return '#e3b341'
  return '#ff7b72'
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth0.getSession()
  if (!session?.user) redirect('/')

  const supabase = createServiceClient()

  const { data: s } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.user.sub)
    .single()

  if (!s) notFound()
  const meta = s as SessionRow

  const { data: windowData } = await supabase
    .from('focus_windows')
    .select('*')
    .eq('session_id', id)
    .order('ts', { ascending: true })

  const windows: FocusWindowRow[] = windowData ?? []
  const nudgeCount = windows.filter((w) => w.nudge_triggered).length

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <TopNav userLabel={session.user.name ?? session.user.email ?? undefined} />

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <div>
          <Link href="/sessions" className="text-sm text-[#7d8694] hover:text-[#a5d6ff] transition-colors">
            ← All sessions
          </Link>
          <h1 className="font-sora text-2xl font-bold text-[#e6edf3] mt-2">{meta.name}</h1>
          <p className="text-sm text-[#7d8694] mt-0.5">{fmtDate(meta.started_at)}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Avg strain" value={meta.avg_score != null ? Math.round(meta.avg_score) : '—'} color={strainColor(meta.avg_score)} />
          <Stat label="Peak strain" value={meta.peak_score != null ? Math.round(meta.peak_score) : '—'} color="#ff7b72" />
          <Stat label="Duration" value={`${meta.duration_min}m`} />
          <Stat label="Nudges" value={nudgeCount} color="#a5d6ff" />
        </div>

        <div className="bg-[#161b22] rounded-2xl border border-white/[0.08] shadow-sm p-6">
          <h2 className="text-sm font-semibold text-[#e6edf3] mb-4">
            Strain over the session
            <span className="ml-2 text-xs font-normal text-[#7d8694]">
              — dashed lines: moderate (50) and high (70) · 👁 = nudge triggered
            </span>
          </h2>
          {windows.length > 0 ? (
            <DashboardChart windows={windows} />
          ) : (
            <div className="h-64 flex items-center justify-center text-[#7d8694] text-sm">
              This session was too short to record any windows.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
