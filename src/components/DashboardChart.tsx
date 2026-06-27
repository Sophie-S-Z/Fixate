'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import type { FocusWindowRow } from '@/lib/types'

interface DashboardChartProps {
  windows: FocusWindowRow[]
}

interface ChartPoint {
  time: string
  score: number
  nudge?: boolean
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function DashboardChart({ windows }: DashboardChartProps) {
  const data: ChartPoint[] = windows.map((w) => ({
    time: formatTime(w.ts),
    score: Math.round(w.strain_score),
    nudge: w.nudge_triggered,
  }))

  const nudgePoints = data.filter((d) => d.nudge)

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="#232a33" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fill: '#7d8694' }}
            tickLine={false}
            axisLine={{ stroke: '#232a33' }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#7d8694' }}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <Tooltip
            contentStyle={{
              background: '#161b22',
              border: '1px solid #21262d',
              borderRadius: 8,
              fontSize: 12,
              color: '#e6edf3',
            }}
            labelStyle={{ color: '#b9c2cd', fontWeight: 600 }}
          />
          {/* Threshold bands */}
          <ReferenceLine y={70} stroke="#f85149" strokeDasharray="4 2" strokeOpacity={0.45} />
          <ReferenceLine y={50} stroke="#e0a552" strokeDasharray="4 2" strokeOpacity={0.45} />

          {/* Nudge markers */}
          {nudgePoints.map((p, i) => (
            <ReferenceLine
              key={i}
              x={p.time}
              stroke="#a5d6ff"
              strokeOpacity={0.6}
              strokeWidth={2}
              label={{ value: '👁', position: 'top', fontSize: 10 }}
            />
          ))}

          <Line
            type="monotone"
            dataKey="score"
            stroke="#a5d6ff"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: '#a5d6ff' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
