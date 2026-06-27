'use client'

import { useEffect, useRef, useState } from 'react'
import { computeFocusWindow } from '@/lib/scorer'
import { NudgeThresholdEngine } from '@/lib/nudgeEngine'
import type { FocusWindow, NudgeResponse, RawWindowMetrics } from '@/lib/types'

interface UseSessionReturn {
  strainScore: number
  blinkRate: number
  sessionMinutes: number
  windowHistory: FocusWindow[]
  nudge: NudgeResponse | null
  dismissNudge: () => void
  getWindows: () => FocusWindow[]   // synchronous snapshot, valid right after flush()
}

export function useSession(
  userId: string | undefined,
  token: string | undefined,
  sessionId: string | undefined,
  onRawWindow: (cb: (m: RawWindowMetrics) => void) => void
): UseSessionReturn {
  const [strainScore, setStrainScore] = useState(0)
  const [blinkRate, setBlinkRate] = useState(15)
  const [sessionMinutes, setSessionMinutes] = useState(0)
  const [windowHistory, setWindowHistory] = useState<FocusWindow[]>([])
  const [nudge, setNudge] = useState<NudgeResponse | null>(null)

  const sessionStartRef = useRef(Date.now())
  const nudgeEngineRef = useRef(new NudgeThresholdEngine())
  // Mirror of windowHistory updated synchronously, so a stop handler can read the
  // final flushed window immediately (state updates are async).
  const windowHistoryRef = useRef<FocusWindow[]>([])

  // A new session resets all accumulated state. The setState calls here are an
  // intentional resync to a new session identity, not a render-derived value.
  useEffect(() => {
    sessionStartRef.current = Date.now()
    nudgeEngineRef.current.reset()
    windowHistoryRef.current = []
    /* eslint-disable react-hooks/set-state-in-effect */
    setWindowHistory([])
    setStrainScore(0)
    setBlinkRate(15)
    setSessionMinutes(0)
    setNudge(null)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [sessionId])

  // Session timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionMinutes(
        Math.floor((Date.now() - sessionStartRef.current) / 60_000)
      )
    }, 10_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    onRawWindow(async (raw: RawWindowMetrics) => {
      if (!userId) return

      const sessionDurationMin = Math.floor(
        (Date.now() - sessionStartRef.current) / 60_000
      )

      const window = computeFocusWindow(raw, userId, sessionDurationMin)
      if (!window) return

      setStrainScore(window.strain_score)
      setBlinkRate(window.blink_rate)
      windowHistoryRef.current = [...windowHistoryRef.current.slice(-119), window]
      setWindowHistory(windowHistoryRef.current)

      const nudgeReq = nudgeEngineRef.current.evaluate(window)

      const body = {
        ts: window.ts,
        blink_rate: window.blink_rate,
        fixation_count: window.fixation_count,
        pupil_diameter_variance: window.pupil_diameter_variance,
        strain_score: window.strain_score,
        session_duration_min: window.session_duration_min,
        tracking_quality: window.tracking_quality,
        trigger_type: nudgeReq?.triggerType ?? null,
        session_id: sessionId ?? null,
      }

      try {
        const res = await fetch('/api/ingest-window', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        })

        if (res.ok && nudgeReq) {
          const data = await res.json()
          if (data.nudge_text) {
            setNudge({ nudge_text: data.nudge_text, nudge_type: data.nudge_type })
          }
        }
      } catch (err) {
        console.error('ingest-window failed:', err)
      }
    })
  }, [userId, token, sessionId, onRawWindow])

  return {
    strainScore,
    blinkRate,
    sessionMinutes,
    windowHistory,
    nudge,
    dismissNudge: () => setNudge(null),
    getWindows: () => windowHistoryRef.current,
  }
}
