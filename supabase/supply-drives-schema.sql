-- Supply Drives table schema
-- Run in Supabase SQL Editor. Safe to re-run (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS supply_drives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id TEXT,
  location_name TEXT,
  location_address TEXT,
  drop_off_date TEXT,
  drop_off_time TEXT,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  selected_items JSONB DEFAULT '[]'::jsonb,
  other_items TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','denied','completed')),
  denial_reason TEXT,
  completed_at TIMESTAMPTZ,
  person_id UUID REFERENCES people(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supply_drives_status ON supply_drives(status);
CREATE INDEX IF NOT EXISTS idx_supply_drives_created_at ON supply_drives(created_at DESC);

ALTER TABLE supply_drives ENABLE ROW LEVEL SECURITY;
