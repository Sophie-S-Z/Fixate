-- Sessions: one row per tracking run, grouping the per-minute focus_windows.
-- Aggregates are denormalized here so the Sessions list renders in a single query.
create table if not exists sessions (
  id           uuid primary key,            -- client-generated (crypto.randomUUID)
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

create policy "users_own_sessions" on sessions
  for all using (auth.uid()::text = user_id);

create index if not exists sessions_user_started
  on sessions (user_id, started_at desc);

-- Tie each focus window back to the session it belongs to (nullable: pre-existing
-- rows have no session). Used to render a single session's detail chart.
alter table focus_windows
  add column if not exists session_id uuid;

create index if not exists focus_windows_session
  on focus_windows (session_id);
