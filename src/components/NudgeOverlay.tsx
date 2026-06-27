'use client'

import { useEffect } from 'react'
import type { NudgeResponse } from '@/lib/types'

interface NudgeOverlayProps {
  nudge: NudgeResponse
  onDismiss: () => void
}

export function NudgeOverlay({ nudge, onDismiss }: NudgeOverlayProps) {
  const { nudge_type, nudge_text } = nudge

  // Auto-dismiss mild nudges after 8s
  useEffect(() => {
    if (nudge_type !== 'mild') return
    const t = setTimeout(onDismiss, 8000)
    return () => clearTimeout(t)
  }, [nudge_type, onDismiss])

  if (nudge_type === 'urgent') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-[#161b22] border border-[#f85149]/60 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">👁️</span>
            <span className="text-sm font-semibold uppercase tracking-wider text-[#ff7b72]">
              Eye strain alert
            </span>
          </div>
          <p className="text-[#e6edf3] text-base leading-relaxed mb-6">{nudge_text}</p>
          <button
            onClick={onDismiss}
            className="w-full py-3 bg-[#f85149] hover:bg-[#da3633] text-white font-semibold rounded-xl transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    )
  }

  if (nudge_type === 'moderate') {
    return (
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 bg-[#161b22] border border-[#e0a552]/50 rounded-xl shadow-lg max-w-sm w-full mx-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[#e3b341] mb-2">
              Strain building
            </div>
            <p className="text-[#e6edf3] text-sm leading-relaxed">{nudge_text}</p>
          </div>
          <button
            onClick={onDismiss}
            className="text-[#7d8694] hover:text-[#e6edf3] flex-shrink-0 text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    )
  }

  // mild — toast
  return (
    <div className="fixed bottom-6 right-6 z-30 bg-[#161b22] border border-white/[0.08] rounded-xl shadow-md max-w-xs w-full p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-[#a5d6ff] mb-1">Fixate</div>
          <p className="text-[#b9c2cd] text-sm leading-snug">{nudge_text}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-[#7d8694] hover:text-[#e6edf3] flex-shrink-0 text-lg leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  )
}
