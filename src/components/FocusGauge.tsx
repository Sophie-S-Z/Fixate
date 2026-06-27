'use client'

interface FocusGaugeProps {
  score: number
  size?: number
}

function scoreColor(score: number) {
  if (score < 35) return { stroke: '#3fb950', text: '#56d364', label: 'Low strain' }
  if (score < 65) return { stroke: '#e0a552', text: '#e3b341', label: 'Moderate' }
  return { stroke: '#f85149', text: '#ff7b72', label: 'High strain' }
}

export function FocusGauge({ score, size = 160 }: FocusGaugeProps) {
  const r = (size - 24) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = Math.PI * r // half circle
  const progress = Math.min(score / 100, 1) * circumference

  const { stroke, text, label } = scoreColor(score)

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        {/* Track */}
        <path
          d={`M 12,${cy} A ${r},${r} 0 0 1 ${size - 12},${cy}`}
          fill="none"
          stroke="#232a33"
          strokeWidth={12}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d={`M 12,${cy} A ${r},${r} 0 0 1 ${size - 12},${cy}`}
          fill="none"
          stroke={stroke}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={circumference - progress}
          style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.5s ease' }}
        />
        {/* Score number */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fontSize={size * 0.22}
          fontWeight="700"
          fill={text}
          style={{ transition: 'fill 0.5s ease' }}
        >
          {Math.round(score)}
        </text>
        {/* Label */}
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          fontSize={12}
          fill="#7d8694"
        >
          {label}
        </text>
      </svg>
    </div>
  )
}
