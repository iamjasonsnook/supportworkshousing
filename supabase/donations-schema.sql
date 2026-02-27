-- Donations table schema
-- Run in Supabase SQL Editor. Safe to re-run (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_payment_intent_id TEXT UNIQUE,
  bloomerang_transaction_id TEXT,
  amount NUMERIC(10,2) NOT NULL,
  donation_type TEXT NOT NULL DEFAULT 'one-time',
  donor_name TEXT NOT NULL DEFAULT 'Anonymous',
  donor_email TEXT,
  donor_phone TEXT,
  donor_address TEXT,
  person_id UUID REFERENCES people(id) ON DELETE SET NULL,
  recurring_donation_id UUID REFERENCES recurring_donations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_donations_person_id ON donations(person_id);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at DESC);

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
