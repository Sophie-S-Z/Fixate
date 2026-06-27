import type { RawWindowMetrics, FocusWindow } from './types'

const BLINK_BASELINE = 15
const FIXATION_BASELINE = 30
const PUPIL_VAR_BASELINE = 0.015

function stdDev(samples: number[]): number {
  if (samples.length === 0) return 0
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length
  const variance = samples.reduce((sum, s) => sum + (s - mean) ** 2, 0) / samples.length
  return Math.sqrt(variance)
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val))
}

export function computeFocusWindow(
  metrics: RawWindowMetrics,
  userId: string,
  sessionDurationMin: number
): FocusWindow | null {
  if (metrics.trackingQuality === 'lost') return null

  const blinkComponent =
    clamp((BLINK_BASELINE - metrics.blinkCount) / BLINK_BASELINE, 0, 1) * 50

  const fixationComponent =
    clamp(
      (metrics.fixationEvents - FIXATION_BASELINE) / FIXATION_BASELINE,
      0,
      1
    ) * 30

  const pupilVariance = stdDev(metrics.pupilRadiusSamples)
  const pupilComponent =
    clamp(
      (pupilVariance - PUPIL_VAR_BASELINE) / PUPIL_VAR_BASELINE,
      0,
      1
    ) * 20

  const strain_score = clamp(
    blinkComponent + fixationComponent + pupilComponent,
    0,
    100
  )

  return {
    user_id: userId,
    ts: metrics.windowStart,
    blink_rate: metrics.blinkCount,
    fixation_count: metrics.fixationEvents,
    pupil_diameter_variance: pupilVariance,
    strain_score,
    session_duration_min: sessionDurationMin,
    tracking_quality: metrics.trackingQuality,
  }
}
