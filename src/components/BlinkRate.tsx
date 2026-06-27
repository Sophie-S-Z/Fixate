'use client'

interface BlinkRateProps {
  rate: number
  baseline?: number
}

export function BlinkRate({ rate, baseline = 15 }: BlinkRateProps) {
  const pct = Math.round((rate / baseline) * 100)
  const isLow = rate < baseline * 0.6
  const isGood = rate >= baseline * 0.8

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="text-3xl font-bold tabular-nums transition-colors duration-500"
        style={{ color: isGood ? '#16a34a' : isLow ? '#dc2626' : '#d97706' }}
      >
        {rate}
      </div>
      <div className="text-xs text-[#7d8694] font-medium">blinks/min</div>
      <div className="text-xs text-[#7d8694]">
        {pct}% of baseline
      </div>
    </div>
  )
}
