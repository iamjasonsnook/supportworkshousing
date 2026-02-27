-- RLS Lockdown Migration
-- Run this in Supabase SQL Editor to replace wide-open policies
-- with service-role-only access. All API endpoints already use the
-- service_role key, so no application changes are needed.

-- ─── connection_nights ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Allow public insert" ON connection_nights;
DROP POLICY IF EXISTS "Allow public read with token" ON connection_nights;
DROP POLICY IF EXISTS "Allow public update with token" ON connection_nights;
DROP POLICY IF EXISTS "Service role full access" ON connection_nights;

CREATE POLICY "Service role full access" ON connection_nights
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ─── people ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Service role full access" ON people;

CREATE POLICY "Service role full access" ON people
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ─── recurring_donations ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Service role full access" ON recurring_donations;

CREATE POLICY "Service role full access" ON recurring_donations
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ─── interactions ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Service role full access" ON interactions;

CREATE POLICY "Service role full access" ON interactions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ─── donations ──────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Service role full access" ON donations;

CREATE POLICY "Service role full access" ON donations
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ─── supply_drives ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Service role full access" ON supply_drives;

CREATE POLICY "Service role full access" ON supply_drives
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
