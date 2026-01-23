-- Connection Nights Database Schema for Supabase

-- Create the connection_nights table
CREATE TABLE IF NOT EXISTS connection_nights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Location info
  location_id TEXT NOT NULL,
  location_name TEXT NOT NULL,
  location_address TEXT NOT NULL,

  -- Time slot
  time_slot_id TEXT NOT NULL,
  time_slot_day TEXT NOT NULL,
  time_slot_time TEXT NOT NULL,
  alternate_date_time TEXT,

  -- Group info
  is_individual BOOLEAN NOT NULL DEFAULT false,
  group_name TEXT NOT NULL,
  group_size INTEGER NOT NULL,

  -- Contact info
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,

  -- Event details
  food_plan TEXT NOT NULL,
  food_details TEXT,
  activity_plan TEXT NOT NULL,
  activity_details TEXT,
  property_notes TEXT,

  -- Recipients
  mission_advancement_email TEXT NOT NULL,
  property_manager_email TEXT NOT NULL,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending',
  -- Status values: 'pending', 'approved', 'denied', 'completed', 'cancelled'

  -- Approval tracking
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  denial_reason TEXT,

  -- Confirmation token for approve/deny links
  confirmation_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_connection_nights_status ON connection_nights(status);
CREATE INDEX IF NOT EXISTS idx_connection_nights_created_at ON connection_nights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_connection_nights_token ON connection_nights(confirmation_token);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_connection_nights_updated_at
  BEFORE UPDATE ON connection_nights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE connection_nights ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public inserts (for form submissions)
CREATE POLICY "Allow public insert" ON connection_nights
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policy to allow public read access with token (for approve/deny pages)
CREATE POLICY "Allow public read with token" ON connection_nights
  FOR SELECT
  TO anon
  USING (true);

-- Create policy to allow public updates with token (for approve/deny actions)
CREATE POLICY "Allow public update with token" ON connection_nights
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Note: In production, you'd want more restrictive policies,
-- but for simplicity we're allowing public access with token verification in the API layer
