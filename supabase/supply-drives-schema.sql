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
  confirmation_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  denial_reason TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  person_id UUID REFERENCES people(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add token column to existing tables if migrating
ALTER TABLE supply_drives ADD COLUMN IF NOT EXISTS confirmation_token TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT;
ALTER TABLE supply_drives ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE supply_drives ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_supply_drives_token ON supply_drives(confirmation_token);

CREATE INDEX IF NOT EXISTS idx_supply_drives_status ON supply_drives(status);
CREATE INDEX IF NOT EXISTS idx_supply_drives_created_at ON supply_drives(created_at DESC);

ALTER TABLE supply_drives ENABLE ROW LEVEL SECURITY;
