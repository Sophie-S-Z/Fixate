'use client'

interface SessionTimerProps {
  minutes: number
}

export function SessionTimer({ minutes }: SessionTimerProps) {
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  const display = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-3xl font-bold tabular-nums text-[#e6edf3]">{display}</div>
      <div className="text-xs text-[#7d8694] font-medium">session</div>
    </div>
  )
}
