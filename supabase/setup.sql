-- Fixate — full database schema. Safe to run multiple times (idempotent).
-- Apply in: Supabase Dashboard → SQL Editor → New query → paste → Run.

-- 1) focus_windows — per-minute eye-strain metrics ---------------------------
create table if not exists focus_windows (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 text not null,
  ts                      timestamptz not null,
  blink_rate              float4 not null,
  fixation_count          int4 not null,
  pupil_diameter_variance float4 not null,
  strain_score            float4 not null check (strain_score >= 0 and strain_score <= 100),
  session_duration_min    int4 not null,
  tracking_quality        text not null default 'good'
                            check (tracking_quality in ('good', 'degraded')),
  nudge_triggered         boolean not null default false,
  session_id              uuid,
  created_at              timestamptz not null default now()
);

-- Adds session_id if focus_windows already existed without it.
alter table focus_windows add column if not exists session_id uuid;

alter table focus_windows enable row level security;
drop policy if exists "users_own_windows" on focus_windows;
create policy "users_own_windows" on focus_windows
  for all using (auth.uid()::text = user_id);

create index if not exists focus_windows_user_ts on focus_windows (user_id, ts desc);
create index if not exists focus_windows_session on focus_windows (session_id);

-- 2) sessions — one row per tracking run -------------------------------------
create table if not exists sessions (
  id           uuid primary key,
  user_id      text not null,
  name         text not null,
  started_at   timestamptz not null,
  ended_at     timestamptz,
  window_count int4    not null default 0,
  avg_score    float4,
  peak_score   float4,
  duration_min int4    not null default 0,
  created_at   timestamptz not null default now()
);

alter table sessions enable row level security;
drop policy if exists "users_own_sessions" on sessions;
create policy "users_own_sessions" on sessions
  for all using (auth.uid()::text = user_id);

create index if not exists sessions_user_started on sessions (user_id, started_at desc);

-- Make the new tables visible to the API immediately (clears the schema cache).
notify pgrst, 'reload schema';
