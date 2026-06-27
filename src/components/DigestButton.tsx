'use client'

import { useState } from 'react'

type DigestState =
  | { state: 'idle' | 'sending' | 'sent' }
  | { state: 'skipped'; detail: string }
  | { state: 'error'; detail: string }

interface DigestButtonProps {
  idleLabel: string
  sentLabel?: string
  className?: string
}

/**
 * Sends the daily digest via /api/trigger-digest and surfaces the *real* result —
 * including the exact Resend/server error detail, so failures are diagnosable
 * instead of a generic "Send failed".
 */
export function DigestButton({ idleLabel, sentLabel = '✓ Sent to your email', className = '' }: DigestButtonProps) {
  const [d, setD] = useState<DigestState>({ state: 'idle' })

  async function send() {
    setD({ state: 'sending' })
    try {
      const res = await fetch('/api/trigger-digest', { method: 'POST' })
      const data = await res.json().catch(() => ({} as Record<string, unknown>))
      if (res.ok && data.sent) {
        setD({ state: 'sent' })
      } else if (res.ok && data.skipped) {
        setD({ state: 'skipped', detail: String(data.reason ?? 'Not enough data yet.') })
      } else {
        const detail = String(data.detail ?? data.error ?? `Request failed (HTTP ${res.status})`)
        setD({ state: 'error', detail })
      }
    } catch (e) {
      setD({ state: 'error', detail: e instanceof Error ? e.message : 'Network error' })
    }
  }

  const label =
    d.state === 'idle' ? idleLabel
    : d.state === 'sending' ? 'Sending…'
    : d.state === 'sent' ? sentLabel
    : d.state === 'skipped' ? 'Not enough data'
    : 'Send failed — retry'

  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={send}
        disabled={d.state === 'sending' || d.state === 'sent'}
        className={className}
      >
        {label}
      </button>
      {d.state === 'skipped' && (
        <p className="text-xs text-[#e3b341] leading-snug">{d.detail}</p>
      )}
      {d.state === 'error' && (
        <p className="text-xs text-[#ff7b72] leading-snug break-words">{d.detail}</p>
      )}
      {d.state === 'sent' && (
        <p className="text-xs text-[#7d8694] leading-snug">
          Check your inbox — the digest covers today&apos;s full tracking history.
        </p>
      )}
    </div>
  )
}
