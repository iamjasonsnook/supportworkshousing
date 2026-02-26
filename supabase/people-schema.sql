-- People / CRM Schema Migration
-- Run this in Supabase SQL Editor to create the people, recurring_donations,
-- and interactions tables, plus add person_id FK to existing tables.
--
-- Prerequisites: the update_updated_at_column() trigger function must already
-- exist (created by connection_nights schema).

-- ─── people — central constituent record ──────────────────────────────────────

CREATE TABLE people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Type & Status
  type TEXT NOT NULL DEFAULT 'Individual'
    CHECK (type IN ('Individual', 'Organization')),
  status TEXT NOT NULL DEFAULT 'Active'
    CHECK (status IN ('Active', 'Inactive', 'Deceased', 'Merged')),

  -- Name (Bloomerang-compatible)
  first_name TEXT,
  last_name TEXT,
  middle_name TEXT,
  prefix TEXT,
  suffix TEXT,
  informal_name TEXT,
  formal_name TEXT,
  envelope_name TEXT,
  recognition_name TEXT,

  -- Organization (org name if type=Organization, employer if type=Individual)
  organization_name TEXT,

  -- Professional
  job_title TEXT,
  website TEXT,

  -- Demographics
  gender TEXT,
  birthdate DATE,

  -- Primary contact (top-level for fast WHERE clauses)
  primary_email TEXT,
  primary_phone TEXT,

  -- Primary address
  address_street TEXT,
  address_city TEXT,
  address_state TEXT,
  address_postal_code TEXT,
  address_country TEXT DEFAULT 'US',

  -- Additional contact info (JSONB arrays)
  additional_emails JSONB DEFAULT '[]'::jsonb,
  additional_phones JSONB DEFAULT '[]'::jsonb,
  additional_addresses JSONB DEFAULT '[]'::jsonb,

  -- Roles (fast filter with GIN index)
  roles TEXT[] NOT NULL DEFAULT '{}',

  -- Engagement
  engagement_score INTEGER,

  -- External IDs
  bloomerang_id BIGINT UNIQUE,
  stripe_customer_id TEXT UNIQUE,

  -- Communication preferences
  communication_preferences JSONB DEFAULT '{}'::jsonb,

  -- Custom fields (Bloomerang CustomFields + ad-hoc data)
  custom_fields JSONB DEFAULT '{}'::jsonb,

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_people_primary_email ON people(primary_email);
CREATE INDEX idx_people_last_name ON people(last_name);
CREATE INDEX idx_people_organization_name ON people(organization_name);
CREATE INDEX idx_people_type ON people(type);
CREATE INDEX idx_people_status ON people(status);
CREATE INDEX idx_people_roles ON people USING gin(roles);
CREATE INDEX idx_people_bloomerang_id ON people(bloomerang_id);
CREATE INDEX idx_people_created_at ON people(created_at DESC);

CREATE TRIGGER update_people_updated_at
  BEFORE UPDATE ON people
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE people ENABLE ROW LEVEL SECURITY;

-- ─── recurring_donations — subscription lifecycle ─────────────────────────────

CREATE TABLE recurring_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES people(id) ON DELETE SET NULL,

  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,

  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  frequency TEXT NOT NULL DEFAULT 'monthly'
    CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'annually')),

  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'cancelled', 'past_due', 'incomplete')),

  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_charge_date DATE,
  cancelled_at TIMESTAMPTZ,

  fund_name TEXT DEFAULT 'General Fund',
  bloomerang_recurring_gift_id BIGINT,

  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recurring_donations_person_id ON recurring_donations(person_id);
CREATE INDEX idx_recurring_donations_status ON recurring_donations(status);

CREATE TRIGGER update_recurring_donations_updated_at
  BEFORE UPDATE ON recurring_donations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE recurring_donations ENABLE ROW LEVEL SECURITY;

-- ─── interactions — activity log / correspondence history ─────────────────────

CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES people(id) ON DELETE CASCADE,

  type TEXT NOT NULL
    CHECK (type IN (
      'email_sent', 'email_received',
      'phone_call', 'meeting', 'note',
      'form_submission', 'donation', 'event_attendance',
      'system'
    )),

  subject TEXT,
  body TEXT,
  direction TEXT
    CHECK (direction IS NULL OR direction IN ('inbound', 'outbound')),

  metadata JSONB DEFAULT '{}'::jsonb,

  created_by TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_interactions_person_id ON interactions(person_id);
CREATE INDEX idx_interactions_type ON interactions(type);
CREATE INDEX idx_interactions_occurred_at ON interactions(occurred_at DESC);

ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

-- ─── Alter existing tables — add person_id FK ─────────────────────────────────

ALTER TABLE donations
  ADD COLUMN person_id UUID REFERENCES people(id) ON DELETE SET NULL;
ALTER TABLE donations
  ADD COLUMN recurring_donation_id UUID REFERENCES recurring_donations(id) ON DELETE SET NULL;
CREATE INDEX idx_donations_person_id ON donations(person_id);

ALTER TABLE connection_nights
  ADD COLUMN person_id UUID REFERENCES people(id) ON DELETE SET NULL;
CREATE INDEX idx_connection_nights_person_id ON connection_nights(person_id);

ALTER TABLE supply_drives
  ADD COLUMN person_id UUID REFERENCES people(id) ON DELETE SET NULL;
CREATE INDEX idx_supply_drives_person_id ON supply_drives(person_id);
