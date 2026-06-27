'use client'

import { useRef, useCallback } from 'react'

export interface PipMetrics {
  strainScore: number
  liveBlinkRate: number
  sessionMinutes: number
  trackingState: string
}

const PIP_STYLES = `
  *{margin:0;padding:0;box-sizing:border-box}
  body{
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
    background:#0f172a;color:#f1f5f9;
    display:flex;flex-direction:column;
    align-items:center;justify-content:center;
    height:100vh;gap:10px;padding:16px;
    user-select:none;
  }
  .brand{font-size:11px;font-weight:700;letter-spacing:2px;color:#6366f1;text-transform:uppercase}
  .score{font-size:64px;font-weight:800;line-height:1;transition:color .5s}
  .score-label{font-size:11px;color:#94a3b8;margin-top:2px;letter-spacing:.5px}
  .metrics{display:flex;gap:28px;margin-top:6px}
  .metric{text-align:center}
  .metric-val{font-size:22px;font-weight:700}
  .metric-label{font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-top:2px}
  .status{display:flex;align-items:center;gap:6px;margin-top:6px}
  .dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
  .status-text{font-size:10px;color:#64748b}
`

function scoreLabel(score: number) {
  if (score < 35) return { text: 'Low strain',      color: '#22c55e' }
  if (score < 65) return { text: 'Moderate strain', color: '#f59e0b' }
  return              { text: 'High strain',        color: '#ef4444' }
}

const DOT_COLORS: Record<string, string> = {
  ready: '#22c55e', loading: '#94a3b8', paused: '#f59e0b',
  lost: '#ef4444',  error: '#ef4444',   idle: '#94a3b8',
}

export function usePictureInPicture() {
  const pipRef = useRef<Window | null>(null)

  const isSupported =
    typeof window !== 'undefined' && 'documentPictureInPicture' in window

  const updatePip = useCallback((metrics: PipMetrics) => {
    const w = pipRef.current
    if (!w || w.closed) return
    const d = w.document
    const { text, color } = scoreLabel(metrics.strainScore)
    const scoreEl  = d.getElementById('p-score')
    const labelEl  = d.getElementById('p-label')
    const blinkEl  = d.getElementById('p-blink')
    const timeEl   = d.getElementById('p-time')
    const dotEl    = d.getElementById('p-dot')
    if (scoreEl)  { scoreEl.textContent  = String(Math.round(metrics.strainScore)); scoreEl.style.color = color }
    if (labelEl)  labelEl.textContent  = text
    if (blinkEl)  blinkEl.textContent  = String(metrics.liveBlinkRate)
    if (timeEl) {
      const h = Math.floor(metrics.sessionMinutes / 60)
      const m = metrics.sessionMinutes % 60
      timeEl.textContent = h > 0 ? `${h}h ${m}m` : `${m}m`
    }
    if (dotEl) dotEl.style.background = DOT_COLORS[metrics.trackingState] ?? '#94a3b8'
  }, [])

  const openPip = useCallback(async (metrics: PipMetrics) => {
    if (!isSupported) return

    if (pipRef.current && !pipRef.current.closed) {
      updatePip(metrics)
      return
    }

    try {
      // @ts-expect-error — documentPictureInPicture not yet in TS lib
      const w = await window.documentPictureInPicture.requestWindow({
        width: 260, height: 200, disallowReturnToOpener: false,
      })
      pipRef.current = w

      const style = w.document.createElement('style')
      style.textContent = PIP_STYLES
      w.document.head.appendChild(style)

      const { text, color } = scoreLabel(metrics.strainScore)

      w.document.body.innerHTML = `
        <div class="brand">Fixate</div>
        <div id="p-score" class="score" style="color:${color}">${Math.round(metrics.strainScore)}</div>
        <div id="p-label" class="score-label">${text}</div>
        <div class="metrics">
          <div class="metric">
            <div id="p-blink" class="metric-val">${metrics.liveBlinkRate}</div>
            <div class="metric-label">blinks/min</div>
          </div>
          <div class="metric">
            <div id="p-time" class="metric-val">${metrics.sessionMinutes}m</div>
            <div class="metric-label">session</div>
          </div>
        </div>
        <div class="status">
          <div id="p-dot" class="dot" style="background:${DOT_COLORS[metrics.trackingState] ?? '#94a3b8'}"></div>
          <div class="status-text">tracking active</div>
        </div>
      `

      w.addEventListener('pagehide', () => { pipRef.current = null })
    } catch (err) {
      console.error('PiP open failed:', err)
    }
  }, [isSupported, updatePip])

  return { openPip, updatePip, isSupported }
}
