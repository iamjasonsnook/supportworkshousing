// API endpoint to submit a new Supply Drive request
// Stores in Supabase if configured, otherwise accepts silently
// (the email notification via EmailJS is handled client-side)

import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    location_id,
    location_name,
    location_address,
    drop_off_date,
    drop_off_time,
    contact_name,
    contact_email,
    contact_phone,
    selected_items,
    other_items,
  } = req.body || {};

  // Basic validation
  if (!contact_name || !contact_email || !drop_off_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Try Supabase if configured
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data, error } = await supabase
        .from('supply_drives')
        .insert([
          {
            location_id,
            location_name,
            location_address,
            drop_off_date,
            drop_off_time,
            contact_name,
            contact_email,
            contact_phone,
            selected_items,
            other_items: other_items || null,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        return res.status(500).json({ error: 'Failed to save supply drive' });
      }

      return res.status(200).json({ success: true, id: data.id });
    } catch (err) {
      console.error('Supply drive submission error:', err);
      return res.status(500).json({ error: 'Failed to save supply drive' });
    }
  }

  // No Supabase — accept the submission (email notification handled client-side)
  return res.status(200).json({ success: true, id: `sd-${Date.now()}` });
}
