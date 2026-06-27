import { NextRequest, NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'
import { createServiceClient } from '@/lib/supabaseClient'
import type { EndSessionBody } from '@/lib/types'

export const runtime = 'nodejs'

// POST — called when a tracking session stops. Upserts the session row with the
// aggregates the client computed from this run's windows.
export async function POST(req: NextRequest) {
  const session = await auth0.getSession(req)
  if (!session?.user?.sub) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.sub

  let body: EndSessionBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.id || !body.started_at) {
    return NextResponse.json({ error: 'id and started_at required' }, { status: 422 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from('sessions').upsert(
    {
      id: body.id,
      user_id: userId,
      name: body.name,
      started_at: body.started_at,
      ended_at: body.ended_at,
      window_count: body.window_count,
      avg_score: body.avg_score,
      peak_score: body.peak_score,
      duration_min: body.duration_min,
    },
    { onConflict: 'id' }
  )

  if (error) {
    console.error('Session upsert error:', error)
    return NextResponse.json({ error: 'DB error', detail: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: body.id })
}

// PATCH — rename a session. Body: { id, name }.
export async function PATCH(req: NextRequest) {
  const session = await auth0.getSession(req)
  if (!session?.user?.sub) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.sub

  let body: { id?: string; name?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const name = body.name?.trim()
  if (!body.id || !name) {
    return NextResponse.json({ error: 'id and name required' }, { status: 422 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('sessions')
    .update({ name })
    .eq('id', body.id)
    .eq('user_id', userId)

  if (error) {
    console.error('Session rename error:', error)
    return NextResponse.json({ error: 'DB error', detail: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: body.id, name })
}
