-- Applied to production 2026-11-06 (migration donor_tables_service_role_only).
--
-- Second lock on donor data: row-level security already allows only the
-- service role, but anon/authenticated still held table privileges, so the
-- data would be open if a policy were ever dropped. The website uses the
-- service-role key for all of these; the survey app never touches them.
revoke all on table public.donations, public.people, public.recurring_donations,
  public.interactions, public.connection_nights, public.supply_drives
  from anon, authenticated;

-- Supabase linter: pin the trigger function's search_path.
alter function public.update_updated_at_column() set search_path = public, pg_temp;
