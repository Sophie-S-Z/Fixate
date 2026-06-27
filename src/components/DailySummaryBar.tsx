'use client'

import type { DashboardSummary } from '@/lib/types'

interface DailySummaryBarProps {
  summary: DashboardSummary
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string | number
  sub?: string
  color?: string
}) {
  return (
    <div className="bg-[#161b22] rounded-xl border border-white/[0.08] shadow-sm p-4 flex flex-col gap-1">
      <div
        className="font-dm-mono text-2xl font-bold tabular-nums"
        style={{ color: color ?? '#e6edf3' }}
      >
        {value}
      </div>
      <div className="text-xs font-medium text-[#7d8694] uppercase tracking-wide">
        {label}
      </div>
      {sub && <div className="text-xs text-[#7d8694]">{sub}</div>}
    </div>
  )
}

export function DailySummaryBar({ summary }: DailySummaryBarProps) {
  const hours = Math.floor(summary.total_time_min / 60)
  const mins = summary.total_time_min % 60
  const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard
        label="Avg strain"
        value={summary.avg_score.toFixed(0)}
        sub="/ 100"
        color={
          summary.avg_score > 65
            ? '#ff7b72'
            : summary.avg_score > 40
            ? '#e3b341'
            : '#56d364'
        }
      />
      <StatCard
        label="Peak strain"
        value={summary.peak_score.toFixed(0)}
        sub="/ 100"
        color="#ff7b72"
      />
      <StatCard label="Time tracked" value={timeStr} />
      <StatCard
        label="Nudges"
        value={summary.nudge_count}
        sub="triggered"
        color="#a5d6ff"
      />
    </div>
  )
}
