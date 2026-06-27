'use client'

import Link from 'next/link'
import { DashboardChart } from '@/components/DashboardChart'
import { DailySummaryBar } from '@/components/DailySummaryBar'
import { DigestButton } from '@/components/DigestButton'
import { TopNav } from '@/components/TopNav'
import type { DashboardSummary, FocusWindowRow } from '@/lib/types'

interface DashboardClientProps {
  windows: FocusWindowRow[]
  summary: DashboardSummary
  user: { name?: string; email?: string }
  userEmail: string
}

export function DashboardClient({
  windows,
  summary,
  user,
}: DashboardClientProps) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <TopNav userLabel={user.name ?? user.email} />

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-sora text-2xl font-bold text-[#e6edf3]">Today&apos;s overview</h1>
            <p className="text-sm text-[#7d8694] mt-0.5">{today}</p>
          </div>
          <div className="flex items-start gap-3">
            <Link
              href="/"
              className="text-sm bg-[#a5d6ff] hover:bg-[#8fc8ff] text-[#0d1117] font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              ▶ Start tracking
            </Link>
            <DigestButton
              idleLabel="Send nightly digest"
              sentLabel="✓ Sent to your email"
              className="text-sm bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-[#e6edf3] font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        {/* Summary cards */}
        <DailySummaryBar summary={summary} />

        {/* Chart */}
        <div className="bg-[#161b22] rounded-2xl border border-white/[0.08] shadow-sm p-6">
          <h2 className="text-sm font-semibold text-[#e6edf3] mb-4">
            Focus debt over time
            <span className="ml-2 text-xs font-normal text-[#7d8694]">
              — dashed lines: moderate (50) and high (70) thresholds · 👁 = nudge triggered
            </span>
          </h2>
          {windows.length > 0 ? (
            <DashboardChart windows={windows} />
          ) : (
            <div className="h-64 flex items-center justify-center text-[#7d8694] text-sm">
              No data yet — start a tracking session first.
            </div>
          )}
        </div>

        {/* Privacy note */}
        <p className="text-xs text-[#7d8694] text-center pb-4">
          All camera processing runs entirely in your browser via WebAssembly. Only
          numeric scores are stored.
        </p>
      </main>
    </div>
  )
}
