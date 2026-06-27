'use client'

import { useState } from 'react'
import { FocusGauge } from './FocusGauge'
import { BlinkRate } from './BlinkRate'
import { SessionTimer } from './SessionTimer'

interface TrackingWidgetProps {
  strainScore: number
  blinkRate: number
  sessionMinutes: number
  trackingState: 'loading' | 'ready' | 'paused' | 'lost' | 'error'
  onPopOut?: () => void
}

const STATE_LABELS: Record<string, { label: string; color: string }> = {
  loading: { label: 'Initializing…',       color: 'bg-gray-400' },
  ready:   { label: 'Live',                color: 'bg-green-500' },
  paused:  { label: 'Face not detected',   color: 'bg-amber-500' },
  lost:    { label: 'Lost',                color: 'bg-red-500' },
  error:   { label: 'Error',               color: 'bg-red-600' },
}

function scoreDescription(score: number) {
  if (score < 35)  return 'Your eyes are relaxed.'
  if (score < 65)  return 'Moderate strain — consider a blink break.'
  return                  'High strain — rest your eyes now.'
}

export function TrackingWidget({
  strainScore,
  blinkRate,
  sessionMinutes,
  trackingState,
  onPopOut,
}: TrackingWidgetProps) {
  const [expanded, setExpanded] = useState(false)
  const { label, color } = STATE_LABELS[trackingState] ?? STATE_LABELS.loading

  return (
    <div
      className="fixed bottom-6 right-6 z-20 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden transition-all duration-300"
      style={{ width: expanded ? 300 : 72 }}
    >
      {/* Collapsed pill */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full h-16 flex items-center justify-center gap-2 px-3"
          aria-label="Expand tracking panel"
        >
          <span className={`w-2 h-2 rounded-full ${color} animate-pulse`} />
          <span className="text-xs font-bold text-gray-700 tabular-nums">
            {Math.round(strainScore)}
          </span>
        </button>
      )}

      {/* Expanded panel */}
      {expanded && (
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${color} animate-pulse`} />
              <span className="text-xs font-medium text-gray-500">{label}</span>
            </div>
            <div className="flex items-center gap-2">
              {onPopOut && (
                <button
                  onClick={onPopOut}
                  className="text-gray-400 hover:text-indigo-600 transition-colors"
                  title="Float in mini window (visible across all tabs)"
                  aria-label="Pop out"
                >
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                    <rect x="1" y="1" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="5.5" y="5.5" width="5" height="4.5" rx="1" fill="currentColor"/>
                  </svg>
                </button>
              )}
              <button
                onClick={() => setExpanded(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                aria-label="Collapse"
              >
                ×
              </button>
            </div>
          </div>

          {/* Score gauge */}
          <div className="flex flex-col items-center mb-4">
            <FocusGauge score={strainScore} size={140} />
            <p className="text-xs text-gray-500 text-center mt-2 px-2">
              {scoreDescription(strainScore)}
            </p>
            <p className="text-[10px] text-gray-400 text-center mt-1">
              Focus Debt Score · 0 = healthy, 100 = high strain
            </p>
          </div>

          {/* Blink + session */}
          <div className="flex justify-around border-t border-gray-100 pt-4">
            <BlinkRate rate={blinkRate} />
            <div className="w-px bg-gray-100" />
            <SessionTimer minutes={sessionMinutes} />
          </div>

          {trackingState === 'paused' && (
            <p className="mt-3 text-xs text-amber-600 text-center">
              Move into frame — tracking paused.
            </p>
          )}
          {trackingState === 'error' && (
            <p className="mt-3 text-xs text-red-600 text-center">
              Camera error — check browser permissions.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
