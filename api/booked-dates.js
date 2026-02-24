// API endpoint to get dates that already have pending/approved events
// Used by the Connection Night and Supply Drive forms to prevent double-booking

import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Try Supabase first, fall back to empty lists
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: events } = await supabase
        .from('connection_nights')
        .select('time_slot_day')
        .in('status', ['pending', 'approved']);

      const { data: drives } = await supabase
        .from('supply_drives')
        .select('drop_off_date')
        .in('status', ['pending', 'approved']);

      return res.status(200).json({
        bookedDates: (events || []).map(e => e.time_slot_day),
        bookedSupplyDriveDates: (drives || []).map(d => d.drop_off_date),
      });
    } catch (err) {
      console.error('Supabase error fetching booked dates:', err);
    }
  }

  // No Supabase — return empty (all dates available)
  return res.status(200).json({
    bookedDates: [],
    bookedSupplyDriveDates: [],
  });
}
