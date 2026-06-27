import { computeFocusWindow } from '../lib/scorer'
import type { RawWindowMetrics } from '../lib/types'

function makeMetrics(overrides: Partial<RawWindowMetrics> = {}): RawWindowMetrics {
  return {
    windowStart: new Date().toISOString(),
    blinkCount: 15,
    fixationEvents: 30,
    pupilRadiusSamples: Array(600).fill(0.1),
    trackingQuality: 'good',
    ...overrides,
  }
}

describe('computeFocusWindow', () => {
  it('returns near-zero score at baseline', () => {
    const result = computeFocusWindow(makeMetrics(), 'user-1', 0)
    expect(result).not.toBeNull()
    expect(result!.strain_score).toBeCloseTo(0, 0)
  })

  it('returns score = 100 at maximum strain', () => {
    const highVar = Array(600).fill(0).map((_, i) => (i % 2 === 0 ? 0.0 : 0.1))
    const result = computeFocusWindow(
      makeMetrics({
        blinkCount: 0,
        fixationEvents: 60,
        pupilRadiusSamples: highVar,
      }),
      'user-1',
      0
    )
    expect(result).not.toBeNull()
    expect(result!.strain_score).toBe(100)
  })

  it('scores only blink deficit when other metrics are at baseline', () => {
    const result = computeFocusWindow(
      makeMetrics({ blinkCount: 8 }),
      'user-1',
      0
    )
    expect(result).not.toBeNull()
    // blink component = (15 - 8) / 15 * 50 ≈ 23.3
    expect(result!.strain_score).toBeCloseTo(23.3, 0)
  })

  it('clamps score to [0, 100] for any valid input', () => {
    const extremeLow = computeFocusWindow(
      makeMetrics({ blinkCount: 1000 }),
      'u',
      0
    )
    const extremeHigh = computeFocusWindow(
      makeMetrics({ blinkCount: 0, fixationEvents: 1000 }),
      'u',
      0
    )
    expect(extremeLow!.strain_score).toBeGreaterThanOrEqual(0)
    expect(extremeHigh!.strain_score).toBeLessThanOrEqual(100)
  })

  it('returns null for tracking_quality=lost', () => {
    const result = computeFocusWindow(
      makeMetrics({ trackingQuality: 'lost' }),
      'user-1',
      0
    )
    expect(result).toBeNull()
  })

  it('passes through tracking_quality=degraded', () => {
    const result = computeFocusWindow(
      makeMetrics({ trackingQuality: 'degraded' }),
      'user-1',
      0
    )
    expect(result).not.toBeNull()
    expect(result!.tracking_quality).toBe('degraded')
  })
})
