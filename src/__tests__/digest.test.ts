// Digest aggregation unit tests (pure logic, no network)

interface MockRow {
  strain_score: number
  ts: string
  nudge_triggered: boolean
}

function aggregateDigest(rows: MockRow[]) {
  if (rows.length < 5) return null

  const scores = rows.map((r) => r.strain_score)
  const avg_score = scores.reduce((a, b) => a + b, 0) / scores.length
  const peak_score = Math.max(...scores)
  const peakRow = rows.find((r) => r.strain_score === peak_score)
  const nudge_count = rows.filter((r) => r.nudge_triggered).length

  return { avg_score, peak_score, peak_ts: peakRow?.ts, nudge_count, total_windows: rows.length }
}

function makeRow(score: number, nudge = false): MockRow {
  return { strain_score: score, ts: new Date().toISOString(), nudge_triggered: nudge }
}

describe('digest aggregation', () => {
  it('returns null when fewer than 5 windows', () => {
    expect(aggregateDigest([makeRow(50), makeRow(60), makeRow(40)])).toBeNull()
    expect(aggregateDigest([])).toBeNull()
  })

  it('returns data when 5+ windows', () => {
    const rows = Array.from({ length: 5 }, () => makeRow(50))
    expect(aggregateDigest(rows)).not.toBeNull()
  })

  it('correctly identifies peak strain window', () => {
    const rows = [
      makeRow(30),
      makeRow(80),
      makeRow(20),
      makeRow(60),
      makeRow(45),
    ]
    const result = aggregateDigest(rows)!
    expect(result.peak_score).toBe(80)
  })

  it('counts only nudge_triggered=true rows', () => {
    const rows = [
      makeRow(50, true),
      makeRow(60, false),
      makeRow(55, true),
      makeRow(45, false),
      makeRow(40, false),
    ]
    const result = aggregateDigest(rows)!
    expect(result.nudge_count).toBe(2)
  })

  it('computes correct average score', () => {
    const rows = [20, 40, 60, 80, 100].map((s) => makeRow(s))
    const result = aggregateDigest(rows)!
    expect(result.avg_score).toBe(60)
  })
})
