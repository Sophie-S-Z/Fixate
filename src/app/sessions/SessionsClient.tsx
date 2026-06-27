'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TopNav } from '@/components/TopNav'
import type { Session } from '@/lib/types'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function strainColor(score: number | null) {
  if (score == null) return '#7d8694'
  if (score < 35) return '#56d364'
  if (score < 65) return '#e3b341'
  return '#ff7b72'
}

export function SessionsClient({
  sessions: initial,
  userLabel,
}: {
  sessions: Session[]
  userLabel?: string
}) {
  const [sessions, setSessions] = useState(initial)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  function startEdit(s: Session) {
    setEditingId(s.id)
    setDraft(s.name)
  }

  async function save(id: string) {
    const name = draft.trim()
    if (!name) {
      setEditingId(null)
      return
    }
    setSavingId(id)
    try {
      const res = await fetch('/api/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name }),
      })
      if (res.ok) {
        setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)))
      }
    } catch {
      /* keep old name on failure */
    } finally {
      setSavingId(null)
      setEditingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <TopNav userLabel={userLabel} />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="font-sora text-2xl font-bold text-[#e6edf3]">Sessions</h1>
            <p className="text-sm text-[#7d8694] mt-0.5">
              {sessions.length} tracked session{sessions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link
            href="/"
            className="text-sm bg-[#a5d6ff] hover:bg-[#8fc8ff] text-[#0d1117] font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            ▶ Start tracking
          </Link>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-[#161b22] rounded-2xl border border-white/[0.08] p-12 text-center">
            <p className="text-[#b9c2cd] font-medium">No sessions yet</p>
            <p className="text-sm text-[#7d8694] mt-1">
              Start a tracking session and it&apos;ll show up here.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {sessions.map((s) => {
              const editing = editingId === s.id
              return (
                <li
                  key={s.id}
                  className="bg-[#161b22] rounded-xl border border-white/[0.08] p-4 flex items-center justify-between gap-4 hover:border-white/[0.16] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    {editing ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') save(s.id)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          className="bg-[#0d1117] border border-[#a5d6ff]/40 rounded-lg px-2.5 py-1.5 text-sm text-[#e6edf3] w-full max-w-xs focus:outline-none focus:border-[#a5d6ff]"
                        />
                        <button
                          onClick={() => save(s.id)}
                          disabled={savingId === s.id}
                          className="text-xs font-semibold text-[#a5d6ff] hover:text-white disabled:opacity-50"
                        >
                          {savingId === s.id ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs text-[#7d8694] hover:text-[#b9c2cd]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <Link
                        href={`/sessions/${s.id}`}
                        className="font-sora text-[15px] font-semibold text-[#e6edf3] hover:text-[#a5d6ff] transition-colors truncate block"
                      >
                        {s.name}
                      </Link>
                    )}
                    <div className="text-xs text-[#7d8694] mt-1">
                      {fmtDate(s.started_at)} · {s.duration_min}m · {s.window_count} window
                      {s.window_count !== 1 ? 's' : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div
                        className="font-dm-mono text-lg font-bold tabular-nums"
                        style={{ color: strainColor(s.avg_score) }}
                      >
                        {s.avg_score != null ? Math.round(s.avg_score) : '—'}
                      </div>
                      <div className="text-[10px] uppercase tracking-wide text-[#7d8694]">avg strain</div>
                    </div>
                    {!editing && (
                      <button
                        onClick={() => startEdit(s)}
                        className="text-xs text-[#7d8694] hover:text-[#b9c2cd] border border-white/[0.08] rounded-lg px-2.5 py-1.5 transition-colors"
                      >
                        Rename
                      </button>
                    )}
                    <Link
                      href={`/sessions/${s.id}`}
                      className="text-[#7d8694] hover:text-[#a5d6ff] transition-colors"
                      aria-label="View session"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}
