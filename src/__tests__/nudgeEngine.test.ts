import { NudgeThresholdEngine } from '../lib/nudgeEngine'
import type { FocusWindow } from '../lib/types'

function makeWindow(score: number, overrides: Partial<FocusWindow> = {}): FocusWindow {
  return {
    user_id: 'user-1',
    ts: new Date().toISOString(),
    blink_rate: 15,
    fixation_count: 30,
    pupil_diameter_variance: 0.015,
    strain_score: score,
    session_duration_min: 10,
    tracking_quality: 'good',
    ...overrides,
  }
}

describe('NudgeThresholdEngine', () => {
  it('triggers acute nudge when score > 70', () => {
    const engine = new NudgeThresholdEngine()
    const result = engine.evaluate(makeWindow(75))
    expect(result).not.toBeNull()
    expect(result!.triggerType).toBe('acute')
  })

  it('does not trigger acute nudge when score <= 70', () => {
    const engine = new NudgeThresholdEngine()
    const result = engine.evaluate(makeWindow(70))
    expect(result).toBeNull()
  })

  it('enforces 10-minute cooldown between nudges', () => {
    const engine = new NudgeThresholdEngine()
    const first = engine.evaluate(makeWindow(80))
    expect(first).not.toBeNull()

    const second = engine.evaluate(makeWindow(80))
    expect(second).toBeNull()
  })

  it('triggers chronic nudge after 20 windows all > 50', () => {
    const engine = new NudgeThresholdEngine()
    for (let i = 0; i < 19; i++) {
      engine.evaluate(makeWindow(51))
    }
    const result = engine.evaluate(makeWindow(51))
    expect(result).not.toBeNull()
    expect(result!.triggerType).toBe('chronic')
  })

  it('does not trigger chronic nudge with only 19 windows', () => {
    const engine = new NudgeThresholdEngine()
    for (let i = 0; i < 19; i++) {
      engine.evaluate(makeWindow(51))
    }
    // Only 19 windows pushed
    const engine2 = new NudgeThresholdEngine()
    for (let i = 0; i < 18; i++) engine2.evaluate(makeWindow(51))
    const result = engine2.evaluate(makeWindow(51))
    expect(result).toBeNull()
  })

  it('does not trigger chronic when rolling avg <= 50', () => {
    const engine = new NudgeThresholdEngine()
    for (let i = 0; i < 20; i++) {
      engine.evaluate(makeWindow(50))
    }
    const result = engine.evaluate(makeWindow(50))
    expect(result).toBeNull()
  })
})
