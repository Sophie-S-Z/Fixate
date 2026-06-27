'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { getAccessToken } from '@auth0/nextjs-auth0/client'
import { useMediaPipe } from '@/hooks/useMediaPipe'
import { useSession } from '@/hooks/useSession'
import { usePictureInPicture } from '@/hooks/usePictureInPicture'
import { NudgeOverlay } from '@/components/NudgeOverlay'
import { PrivacyModal } from '@/components/PrivacyModal'
import { FocusGauge } from '@/components/FocusGauge'
import { BlinkRate } from '@/components/BlinkRate'
import { SessionTimer } from '@/components/SessionTimer'
import { TopNav } from '@/components/TopNav'
import { LandingPage } from '@/components/LandingPage'
import { DigestButton } from '@/components/DigestButton'

interface User {
  sub: string
  name?: string
  email?: string
}

interface HomeClientProps {
  user: User | null
}

// idle → privacy → active → ended → idle (loop)
type Phase = 'idle' | 'privacy' | 'active' | 'ended'

interface SessionSnapshot {
  minutes: number
  finalScore: number
  avgScore: number
  blinkRate: number
  windowCount: number
}

const STATE_INFO: Record<string, { label: string; dot: string }> = {
  idle:    { label: 'Not started',       dot: 'bg-[#7d8694]' },
  loading: { label: 'Loading…',          dot: 'bg-[#7d8694] animate-pulse' },
  ready:   { label: 'Live',              dot: 'bg-[#3fb950] animate-pulse' },
  paused:  { label: 'Face not detected', dot: 'bg-[#e0a552]' },
  lost:    { label: 'Lost',              dot: 'bg-[#f85149]' },
  error:   { label: 'Error',             dot: 'bg-[#f85149]' },
}

function scoreLabel(score: number) {
  if (score < 35) return { text: 'Low strain',      color: 'text-[#56d364]' }
  if (score < 65) return { text: 'Moderate strain', color: 'text-[#e3b341]' }
  return              { text: 'High strain',        color: 'text-[#ff7b72]' }
}

function defaultSessionName(startedAt: string) {
  return `Session · ${new Date(startedAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })}`
}

// ─── Session summary (shown after Stop) ──────────────────────────────────────

function SessionSummary({
  snap,
  onRestart,
}: {
  snap: SessionSnapshot
  onRestart: () => void
}) {
  const { text, color } = scoreLabel(snap.avgScore)

  return (
    <main className="max-w-xl mx-auto px-6 py-16 text-center">
      <div className="text-4xl mb-4 text-[#a5d6ff]">✓</div>
      <h1 className="font-sora text-2xl font-bold text-[#e6edf3] mb-1">Session complete</h1>
      <p className="text-[#7d8694] text-sm mb-8">
        {snap.minutes} minute{snap.minutes !== 1 ? 's' : ''} tracked ·{' '}
        {snap.windowCount} window{snap.windowCount !== 1 ? 's' : ''} scored
      </p>

      {/* Score summary */}
      <div className="bg-[#161b22] rounded-2xl border border-white/[0.08] shadow-sm p-6 mb-4">
        <FocusGauge score={snap.avgScore} size={160} />
        <p className={`text-sm font-semibold mt-2 ${color}`}>
          {text} — avg score {Math.round(snap.avgScore)}/100
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="font-dm-mono text-xl font-bold text-[#e6edf3]">{Math.round(snap.finalScore)}</div>
            <div className="text-xs text-[#7d8694] mt-0.5">Final score</div>
          </div>
          <div>
            <div className="font-dm-mono text-xl font-bold text-[#e6edf3]">{snap.blinkRate}</div>
            <div className="text-xs text-[#7d8694] mt-0.5">Blinks/min</div>
          </div>
          <div>
            <div className="font-dm-mono text-xl font-bold text-[#e6edf3]">{snap.minutes}m</div>
            <div className="text-xs text-[#7d8694] mt-0.5">Duration</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <DigestButton
          idleLabel="Send results to my email"
          sentLabel="✓ Results sent to your email"
          className="w-full py-3 bg-[#a5d6ff] hover:bg-[#8fc8ff] disabled:opacity-50 text-[#0d1117] font-semibold rounded-xl transition-colors text-sm"
        />
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onRestart}
            className="py-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-[#e6edf3] font-semibold rounded-xl transition-colors text-sm"
          >
            Start another session
          </button>
          <Link
            href="/sessions"
            className="py-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-[#e6edf3] font-semibold rounded-xl transition-colors text-sm flex items-center justify-center"
          >
            View all sessions
          </Link>
        </div>
      </div>
    </main>
  )
}

// ─── Main tracking view (authenticated) ──────────────────────────────────────

function TrackingView({ user }: { user: User }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | undefined>(undefined)
  const sessionStartedAtRef = useRef<string>('')

  useEffect(() => {
    getAccessToken().then(setToken).catch(() => setToken(null))
  }, [])

  // Camera runs only while phase === 'active'
  const {
    videoRef, isLoading, error,
    liveBlinkRate, liveEAR,
    trackingState, onWindowComplete, flush,
  } = useMediaPipe(phase === 'active')

  const {
    strainScore, sessionMinutes,
    nudge, dismissNudge, getWindows,
  } = useSession(user.sub, token ?? undefined, sessionId, onWindowComplete)

  const { openPip, updatePip, isSupported: pipSupported } = usePictureInPicture()

  // Keep PiP in sync without triggering re-renders
  const pipMetrics = { strainScore, liveBlinkRate, sessionMinutes, trackingState }
  const pipMetricsRef = useRef(pipMetrics)
  pipMetricsRef.current = pipMetrics

  useEffect(() => {
    if (phase === 'active') updatePip(pipMetricsRef.current)
  }, [phase, strainScore, liveBlinkRate, sessionMinutes, trackingState, updatePip])

  // Begin a new tracking session (fresh id + start time).
  const startSession = useCallback(() => {
    setSessionId(crypto.randomUUID())
    sessionStartedAtRef.current = new Date().toISOString()
    setPhase('active')
  }, [])

  // Stop: flush the final window, persist the session row, show the summary.
  const stopSession = useCallback(() => {
    flush() // synchronously emits the final partial window into useSession
    const windows = getWindows()
    const windowCount = windows.length
    const avgScore =
      windowCount > 0
        ? windows.reduce((s, w) => s + w.strain_score, 0) / windowCount
        : strainScore
    const peakScore = windowCount > 0 ? Math.max(...windows.map((w) => w.strain_score)) : strainScore
    const startedAt = sessionStartedAtRef.current || new Date().toISOString()
    const endedAt = new Date().toISOString()
    const durationMin = Math.max(
      0,
      Math.round((Date.now() - new Date(startedAt).getTime()) / 60_000)
    )

    setSnapshot({
      minutes: sessionMinutes,
      finalScore: strainScore,
      avgScore,
      blinkRate: liveBlinkRate,
      windowCount,
    })
    setPhase('ended')

    // Persist the session (fire-and-forget; aggregates were computed above).
    if (sessionId) {
      fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sessionId,
          name: defaultSessionName(startedAt),
          started_at: startedAt,
          ended_at: endedAt,
          window_count: windowCount,
          avg_score: avgScore,
          peak_score: peakScore,
          duration_min: durationMin,
        }),
      }).catch((e) => console.error('save session failed:', e))
    }
  }, [strainScore, sessionMinutes, liveBlinkRate, getWindows, flush, sessionId])

  const { label: stateLabel, dot: stateDot } = STATE_INFO[trackingState] ?? STATE_INFO.idle
  const { text: scoreText, color: scoreColor } = scoreLabel(strainScore)

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <TopNav userLabel={user.name ?? user.email} />

      {/* ── Idle: welcome ── */}
      {phase === 'idle' && (
        <main className="max-w-2xl mx-auto px-6 py-20 text-center">
          <h1 className="font-sora text-3xl font-bold text-[#e6edf3] mb-3">
            Welcome back{user.name ? `, ${user.name.split(' ')[0]}` : ''}.
          </h1>
          <p className="text-[#7d8694] mb-8">
            Start a session to monitor your eye strain in real time.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setPhase('privacy')}
              className="bg-[#a5d6ff] hover:bg-[#8fc8ff] text-[#0d1117] font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              Start tracking
            </button>
            <Link
              href="/sessions"
              className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-[#e6edf3] font-semibold px-8 py-3 rounded-xl transition-colors text-sm flex items-center justify-center"
            >
              View sessions
            </Link>
          </div>
        </main>
      )}

      {/* ── Ended: session summary ── */}
      {phase === 'ended' && snapshot && (
        <SessionSummary snap={snapshot} onRestart={startSession} />
      )}

      {/* ── Active tracking ── */}
      {phase === 'active' && (
        <main className="max-w-5xl mx-auto px-6 py-8">
          {/* Status bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${stateDot}`} />
              <span className="text-sm font-medium text-[#b9c2cd]">{stateLabel}</span>
            </div>
            <div className="flex items-center gap-3">
              {pipSupported && (
                <button
                  onClick={() => openPip(pipMetricsRef.current)}
                  className="text-xs bg-white/[0.04] hover:bg-white/[0.08] text-[#b9c2cd] font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                  title="Float metrics in a mini window visible on any tab"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                    <rect x="1" y="1" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="5.5" y="5.5" width="5" height="4.5" rx="1" fill="currentColor"/>
                  </svg>
                  Pop out
                </button>
              )}
              <button
                onClick={stopSession}
                className="text-xs bg-[#f85149]/10 hover:bg-[#f85149]/20 text-[#ff7b72] font-medium px-3 py-1.5 rounded-lg transition-colors border border-[#f85149]/30"
              >
                Stop session
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-[#f85149]/10 border border-[#f85149]/30 rounded-xl p-4 text-sm text-[#ff7b72] mb-6">
              {error} — check that your browser has camera permission.
            </div>
          )}

          {!error && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Camera feed — always mounted so videoRef is valid */}
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-white/[0.08]">
                {isLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#0d1117]">
                    <div className="w-8 h-8 border-2 border-[#a5d6ff] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-white/60 mt-3">Loading model (~2 s)…</p>
                  </div>
                )}
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                  muted
                  playsInline
                />
                {!isLoading && (
                  <>
                    <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
                      <span className="text-xs text-white/60">EAR</span>
                      <div className="w-20 h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#a5d6ff] rounded-full transition-all duration-150"
                          style={{ width: `${Math.min(liveEAR * 250, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/60 tabular-nums w-8">
                        {liveEAR.toFixed(2)}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3 text-[10px] text-white/50 bg-black/30 px-2 py-0.5 rounded-full">
                      on-device · no data sent
                    </div>
                  </>
                )}
              </div>

              {/* Metrics panel */}
              <div className="flex flex-col gap-4">
                <div className="bg-[#161b22] rounded-2xl border border-white/[0.08] shadow-sm p-6 flex flex-col items-center">
                  <div className="text-xs font-semibold uppercase tracking-widest text-[#7d8694] mb-2">
                    Focus Debt Score
                  </div>
                  <FocusGauge score={strainScore} size={180} />
                  <p className={`text-sm font-semibold mt-1 ${scoreColor}`}>{scoreText}</p>
                  <p className="text-xs text-[#7d8694] mt-1 text-center max-w-xs">
                    Composite of blink rate, fixation count, and pupil variance.
                    0 = healthy · 100 = high strain.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#161b22] rounded-2xl border border-white/[0.08] shadow-sm p-4 flex flex-col items-center gap-1">
                    <BlinkRate rate={liveBlinkRate} />
                    <p className="text-xs text-[#7d8694] text-center mt-1">
                      Healthy: ~15/min · updates every 3 s
                    </p>
                  </div>
                  <div className="bg-[#161b22] rounded-2xl border border-white/[0.08] shadow-sm p-4 flex flex-col items-center gap-1">
                    <SessionTimer minutes={sessionMinutes} />
                    <p className="text-xs text-[#7d8694] text-center mt-1">
                      Current session
                    </p>
                  </div>
                </div>

                {trackingState === 'paused' && (
                  <div className="bg-[#e0a552]/10 border border-[#e0a552]/30 rounded-xl p-3 text-xs text-[#e3b341] text-center">
                    Face not detected — move into frame and look at the camera.
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      )}

      {/* ── Privacy gate (first session only) ── */}
      {phase === 'privacy' && (
        <PrivacyModal onAccept={startSession} />
      )}

      {/* ── Nudge overlay ── */}
      {nudge && <NudgeOverlay nudge={nudge} onDismiss={dismissNudge} />}
    </div>
  )
}

// ─── Entry point ─────────────────────────────────────────────────────────────

export function HomeClient({ user }: HomeClientProps) {
  if (!user) return <LandingPage />
  return <TrackingView user={user} />
}
