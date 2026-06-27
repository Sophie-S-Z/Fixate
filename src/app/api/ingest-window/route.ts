import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth0 } from '@/lib/auth0'
import { createServiceClient } from '@/lib/supabaseClient'
import { getFallbackNudge } from '@/lib/fallbackNudges'
import type { IngestWindowBody } from '@/lib/types'

export const runtime = 'nodejs'

function nudgeTypeFromScore(score: number): 'mild' | 'moderate' | 'urgent' {
  if (score > 75) return 'urgent'
  if (score >= 55) return 'moderate'
  return 'mild'
}

async function generateNudge(body: IngestWindowBody): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const userMessage = `Focus session: ${body.session_duration_min} minutes. Blink rate: ${body.blink_rate}/min (healthy baseline: 15/min). Fixation count this minute: ${body.fixation_count}. Strain score: ${body.strain_score}/100. Trigger type: ${body.trigger_type}. Generate a nudge.`

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 100,
    system:
      "You are a brief, warm eye health coach embedded in a focus-tracking app called Fixate. You generate short nudges (2 sentences, max 40 words) that are grounded in specific numbers. Never be alarmist. Always end with one concrete action. Avoid the word 'ensure'.",
    messages: [{ role: 'user', content: userMessage }],
  })

  return message.content[0].type === 'text' ? message.content[0].text : ''
}

export async function POST(req: NextRequest) {
  const session = await auth0.getSession(req)
  if (!session?.user?.sub) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.sub

  let body: IngestWindowBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (
    typeof body.strain_score !== 'number' ||
    body.strain_score < 0 ||
    body.strain_score > 100 ||
    typeof body.blink_rate !== 'number' ||
    typeof body.fixation_count !== 'number'
  ) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 422 })
  }

  const shouldNudge = body.trigger_type !== null && body.strain_score > 65

  const supabase = createServiceClient()

  const { data: row, error: dbError } = await supabase
    .from('focus_windows')
    .insert({
      user_id: userId,
      ts: body.ts,
      blink_rate: body.blink_rate,
      fixation_count: body.fixation_count,
      pupil_diameter_variance: body.pupil_diameter_variance,
      strain_score: body.strain_score,
      session_duration_min: body.session_duration_min,
      tracking_quality: body.tracking_quality,
      nudge_triggered: shouldNudge,
      session_id: body.session_id ?? null,
    })
    .select('id')
    .single()

  if (dbError) {
    console.error('DB insert error:', dbError)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  if (!shouldNudge) {
    return NextResponse.json({ window_id: row.id })
  }

  let nudge_text: string
  let nudge_type: 'mild' | 'moderate' | 'urgent'

  try {
    nudge_text = await generateNudge(body)
    nudge_type = nudgeTypeFromScore(body.strain_score)
  } catch (err) {
    console.error('Claude error:', err)
    const fallback = getFallbackNudge(body.strain_score)
    nudge_text = fallback.text
    nudge_type = fallback.type
  }

  return NextResponse.json({ nudge_text, nudge_type, window_id: row.id })
}
