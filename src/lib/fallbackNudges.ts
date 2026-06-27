export const FALLBACK_NUDGES = {
  mild: {
    text: 'Your blink rate is dropping — a sign of deep focus. Blink deliberately 10 times now.',
    type: 'mild' as const,
  },
  moderate: {
    text: "You've been locked in for a while. Look at something 20 feet away for 20 seconds.",
    type: 'moderate' as const,
  },
  urgent: {
    text: 'Your eyes are working hard right now. Close them for 30 seconds — seriously.',
    type: 'urgent' as const,
  },
}

export function getFallbackNudge(score: number) {
  if (score > 75) return FALLBACK_NUDGES.urgent
  if (score >= 55) return FALLBACK_NUDGES.moderate
  return FALLBACK_NUDGES.mild
}
