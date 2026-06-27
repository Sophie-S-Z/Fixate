import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabaseClient'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const resend = new Resend(process.env.RESEND_API_KEY)
  const secret = req.headers.get('x-digest-secret')
  if (secret !== process.env.DIGEST_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user_id')
  // DIGEST_TO overrides the recipient (see trigger-digest for why).
  const userEmail = process.env.DIGEST_TO ?? searchParams.get('email')

  if (!userId || !userEmail) {
    return NextResponse.json(
      { error: 'user_id and email required' },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()

  const { data: rows, error } = await supabase
    .from('focus_windows')
    .select('strain_score, ts, nudge_triggered')
    .eq('user_id', userId)
    .gte('ts', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('ts', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'DB query failed' }, { status: 500 })
  }

  if (!rows || rows.length < 5) {
    return NextResponse.json(
      { message: 'Insufficient data — skipping digest' },
      { status: 200 }
    )
  }

  const scores = rows.map((r) => r.strain_score)
  const avg_score = scores.reduce((a, b) => a + b, 0) / scores.length
  const peak_score = Math.max(...scores)
  const peakRow = rows.find((r) => r.strain_score === peak_score)
  const peak_ts = peakRow?.ts
    ? new Date(peakRow.ts).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'unknown'
  const nudge_count = rows.filter((r) => r.nudge_triggered).length
  const total_windows = rows.length

  const promptText = `This user tracked focus data today. Windows: ${total_windows} (each is 1 minute). Average strain score: ${avg_score.toFixed(1)}/100. Peak strain: ${peak_score.toFixed(1)}/100 at ${peak_ts}. Nudges triggered: ${nudge_count}. Write a 3-4 sentence personalized daily summary email body. Mention specific numbers. End with one habit recommendation for tomorrow. Tone: warm, direct, not clinical. No headers, no bullet points.`

  let digestBody: string
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 200,
      messages: [{ role: 'user', content: promptText }],
    })
    digestBody =
      msg.content[0].type === 'text' ? msg.content[0].text : ''
  } catch {
    digestBody = `You tracked ${total_windows} minutes today with an average strain score of ${avg_score.toFixed(1)}/100. Your peak was ${peak_score.toFixed(1)} at ${peak_ts}. ${nudge_count} nudges were triggered. Try taking more frequent blink breaks tomorrow.`
  }

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Your Fixate day</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; color: #1a1a1a; background: #ffffff;">
  <div style="margin-bottom: 32px;">
    <span style="font-size: 24px; font-weight: 700; letter-spacing: -0.5px; color: #6366f1;">Fixate</span>
    <span style="display: block; font-size: 13px; color: #6b7280; margin-top: 4px;">${dateStr}</span>
  </div>

  <div style="background: #f8f7ff; border-left: 4px solid #6366f1; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 28px;">
    <div style="display: flex; gap: 32px; flex-wrap: wrap;">
      <div>
        <div style="font-size: 28px; font-weight: 700; color: #6366f1;">${avg_score.toFixed(0)}</div>
        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Avg strain</div>
      </div>
      <div>
        <div style="font-size: 28px; font-weight: 700; color: #ef4444;">${peak_score.toFixed(0)}</div>
        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Peak</div>
      </div>
      <div>
        <div style="font-size: 28px; font-weight: 700; color: #1a1a1a;">${total_windows}</div>
        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Min tracked</div>
      </div>
      <div>
        <div style="font-size: 28px; font-weight: 700; color: #f59e0b;">${nudge_count}</div>
        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Nudges</div>
      </div>
    </div>
  </div>

  <div style="font-size: 15px; line-height: 1.7; color: #374151; margin-bottom: 32px;">
    ${digestBody}
  </div>

  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 12px; color: #9ca3af;">
    Fixate tracks eye strain using browser-only WebAssembly — no video or camera data ever leaves your device.
  </div>
</body>
</html>`

  const from = process.env.RESEND_FROM ?? 'Fixate <onboarding@resend.dev>'
  try {
    const { error: sendError } = await resend.emails.send({
      from,
      to: userEmail,
      subject: `Your Fixate day — ${dateStr}`,
      html: htmlBody,
    })
    if (sendError) {
      console.error('Resend error:', sendError)
      return NextResponse.json(
        { error: 'Email send failed', detail: sendError.message },
        { status: 502 }
      )
    }
  } catch (err) {
    console.error('Resend threw:', err)
    return NextResponse.json(
      { error: 'Email send failed', detail: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    )
  }

  return NextResponse.json({ sent: true, windows: total_windows })
}
