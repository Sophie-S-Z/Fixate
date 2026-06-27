# Fixate — Developer Handoff

**Date:** 2026-06-27  
**Status:** Feature-complete, production-ready, Vercel Hackathon submission.  
**Stack:** Next.js 16.2.9 · Auth0 v4 · MediaPipe Tasks Vision · Supabase · Anthropic Claude · Resend

---

## What Fixate Does

Fixate is a browser-only real-time eye strain tracker. It uses your webcam and MediaPipe's WebAssembly face landmarker to measure three signals every second: blink rate (Eye Aspect Ratio), gaze fixation events, and pupil radius variance. Every 60 seconds those raw signals are scored into a 0–100 "Focus Debt Score". When the score crosses thresholds, Claude writes a personalized nudge. A nightly digest email summarizes the day. No video or images ever leave the browser — only numeric scores are stored.

---

## Repository Layout

```
fixate/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Server component — reads Auth0 session, passes user to HomeClient
│   │   ├── HomeClient.tsx            # All client-side tracking UI (see Phase State Machine below)
│   │   ├── layout.tsx                # Wraps app in Auth0Provider
│   │   ├── dashboard/
│   │   │   ├── page.tsx              # Server component — fetches Supabase rows, computes summary
│   │   │   └── DashboardClient.tsx   # Chart, summary cards, digest button
│   │   └── api/
│   │       ├── auth/[auth0]/route.ts # Auth0 v4 route handler (login/callback/logout)
│   │       ├── ingest-window/        # POST — saves 60s window, calls Claude for nudge
│   │       ├── trigger-digest/       # POST — reads today's windows, calls Claude, sends via Resend
│   │       └── send-digest/          # POST — cron-triggered variant (uses DIGEST_SECRET header)
│   ├── hooks/
│   │   ├── useMediaPipe.ts           # Camera, MediaPipe init, blink/fixation/pupil detection loop
│   │   ├── useSession.ts             # Scores raw windows, calls ingest-window API, manages nudge state
│   │   └── usePictureInPicture.ts    # Document PiP window (always-on-top across tabs)
│   ├── components/
│   │   ├── FocusGauge.tsx            # SVG arc gauge, three color zones
│   │   ├── BlinkRate.tsx             # Numeric display with color-coded health status
│   │   ├── SessionTimer.tsx          # hh:mm style elapsed time
│   │   ├── NudgeOverlay.tsx          # Three severity styles: toast / banner / full-screen modal
│   │   ├── TrackingWidget.tsx        # Collapsible floating widget (alt view, not primary)
│   │   ├── DashboardChart.tsx        # Recharts line chart with threshold reference lines
│   │   ├── DailySummaryBar.tsx       # Four stat cards: avg, peak, min, nudges
│   │   └── PrivacyModal.tsx          # First-session consent before camera access
│   └── lib/
│       ├── types.ts                  # All shared TypeScript interfaces
│       ├── scorer.ts                 # Pure function: RawWindowMetrics → FocusWindow | null
│       ├── nudgeEngine.ts            # NudgeThresholdEngine class: acute + chronic triggers
│       ├── auth0.ts                  # Auth0Client singleton
│       ├── supabaseClient.ts         # Lazy factory: createServiceClient() — never module-level
│       └── fallbackNudges.ts         # Static nudge strings if Claude API is unavailable
├── supabase/
│   └── migrations/
│       └── 001_focus_windows.sql     # Table DDL + RLS policy + index
├── src/__tests__/
│   ├── scorer.test.ts
│   ├── nudgeEngine.test.ts
│   └── digest.test.ts                # 17 tests, all passing
├── proxy.ts                          # Auth0 v4 middleware (NOT middleware.ts — see Critical Details)
├── .env.local.example                # All required env vars with comments
└── HANDOFF.md                        # This file
```

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in every value. On Vercel, add these in Project → Settings → Environment Variables.

| Variable | Where to get it |
|---|---|
| `AUTH0_DOMAIN` | Auth0 Dashboard → Application → Domain |
| `AUTH0_CLIENT_ID` | Auth0 Dashboard → Application → Client ID |
| `AUTH0_CLIENT_SECRET` | Auth0 Dashboard → Application → Client Secret |
| `AUTH0_SECRET` | Run `openssl rand -hex 32` in your terminal |
| `APP_BASE_URL` | `http://localhost:3000` locally; your Vercel URL in production |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API (service_role) |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `RESEND_API_KEY` | resend.com → API Keys |
| `DIGEST_SECRET` | Any random string — used to authenticate cron calls to `/api/send-digest` |

**Auth0 Dashboard settings required:**
- Allowed Callback URLs: `http://localhost:3000/auth/callback` (+ your production URL)
- Allowed Logout URLs: `http://localhost:3000` (+ your production URL)

---

## Phase State Machine (HomeClient.tsx)

The entire authenticated tracking UX is a four-phase state machine in `TrackingView`:

```
idle ──[Start tracking]──► privacy ──[Allow camera]──► active ──[Stop session]──► ended
 ▲                                                                                   │
 └───────────────────────────[Start another session]───────────────────────────────┘
```

| Phase | What renders |
|---|---|
| `idle` | Welcome screen with "Start tracking" and "View history" |
| `privacy` | `PrivacyModal` — explains what data is/isn't collected, requests camera permission |
| `active` | Full tracking dashboard: camera feed, FocusGauge, BlinkRate, SessionTimer, Stop button, Pop out button |
| `ended` | `SessionSummary` — shows final stats, "Send results to email", "Start another session", "View full history" |

`useMediaPipe(phase === 'active')` — the camera starts and stops based on this boolean. Setting phase to anything other than `'active'` immediately triggers the hook's cleanup: `cancelAnimationFrame`, `clearInterval`, `stream.getTracks().forEach(t => t.stop())`, `faceLandmarker.close()`.

On "Start another session", phase goes directly to `'active'` (bypasses `'privacy'` — consent was already given).

---

## Data Flow (one 60-second window)

```
Camera frame (rAF loop)
  │
  ├─ calcEAR() ──► blink detection (EAR < 0.22 for ≥2 frames = blink)
  ├─ pupil radius ──► accumulated into pupilSamplesRef[]
  └─ nose landmark delta ──► fixation event counting
         │
         │  every 60 seconds
         ▼
  RawWindowMetrics { blinkCount, fixationEvents, pupilRadiusSamples, trackingQuality }
         │
         ▼  useSession → computeFocusWindow() [scorer.ts]
  FocusWindow { strain_score, blink_rate, fixation_count, pupil_diameter_variance }
         │
         ├─ NudgeThresholdEngine.evaluate()
         │     ├─ acute trigger: single window score > 70
         │     └─ chronic trigger: rolling 20-window avg > 50
         │               │
         │               ▼  POST /api/ingest-window
         │         Claude generates nudge text (model: claude-opus-4-8)
         │         → NudgeOverlay displayed
         │
         └─ POST /api/ingest-window → Supabase focus_windows table
```

---

## Scoring Formula

```
strain_score =
  clamp((15 - blinkCount) / 15,       0, 1) × 50   // blink component   (max 50pts)
+ clamp((fixationEvents - 30) / 30,   0, 1) × 30   // fixation component (max 30pts)
+ clamp((pupilVariance - 0.015)/0.015, 0, 1) × 20  // pupil component   (max 20pts)
```

Interpretation: 0–34 = low strain (green), 35–64 = moderate (amber), 65–100 = high (red).

Returns `null` (window discarded) if `trackingQuality === 'lost'`.

---

## Critical Technical Details

### Auth0 v4 Breaking Changes
This project uses `@auth0/nextjs-auth0@4.x`, which is a complete rewrite. If you come from v2/v3, **nothing is the same**:

- The middleware file is `proxy.ts` (not `middleware.ts`), and the export must be named `proxy` (not `default` or `middleware`).
- `.bind(auth0)` is required: `export const proxy = auth0.middleware.bind(auth0)`. Without it, `this` is lost and you get `Cannot read properties of undefined (reading 'provider')`.
- There is no `handleAuth`, `getSession(req, res)`, `withApiAuthRequired`, or `UserProvider`. Use `auth0.getSession(req)` in route handlers and `Auth0Provider` (from `/client`) in layout.
- The auth routes are at `/auth/*` (not `/api/auth/*`).

### Supabase / Resend / Anthropic — Lazy Initialization
**Never** instantiate these clients at module level. Next.js evaluates server modules at build time, and the env vars are not available then. Every API route creates its client inside the handler function:

```ts
// ✗ WRONG — crashes at build time
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, ...)

// ✓ CORRECT — only runs at request time
export async function POST(req) {
  const supabase = createServiceClient()  // reads env inside the function
}
```

### `<video>` Element Must Be in the DOM Before `init()` Attaches the Stream
`useMediaPipe(started)` only calls `init()` when `started` becomes `true`. The `<video ref={videoRef}>` element must be mounted before `init()` tries to attach the camera stream. In `HomeClient.tsx`, the video is rendered immediately when `phase === 'active'` starts (not behind a loading gate). The loading spinner is an absolute overlay on top of the always-mounted video container. A 2-second polling fallback (`while (!videoRef.current)`) exists in `useMediaPipe.ts` as a safety net.

### MediaPipe `.close()` in React StrictMode
React StrictMode mounts → unmounts → remounts effects. `faceLandmarker.close()` throws if the model hasn't finished initializing. Wrapped in `try { ... } catch {}`.

### `npm audit fix --force` Will Break This Project
Running `npm audit fix --force` downgrades Next.js from 16.2.9 → 9.3.3 (and jest/ts-jest similarly), because npm treats major-version downgrades as "fixes." If the project breaks after running it, restore with:
```
npm install next@16.2.9 jest@30.4.2 ts-jest@29.4.11 --save-exact
```

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.local.example .env.local
# Fill in all values in .env.local

# 3. Apply Supabase migration
# Go to Supabase Dashboard → SQL Editor, paste contents of:
# supabase/migrations/001_focus_windows.sql

# 4. Run dev server
npm run dev
# App available at http://localhost:3000

# 5. Run tests
npm test
```

---

## Deployment (Vercel)

1. Push to GitHub
2. Import repo in Vercel
3. Add all env vars from `.env.local.example` under Project → Settings → Environment Variables
4. Update `APP_BASE_URL` to your Vercel production URL
5. Update Auth0 Dashboard — add the Vercel URL to Allowed Callback URLs and Allowed Logout URLs
6. Deploy

The app uses `export const runtime = 'edge'` on all API routes. This is compatible with Vercel's edge runtime. No special Vercel config needed beyond env vars.

---

## API Routes

### `POST /api/ingest-window`
Called every 60 seconds by `useSession`. Requires Auth0 session cookie.

Request body (`IngestWindowBody`):
```json
{
  "ts": "2026-06-27T14:00:00.000Z",
  "blink_rate": 12,
  "fixation_count": 38,
  "pupil_diameter_variance": 0.018,
  "strain_score": 62,
  "session_duration_min": 15,
  "tracking_quality": "good",
  "trigger_type": null
}
```

Response: `{ window_id, nudge_text?, nudge_type? }` — `nudge_text` and `nudge_type` only present if a nudge was triggered.

### `POST /api/trigger-digest`
Called from the session summary "Send results to email" button and the dashboard. Requires Auth0 session. Reads the last 24h from Supabase, calls Claude for a personalized digest body, sends via Resend. Requires ≥5 tracked windows or returns 200 with `{ message: "Insufficient data" }`.

### `POST /api/send-digest`
Cron-triggered variant. Requires `x-digest-secret` header matching `DIGEST_SECRET` env var. Takes `?user_id=&email=` query params. For use with Vercel Cron or any external scheduler.

---

## Database Schema

```sql
CREATE TABLE focus_windows (
  id                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                 text NOT NULL,
  ts                      timestamptz NOT NULL,
  blink_rate              numeric NOT NULL,
  fixation_count          integer NOT NULL,
  pupil_diameter_variance numeric NOT NULL,
  strain_score            numeric NOT NULL CHECK (strain_score >= 0 AND strain_score <= 100),
  session_duration_min    integer NOT NULL,
  tracking_quality        text NOT NULL,
  nudge_triggered         boolean NOT NULL DEFAULT false,
  created_at              timestamptz DEFAULT now()
);

-- RLS: users can only see their own rows
ALTER TABLE focus_windows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own windows"
  ON focus_windows FOR ALL
  USING (user_id = auth.uid()::text);

CREATE INDEX idx_focus_windows_user_ts ON focus_windows(user_id, ts DESC);
```

The service-role key bypasses RLS (used server-side in API routes). The anon key respects RLS (used client-side if ever needed).

---

## Document Picture-in-Picture

The "Pop out" button in the active tracking view calls `window.documentPictureInPicture.requestWindow()` to open a floating 260×200 window that stays on top of all other tabs. Supported in Chrome 111+ (not Safari or Firefox as of mid-2026).

The PiP window contains a dark-theme mini-dashboard (brand, score, blinks/min, session time, status dot) built with vanilla DOM in `usePictureInPicture.ts`. React cannot render into a PiP window — it's a separate document.

`updatePip(metrics)` is called every time any metric changes and updates the DOM elements directly by ID.

---

## Tests

```
src/__tests__/
├── scorer.test.ts       — computeFocusWindow: valid windows, null for lost quality, score clamping
├── nudgeEngine.test.ts  — acute trigger, chronic trigger, cooldown, reset
└── digest.test.ts       — digest route integration (Supabase mock, Claude mock, Resend mock)
```

Run with `npm test`. All 17 tests pass. Jest is configured with `ts-jest` in `jest.config.ts`.

---

## Known Limitations & Future Work

- **Document PiP browser support**: Chrome only. The "Pop out" button is hidden when `'documentPictureInPicture' in window` is false.
- **Blink detection accuracy**: EAR threshold is 0.22 tuned for typical webcam distances. Users with glasses or at unusual angles may see blink rates under-counted. Adjusting `BLINK_EAR_THRESHOLD` in `useMediaPipe.ts` can help.
- **Privacy modal on hard refresh**: `privacyAccepted` is React state, not persisted. A user who hard-refreshes during a session will see the modal again. This is intentional — the consent is per-session.
- **Digest requires ≥5 windows**: The digest endpoint returns early if fewer than 5 windows exist. A session shorter than ~5 minutes won't generate a useful email.
- **Supabase RLS and service role**: The server-side code uses the `service_role` key which bypasses RLS. If you ever add client-side Supabase queries, use the anon key and ensure RLS policies are correct.

---

## Key Files To Edit For Common Changes

| Goal | File |
|---|---|
| Change blink detection sensitivity | `src/hooks/useMediaPipe.ts` → `BLINK_EAR_THRESHOLD` |
| Change nudge trigger thresholds | `src/lib/nudgeEngine.ts` → `ACUTE_THRESHOLD`, `CHRONIC_THRESHOLD` |
| Change scoring weights | `src/lib/scorer.ts` — the three component multipliers (50, 30, 20) |
| Change Claude model | `src/app/api/ingest-window/route.ts` and `trigger-digest/route.ts` → `model:` |
| Change email from-address | `src/app/api/trigger-digest/route.ts` and `send-digest/route.ts` → `from:` |
| Change nudge cooldown | `src/lib/nudgeEngine.ts` → `COOLDOWN_MS` |
| Edit the privacy disclosure | `src/components/PrivacyModal.tsx` |
| Edit nudge fallbacks (when Claude is unavailable) | `src/lib/fallbackNudges.ts` |
