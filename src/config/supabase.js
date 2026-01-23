// =============================================================================
// SUPABASE CONFIGURATION
// =============================================================================
// This file contains the configuration for connecting to Supabase.
//
// Setup Instructions:
// 1. Go to https://supabase.com and create a free account
// 2. Create a new project
// 3. Go to Project Settings > API
// 4. Copy the Project URL and anon/public API key
// 5. Create a .env file in the project root with:
//    VITE_SUPABASE_URL=your_project_url
//    VITE_SUPABASE_ANON_KEY=your_anon_key
// 6. Add .env to .gitignore to keep credentials secure
// =============================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please configure environment variables.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// =============================================================================
// DATABASE SCHEMA
// =============================================================================
// Run this SQL in your Supabase SQL Editor to create the necessary table:
//
// CREATE TABLE volunteer_requests (
//   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
//   name TEXT NOT NULL,
//   email TEXT NOT NULL,
//   phone TEXT NOT NULL,
//   preferred_date DATE NOT NULL,
//   group_size INTEGER NOT NULL,
//   organization TEXT,
//   notes TEXT,
//   status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
//   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
//   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
// );
//
// -- Enable Row Level Security
// ALTER TABLE volunteer_requests ENABLE ROW LEVEL SECURITY;
//
// -- Allow public inserts (for form submissions)
// CREATE POLICY "Allow public inserts" ON volunteer_requests
//   FOR INSERT TO anon
//   WITH CHECK (true);
//
// -- Allow public reads (needed for confirmation page)
// CREATE POLICY "Allow public reads" ON volunteer_requests
//   FOR SELECT TO anon
//   USING (true);
//
// -- Allow public updates (for status changes from confirmation links)
// CREATE POLICY "Allow public updates" ON volunteer_requests
//   FOR UPDATE TO anon
//   USING (true)
//   WITH CHECK (true);
//
// -- Create an index for better query performance
// CREATE INDEX idx_volunteer_requests_email ON volunteer_requests(email);
// CREATE INDEX idx_volunteer_requests_status ON volunteer_requests(status);
// CREATE INDEX idx_volunteer_requests_created_at ON volunteer_requests(created_at DESC);
//
// =============================================================================
