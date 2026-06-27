-- Focus windows timeseries table with RLS
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
  created_at              timestamptz not null default now()
);

-- Row-level security: users access only their own rows
alter table focus_windows enable row level security;

create policy "users_own_windows" on focus_windows
  for all using (auth.uid()::text = user_id);

-- Perf index for nightly digest and dashboard queries
create index if not exists focus_windows_user_ts
  on focus_windows (user_id, ts desc);
