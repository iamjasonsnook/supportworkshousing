-- Applied to production 2026-11-06 (migration admin_login_attempts).
-- Failed admin logins, so lockouts hold across Vercel instances (api/_loginGuard.js).
create table if not exists public.admin_login_attempts (
  id bigint generated always as identity primary key,
  ip text not null,
  succeeded boolean not null default false,
  at timestamptz not null default now()
);
create index if not exists admin_login_attempts_at_idx on public.admin_login_attempts (at);
create index if not exists admin_login_attempts_ip_at_idx on public.admin_login_attempts (ip, at);
alter table public.admin_login_attempts enable row level security;
-- Service role only: no policies for anyone else, and no table privileges.
revoke all on table public.admin_login_attempts from anon, authenticated;
