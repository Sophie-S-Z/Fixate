import type { FocusWindow, NudgeRequest } from './types'

const ACUTE_THRESHOLD = 70
const CHRONIC_THRESHOLD = 50
const CHRONIC_WINDOW_COUNT = 20
const COOLDOWN_MS = 10 * 60 * 1000

export class NudgeThresholdEngine {
  private lastNudgeAt: number | null = null
  private windowHistory: FocusWindow[] = []

  evaluate(window: FocusWindow): NudgeRequest | null {
    this.windowHistory.push(window)
    if (this.windowHistory.length > CHRONIC_WINDOW_COUNT) {
      this.windowHistory.shift()
    }

    if (this.isCoolingDown()) return null

    if (window.strain_score > ACUTE_THRESHOLD) {
      this.lastNudgeAt = Date.now()
      return { focusWindow: window, triggerType: 'acute' }
    }

    if (this.windowHistory.length === CHRONIC_WINDOW_COUNT) {
      const avg =
        this.windowHistory.reduce((s, w) => s + w.strain_score, 0) /
        CHRONIC_WINDOW_COUNT
      if (avg > CHRONIC_THRESHOLD) {
        this.lastNudgeAt = Date.now()
        return { focusWindow: window, triggerType: 'chronic' }
      }
    }

    return null
  }

  private isCoolingDown(): boolean {
    if (this.lastNudgeAt === null) return false
    return Date.now() - this.lastNudgeAt < COOLDOWN_MS
  }

  reset() {
    this.lastNudgeAt = null
    this.windowHistory = []
  }
}
