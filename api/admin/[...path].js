/**
 * Production Admin API — Vercel Serverless Catch-All
 *
 * Handles all /api/admin/* routes with HMAC-SHA256 token auth.
 * Uses mock data tagged with _test: true (real persistence requires Supabase).
 *
 * Environment variables required:
 *   ADMIN_PASSWORD     — strong admin password
 *   ADMIN_TOKEN_SECRET — random 64-char hex string for HMAC signing
 */

import crypto from 'crypto';
import { setCorsHeaders } from '../_cors.js';

// ─── Auth helpers ────────────────────────────────────────────────────────────

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

function signToken(secret) {
  const payload = {
    iat: Date.now(),
    exp: Date.now() + TOKEN_EXPIRY_MS,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${sig}`;
}

function verifyToken(token, secret) {
  if (!token || !token.includes('.')) return false;
  const [payloadB64, sig] = token.split('.');
  if (!payloadB64 || !sig) return false;

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  // Constant-time comparison for signature
  if (sig.length !== expectedSig.length) return false;
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;

  // Check expiration
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (!payload.exp || Date.now() > payload.exp) return false;
  } catch {
    return false;
  }
  return true;
}

function safeCompare(a, b) {
  // Constant-time password comparison
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));
  if (aBuf.length !== bBuf.length) {
    // Still do a comparison to avoid timing leak on length
    crypto.timingSafeEqual(aBuf, aBuf);
    return false;
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
}

// ─── Mock data (tagged _test: true) ──────────────────────────────────────────

const mockVolunteers = [
  { id: 'v1', name: 'Sarah Johnson', email: 'sarah@gracecc.org', phone: '(804) 555-1234', organization: 'Grace Community Church', type: 'organization', notes: 'Very reliable group. Great with residents.', first_event: '2025-06-15', total_events: 8, created_at: '2025-06-01T10:00:00Z', _test: true },
  { id: 'v2', name: 'Mike Chen', email: 'mchen@vcu.edu', phone: '(804) 555-5678', organization: 'VCU Student Volunteers', type: 'organization', notes: 'College students, energetic group. Good for game nights.', first_event: '2025-09-10', total_events: 5, created_at: '2025-09-01T14:30:00Z', _test: true },
  { id: 'v3', name: 'David Williams', email: 'david@richmondrotary.org', phone: '(804) 555-9012', organization: 'Richmond Rotary Club', type: 'organization', notes: 'Professional group, prefers weekday evenings.', first_event: '2025-07-20', total_events: 6, created_at: '2025-07-15T09:00:00Z', _test: true },
  { id: 'v4', name: 'Pastor James Miller', email: 'jmiller@firstbaptist.org', phone: '(804) 555-2345', organization: 'First Baptist Youth Group', type: 'organization', notes: 'Youth group ages 14-18. Always brings homemade food.', first_event: '2025-08-05', total_events: 7, created_at: '2025-08-01T11:00:00Z', _test: true },
  { id: 'v5', name: 'Lisa Martinez', email: 'lmartinez@henrico.k12.va.us', phone: '(804) 555-3456', organization: 'Henrico High School Key Club', type: 'organization', notes: 'High school service club. Need adult chaperone present.', first_event: '2025-10-12', total_events: 4, created_at: '2025-10-01T16:00:00Z', _test: true },
  { id: 'v6', name: 'Tom Anderson', email: 'tom@rivercityrunners.com', phone: '(804) 555-4567', organization: 'River City Running Club', type: 'organization', notes: 'Athletic group, good energy. Prefers active games.', first_event: '2025-11-08', total_events: 3, created_at: '2025-11-01T08:00:00Z', _test: true },
  { id: 'v7', name: 'Maria Santos', email: 'msantos@stmarysrva.org', phone: '(804) 555-5678', organization: "St. Mary's Catholic Church", type: 'organization', notes: 'Bilingual group (English/Spanish). Wonderful with families.', first_event: '2025-05-20', total_events: 12, created_at: '2025-05-15T10:00:00Z', _test: true },
  { id: 'v8', name: 'Jennifer Lee', email: 'jennifer.lee@capitalone.com', phone: '(804) 555-6789', organization: 'Capital One Cares Team', type: 'organization', notes: 'Corporate volunteer program. Well-organized, large groups.', first_event: '2025-04-10', total_events: 9, created_at: '2025-04-01T09:00:00Z', _test: true },
  { id: 'v9', name: 'Brian Thompson', email: 'bthompson@uvaalumni.org', phone: '(804) 555-7890', organization: 'UVA Alumni Chapter', type: 'organization', notes: 'Alumni group, professional. Great trivia hosts.', first_event: '2025-09-25', total_events: 4, created_at: '2025-09-20T14:00:00Z', _test: true },
  { id: 'v10', name: 'Nancy White', email: 'nwhite@midlothianwc.org', phone: '(804) 555-8901', organization: "Midlothian Women's Club", type: 'organization', notes: 'Experienced volunteers. Excellent craft activities.', first_event: '2025-03-15', total_events: 14, created_at: '2025-03-10T11:00:00Z', _test: true },
  { id: 'v11', name: 'Alex Kumar', email: 'alex@rvatechmeetup.com', phone: '(804) 555-9012', organization: 'Richmond Tech Meetup', type: 'organization', notes: 'Tech professionals. Good with board games and puzzles.', first_event: '2025-12-05', total_events: 2, created_at: '2025-12-01T10:00:00Z', _test: true },
  { id: 'v12', name: 'Patricia Green', email: 'pgreen@bonairgardens.org', phone: '(804) 555-0123', organization: 'Bon Air Garden Club', type: 'organization', notes: 'Smaller group, brings beautiful flower arrangements.', first_event: '2025-07-10', total_events: 5, created_at: '2025-07-05T09:00:00Z', _test: true },
  { id: 'v13', name: 'Robert Davis', email: 'rdavis@carilloncivic.org', phone: '(804) 555-1234', organization: 'Carillon Civic Association', type: 'organization', notes: 'Neighborhood association. Very community-minded.', first_event: '2025-08-20', total_events: 6, created_at: '2025-08-15T10:00:00Z', _test: true },
  { id: 'v14', name: 'Emily Chen', email: 'echen@shortpumprotaract.org', phone: '(804) 555-2345', organization: 'Short Pump Rotaract', type: 'organization', notes: 'Young professionals Rotary group. Very enthusiastic.', first_event: '2025-10-30', total_events: 3, created_at: '2025-10-25T14:00:00Z', _test: true },
  { id: 'v15', name: 'Michael Brown', email: 'mbrown@dominionenergy.com', phone: '(804) 555-3456', organization: 'Dominion Energy Volunteers', type: 'organization', notes: 'Large corporate group. Can handle big events.', first_event: '2025-02-15', total_events: 16, created_at: '2025-02-10T09:00:00Z', _test: true },
  { id: 'v16', name: 'Rachel Kim', email: 'rachel.kim@gmail.com', phone: '(804) 555-4567', organization: null, type: 'individual', notes: 'Individual volunteer. Flexible schedule, very dependable.', first_event: '2025-06-25', total_events: 10, created_at: '2025-06-20T11:00:00Z', _test: true },
  { id: 'v17', name: 'James Wilson', email: 'jwilson.volunteer@yahoo.com', phone: '(804) 555-5678', organization: null, type: 'individual', notes: 'Retired teacher. Great with conversation and games.', first_event: '2025-04-20', total_events: 18, created_at: '2025-04-15T10:00:00Z', _test: true },
  { id: 'v18', name: 'Amanda Foster', email: 'afoster@outlook.com', phone: '(804) 555-6789', organization: null, type: 'individual', notes: 'Social worker by profession. Excellent with residents.', first_event: '2025-05-05', total_events: 15, created_at: '2025-05-01T09:00:00Z', _test: true },
];

const mockEvents = [
  // Historical events (completed)
  { id: 'h1', volunteer_id: 'v7', group_name: "St. Mary's Catholic Church", location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, September 9', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Maria Santos', contact_email: 'msantos@stmarysrva.org', contact_phone: '(804) 555-5678', group_size: 16, food_plan: 'bring', activity_plan: 'Bingo', status: 'completed', created_at: '2025-08-25T10:00:00Z', completed_at: '2025-09-09T20:00:00Z', _test: true },
  { id: 'h2', volunteer_id: 'v8', group_name: 'Capital One Cares Team', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, September 11', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Jennifer Lee', contact_email: 'jennifer.lee@capitalone.com', contact_phone: '(804) 555-6789', group_size: 22, food_plan: 'cater', activity_plan: 'Board games', status: 'completed', created_at: '2025-08-28T14:00:00Z', completed_at: '2025-09-11T20:00:00Z', _test: true },
  { id: 'h3', volunteer_id: 'v17', group_name: 'James Wilson (Individual)', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, September 16', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'James Wilson', contact_email: 'jwilson.volunteer@yahoo.com', contact_phone: '(804) 555-5678', group_size: 1, food_plan: 'bring', activity_plan: 'Conversation & Games', status: 'completed', created_at: '2025-09-01T09:00:00Z', completed_at: '2025-09-16T20:00:00Z', _test: true },
  { id: 'h4', volunteer_id: 'v15', group_name: 'Dominion Energy Volunteers', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Wednesday, September 17', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Michael Brown', contact_email: 'mbrown@dominionenergy.com', contact_phone: '(804) 555-3456', group_size: 28, food_plan: 'cater', activity_plan: 'Board games', status: 'completed', created_at: '2025-09-03T11:00:00Z', completed_at: '2025-09-17T20:00:00Z', _test: true },
  { id: 'h5', volunteer_id: 'v2', group_name: 'VCU Student Volunteers', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, September 25', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Mike Chen', contact_email: 'mchen@vcu.edu', contact_phone: '(804) 555-5678', group_size: 10, food_plan: 'bring', activity_plan: 'Trivia', status: 'completed', created_at: '2025-09-10T14:00:00Z', completed_at: '2025-09-25T20:00:00Z', _test: true },
  { id: 'h6', volunteer_id: 'v10', group_name: "Midlothian Women's Club", location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, October 7', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Nancy White', contact_email: 'nwhite@midlothianwc.org', contact_phone: '(804) 555-8901', group_size: 12, food_plan: 'bring', activity_plan: 'Crafts', status: 'completed', created_at: '2025-09-22T10:00:00Z', completed_at: '2025-10-07T20:00:00Z', _test: true },
  { id: 'h7', volunteer_id: 'v4', group_name: 'First Baptist Youth Group', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, October 9', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Pastor James Miller', contact_email: 'jmiller@firstbaptist.org', contact_phone: '(804) 555-2345', group_size: 18, food_plan: 'bring', activity_plan: 'Games & Fellowship', status: 'completed', created_at: '2025-09-25T11:00:00Z', completed_at: '2025-10-09T20:00:00Z', _test: true },
  { id: 'h8', volunteer_id: 'v18', group_name: 'Amanda Foster (Individual)', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, October 14', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Amanda Foster', contact_email: 'afoster@outlook.com', contact_phone: '(804) 555-6789', group_size: 1, food_plan: 'bring', activity_plan: 'Conversation', status: 'completed', created_at: '2025-10-01T09:00:00Z', completed_at: '2025-10-14T20:00:00Z', _test: true },
  { id: 'h9', volunteer_id: 'v1', group_name: 'Grace Community Church', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Wednesday, October 15', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Sarah Johnson', contact_email: 'sarah@gracecc.org', contact_phone: '(804) 555-1234', group_size: 14, food_plan: 'bring', activity_plan: 'Board games', status: 'completed', created_at: '2025-10-02T10:00:00Z', completed_at: '2025-10-15T20:00:00Z', _test: true },
  { id: 'h10', volunteer_id: 'v13', group_name: 'Carillon Civic Association', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, October 23', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Robert Davis', contact_email: 'rdavis@carilloncivic.org', contact_phone: '(804) 555-1234', group_size: 20, food_plan: 'bring', activity_plan: 'Halloween Party', status: 'completed', created_at: '2025-10-08T14:00:00Z', completed_at: '2025-10-23T20:00:00Z', _test: true },
  { id: 'h11', volunteer_id: 'v16', group_name: 'Rachel Kim (Individual)', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, October 28', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Rachel Kim', contact_email: 'rachel.kim@gmail.com', contact_phone: '(804) 555-4567', group_size: 1, food_plan: 'bring', activity_plan: 'Crafts', status: 'completed', created_at: '2025-10-15T11:00:00Z', completed_at: '2025-10-28T20:00:00Z', _test: true },
  { id: 'h12', volunteer_id: 'v3', group_name: 'Richmond Rotary Club', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, November 4', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'David Williams', contact_email: 'david@richmondrotary.org', contact_phone: '(804) 555-9012', group_size: 15, food_plan: 'bring', activity_plan: 'Bingo', status: 'completed', created_at: '2025-10-20T10:00:00Z', completed_at: '2025-11-04T20:00:00Z', _test: true },
  { id: 'h13', volunteer_id: 'v6', group_name: 'River City Running Club', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, November 6', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Tom Anderson', contact_email: 'tom@rivercityrunners.com', contact_phone: '(804) 555-4567', group_size: 12, food_plan: 'bring', activity_plan: 'Trivia', status: 'completed', created_at: '2025-10-22T09:00:00Z', completed_at: '2025-11-06T20:00:00Z', _test: true },
  { id: 'h14', volunteer_id: 'v7', group_name: "St. Mary's Catholic Church", location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, November 11', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Maria Santos', contact_email: 'msantos@stmarysrva.org', contact_phone: '(804) 555-5678', group_size: 20, food_plan: 'bring', activity_plan: 'Veterans Day Celebration', status: 'completed', created_at: '2025-10-28T11:00:00Z', completed_at: '2025-11-11T20:00:00Z', _test: true },
  { id: 'h15', volunteer_id: 'v8', group_name: 'Capital One Cares Team', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Wednesday, November 19', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Jennifer Lee', contact_email: 'jennifer.lee@capitalone.com', contact_phone: '(804) 555-6789', group_size: 25, food_plan: 'cater', activity_plan: 'Thanksgiving Dinner', status: 'completed', created_at: '2025-11-05T14:00:00Z', completed_at: '2025-11-19T20:00:00Z', _test: true },
  { id: 'h16', volunteer_id: 'v15', group_name: 'Dominion Energy Volunteers', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, December 2', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Michael Brown', contact_email: 'mbrown@dominionenergy.com', contact_phone: '(804) 555-3456', group_size: 30, food_plan: 'cater', activity_plan: 'Holiday Party', status: 'completed', created_at: '2025-11-18T10:00:00Z', completed_at: '2025-12-02T20:00:00Z', _test: true },
  { id: 'h17', volunteer_id: 'v11', group_name: 'Richmond Tech Meetup', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, December 4', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Alex Kumar', contact_email: 'alex@rvatechmeetup.com', contact_phone: '(804) 555-9012', group_size: 14, food_plan: 'cater', activity_plan: 'Board games', status: 'completed', created_at: '2025-11-20T09:00:00Z', completed_at: '2025-12-04T20:00:00Z', _test: true },
  { id: 'h18', volunteer_id: 'v4', group_name: 'First Baptist Youth Group', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, December 9', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Pastor James Miller', contact_email: 'jmiller@firstbaptist.org', contact_phone: '(804) 555-2345', group_size: 22, food_plan: 'bring', activity_plan: 'Christmas Caroling', status: 'completed', created_at: '2025-11-25T11:00:00Z', completed_at: '2025-12-09T20:00:00Z', _test: true },
  { id: 'h19', volunteer_id: 'v10', group_name: "Midlothian Women's Club", location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Wednesday, December 10', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Nancy White', contact_email: 'nwhite@midlothianwc.org', contact_phone: '(804) 555-8901', group_size: 15, food_plan: 'bring', activity_plan: 'Holiday Crafts', status: 'completed', created_at: '2025-11-26T10:00:00Z', completed_at: '2025-12-10T20:00:00Z', _test: true },
  { id: 'h20', volunteer_id: 'v17', group_name: 'James Wilson (Individual)', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, December 18', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'James Wilson', contact_email: 'jwilson.volunteer@yahoo.com', contact_phone: '(804) 555-5678', group_size: 1, food_plan: 'bring', activity_plan: 'Holiday Stories', status: 'completed', created_at: '2025-12-05T09:00:00Z', completed_at: '2025-12-18T20:00:00Z', _test: true },
  { id: 'h21', volunteer_id: 'v1', group_name: 'Grace Community Church', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, January 7', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Sarah Johnson', contact_email: 'sarah@gracecc.org', contact_phone: '(804) 555-1234', group_size: 12, food_plan: 'bring', activity_plan: 'Board games', status: 'completed', created_at: '2025-12-23T10:00:00Z', completed_at: '2026-01-07T20:00:00Z', _test: true },
  { id: 'h22', volunteer_id: 'v9', group_name: 'UVA Alumni Chapter', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, January 9', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Brian Thompson', contact_email: 'bthompson@uvaalumni.org', contact_phone: '(804) 555-7890', group_size: 10, food_plan: 'bring', activity_plan: 'Trivia Night', status: 'completed', created_at: '2025-12-26T14:00:00Z', completed_at: '2026-01-09T20:00:00Z', _test: true },
  { id: 'h23', volunteer_id: 'v18', group_name: 'Amanda Foster (Individual)', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, January 14', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Amanda Foster', contact_email: 'afoster@outlook.com', contact_phone: '(804) 555-6789', group_size: 1, food_plan: 'bring', activity_plan: 'Conversation', status: 'completed', created_at: '2026-01-02T09:00:00Z', completed_at: '2026-01-14T20:00:00Z', _test: true },
  { id: 'h24', volunteer_id: 'v14', group_name: 'Short Pump Rotaract', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Wednesday, January 15', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Emily Chen', contact_email: 'echen@shortpumprotaract.org', contact_phone: '(804) 555-2345', group_size: 16, food_plan: 'cater', activity_plan: 'Game Night', status: 'completed', created_at: '2026-01-03T11:00:00Z', completed_at: '2026-01-15T20:00:00Z', _test: true },
  { id: 'h25', volunteer_id: 'v12', group_name: 'Bon Air Garden Club', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, January 23', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Patricia Green', contact_email: 'pgreen@bonairgardens.org', contact_phone: '(804) 555-0123', group_size: 8, food_plan: 'bring', activity_plan: 'Flower Arranging', status: 'completed', created_at: '2026-01-10T10:00:00Z', completed_at: '2026-01-23T20:00:00Z', _test: true },
  { id: 'h26', volunteer_id: 'v16', group_name: 'Rachel Kim (Individual)', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, January 28', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Rachel Kim', contact_email: 'rachel.kim@gmail.com', contact_phone: '(804) 555-4567', group_size: 1, food_plan: 'bring', activity_plan: 'Crafts', status: 'completed', created_at: '2026-01-15T11:00:00Z', completed_at: '2026-01-28T20:00:00Z', _test: true },
  // Upcoming/current events
  { id: '1', volunteer_id: 'v1', group_name: 'Grace Community Church', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, February 11', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Sarah Johnson', contact_email: 'sarah@gracecc.org', contact_phone: '(804) 555-1234', group_size: 12, food_plan: 'bring', activity_plan: 'Board games', status: 'pending', created_at: '2026-01-28T10:00:00Z', _test: true },
  { id: '2', volunteer_id: 'v2', group_name: 'VCU Student Volunteers', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, February 13', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Mike Chen', contact_email: 'mchen@vcu.edu', contact_phone: '(804) 555-5678', group_size: 8, food_plan: 'cater', activity_plan: 'Trivia', status: 'approved', created_at: '2026-01-27T14:00:00Z', _test: true },
  { id: '3', volunteer_id: 'v3', group_name: 'Richmond Rotary Club', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Wednesday, February 19', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'David Williams', contact_email: 'david@richmondrotary.org', contact_phone: '(804) 555-9012', group_size: 15, food_plan: 'bring', activity_plan: 'Bingo', status: 'denied', denial_reason: 'Date conflict with property maintenance', created_at: '2026-01-26T10:00:00Z', _test: true },
  { id: '4', volunteer_id: 'v4', group_name: 'First Baptist Youth Group', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, February 18', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Pastor James Miller', contact_email: 'jmiller@firstbaptist.org', contact_phone: '(804) 555-2345', group_size: 20, food_plan: 'bring', activity_plan: 'Crafts', status: 'approved', created_at: '2026-01-25T11:00:00Z', _test: true },
  { id: '5', volunteer_id: 'v5', group_name: 'Henrico High School Key Club', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, February 20', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Lisa Martinez', contact_email: 'lmartinez@henrico.k12.va.us', contact_phone: '(804) 555-3456', group_size: 15, food_plan: 'cater', activity_plan: 'Board games', status: 'pending', created_at: '2026-01-24T16:00:00Z', _test: true },
  { id: '6', volunteer_id: 'v6', group_name: 'River City Running Club', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Wednesday, February 26', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Tom Anderson', contact_email: 'tom@rivercityrunners.com', contact_phone: '(804) 555-4567', group_size: 10, food_plan: 'bring', activity_plan: 'Trivia', status: 'approved', created_at: '2026-01-23T09:00:00Z', _test: true },
  { id: '7', volunteer_id: 'v7', group_name: "St. Mary's Catholic Church", location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, February 25', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Maria Santos', contact_email: 'msantos@stmarysrva.org', contact_phone: '(804) 555-5678', group_size: 18, food_plan: 'bring', activity_plan: 'Bingo', status: 'pending', created_at: '2026-01-22T11:00:00Z', _test: true },
  { id: '8', volunteer_id: 'v8', group_name: 'Capital One Cares Team', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, March 6', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Jennifer Lee', contact_email: 'jennifer.lee@capitalone.com', contact_phone: '(804) 555-6789', group_size: 25, food_plan: 'cater', activity_plan: 'Board games', status: 'approved', created_at: '2026-01-21T14:00:00Z', _test: true },
  { id: '9', volunteer_id: 'v9', group_name: 'UVA Alumni Chapter', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, March 4', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Brian Thompson', contact_email: 'bthompson@uvaalumni.org', contact_phone: '(804) 555-7890', group_size: 12, food_plan: 'bring', activity_plan: 'Trivia', status: 'pending', created_at: '2026-01-20T14:00:00Z', _test: true },
  { id: '10', volunteer_id: 'v10', group_name: "Midlothian Women's Club", location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Wednesday, March 5', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Nancy White', contact_email: 'nwhite@midlothianwc.org', contact_phone: '(804) 555-8901', group_size: 14, food_plan: 'bring', activity_plan: 'Crafts', status: 'approved', created_at: '2026-01-19T10:00:00Z', _test: true },
  { id: '11', volunteer_id: 'v11', group_name: 'Richmond Tech Meetup', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, March 13', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Alex Kumar', contact_email: 'alex@rvatechmeetup.com', contact_phone: '(804) 555-9012', group_size: 16, food_plan: 'cater', activity_plan: 'Board games', status: 'pending', created_at: '2026-01-18T10:00:00Z', _test: true },
  { id: '12', volunteer_id: 'v12', group_name: 'Bon Air Garden Club', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, March 11', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Patricia Green', contact_email: 'pgreen@bonairgardens.org', contact_phone: '(804) 555-0123', group_size: 10, food_plan: 'bring', activity_plan: 'Bingo', status: 'denied', denial_reason: 'Group size too small for requested date', created_at: '2026-01-17T10:00:00Z', _test: true },
  { id: '13', volunteer_id: 'v13', group_name: 'Carillon Civic Association', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Wednesday, March 12', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Robert Davis', contact_email: 'rdavis@carilloncivic.org', contact_phone: '(804) 555-1234', group_size: 22, food_plan: 'bring', activity_plan: 'Trivia', status: 'approved', created_at: '2026-01-16T14:00:00Z', _test: true },
  { id: '14', volunteer_id: 'v14', group_name: 'Short Pump Rotaract', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, March 18', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Emily Chen', contact_email: 'echen@shortpumprotaract.org', contact_phone: '(804) 555-2345', group_size: 18, food_plan: 'cater', activity_plan: 'Crafts', status: 'pending', created_at: '2026-01-15T11:00:00Z', _test: true },
  { id: '15', volunteer_id: 'v15', group_name: 'Dominion Energy Volunteers', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, March 20', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Michael Brown', contact_email: 'mbrown@dominionenergy.com', contact_phone: '(804) 555-3456', group_size: 30, food_plan: 'cater', activity_plan: 'Board games', status: 'approved', created_at: '2026-01-14T09:00:00Z', _test: true },
];

const mockSupplyDrives = [
  { id: 'sd1', volunteer_id: 'v8', event_type: 'supply-drive', contact_name: 'Jennifer Lee', contact_email: 'jennifer.lee@capitalone.com', contact_phone: '(804) 555-6789', organization: 'Capital One Cares Team', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', drop_off_date: 'Friday, February 7', drop_off_time: '9:00 AM - 5:00 PM', items: ['All-purpose cleaner', 'Dish soap', 'Paper towels', 'Toilet paper', 'Shampoo', 'Body wash/soap'], notes: 'We have about 50 care packages to drop off.', status: 'completed', created_at: '2026-01-20T10:00:00Z', completed_at: '2026-02-07T14:00:00Z', _test: true },
  { id: 'sd2', volunteer_id: 'v10', event_type: 'supply-drive', contact_name: 'Nancy White', contact_email: 'nwhite@midlothianwc.org', contact_phone: '(804) 555-8901', organization: "Midlothian Women's Club", location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', drop_off_date: 'Friday, February 14', drop_off_time: '9:00 AM - 5:00 PM', items: ['Bath towels', 'Washcloths', 'Twin sheets', 'Pillows', 'Blankets'], notes: 'Collected linens from our annual drive.', status: 'approved', created_at: '2026-02-01T11:00:00Z', _test: true },
  { id: 'sd3', volunteer_id: 'v16', event_type: 'supply-drive', contact_name: 'Rachel Kim', contact_email: 'rachel.kim@gmail.com', contact_phone: '(804) 555-4567', organization: null, location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', drop_off_date: 'Friday, February 21', drop_off_time: '9:00 AM - 5:00 PM', items: ['Canned vegetables', 'Canned soup', 'Pasta', 'Rice', 'Peanut butter', 'Cereal'], notes: 'Personal donation - cleaning out my pantry of extras.', status: 'pending', created_at: '2026-02-02T09:00:00Z', _test: true },
  { id: 'sd4', volunteer_id: 'v1', event_type: 'supply-drive', contact_name: 'Sarah Johnson', contact_email: 'sarah@gracecc.org', contact_phone: '(804) 555-1234', organization: 'Grace Community Church', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', drop_off_date: 'Friday, January 3', drop_off_time: '9:00 AM - 5:00 PM', items: ['Toilet paper', 'Paper towels', 'Trash bags', 'Laundry detergent', 'Dish soap'], notes: 'New year cleaning supply drive from our congregation.', status: 'completed', created_at: '2025-12-20T10:00:00Z', completed_at: '2026-01-03T14:00:00Z', _test: true },
  { id: 'sd5', volunteer_id: 'v15', event_type: 'supply-drive', contact_name: 'Michael Brown', contact_email: 'mbrown@dominionenergy.com', contact_phone: '(804) 555-3456', organization: 'Dominion Energy Volunteers', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', drop_off_date: 'Friday, January 10', drop_off_time: '9:00 AM - 5:00 PM', items: ['Bath towels', 'Washcloths', 'Twin sheets', 'Pillows', 'Blankets'], notes: 'Corporate donation drive - linens collection.', status: 'completed', created_at: '2025-12-28T14:00:00Z', completed_at: '2026-01-10T15:30:00Z', _test: true },
  { id: 'sd6', volunteer_id: 'v7', event_type: 'supply-drive', contact_name: 'Maria Santos', contact_email: 'msantos@stmarysrva.org', contact_phone: '(804) 555-5678', organization: "St. Mary's Catholic Church", location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', drop_off_date: 'Friday, January 17', drop_off_time: '9:00 AM - 5:00 PM', items: ['Canned vegetables', 'Canned soup', 'Pasta', 'Rice', 'Peanut butter', 'Cereal'], notes: 'Parish food drive collection.', status: 'completed', created_at: '2026-01-05T10:00:00Z', completed_at: '2026-01-17T11:00:00Z', _test: true },
  { id: 'sd7', volunteer_id: 'v17', event_type: 'supply-drive', contact_name: 'James Wilson', contact_email: 'jwilson.volunteer@yahoo.com', contact_phone: '(804) 555-5678', organization: null, location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', drop_off_date: 'Friday, January 24', drop_off_time: '9:00 AM - 5:00 PM', items: ['Toothpaste', 'Toothbrushes', 'Deodorant', 'Shampoo', 'Conditioner', 'Body wash/soap'], notes: 'Personal toiletry donation.', status: 'completed', created_at: '2026-01-12T11:00:00Z', completed_at: '2026-01-24T10:30:00Z', _test: true },
  { id: 'sd8', volunteer_id: 'v5', event_type: 'supply-drive', contact_name: 'Lisa Martinez', contact_email: 'lmartinez@henrico.k12.va.us', contact_phone: '(804) 555-3456', organization: 'Henrico High School Key Club', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', drop_off_date: 'Friday, January 31', drop_off_time: '9:00 AM - 5:00 PM', items: ['All-purpose cleaner', 'Disinfecting wipes', 'Sponges', 'Trash bags', 'Paper towels'], notes: 'Student council cleaning supply drive.', status: 'completed', created_at: '2026-01-18T09:00:00Z', completed_at: '2026-01-31T14:00:00Z', _test: true },
  { id: 'sd9', volunteer_id: 'v9', event_type: 'supply-drive', contact_name: 'Brian Thompson', contact_email: 'bthompson@uvaalumni.org', contact_phone: '(804) 555-7890', organization: 'UVA Alumni Chapter', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', drop_off_date: 'Friday, February 28', drop_off_time: '9:00 AM - 5:00 PM', items: ['Canned vegetables', 'Canned soup', 'Pasta', 'Rice', 'Cooking oil', 'Cereal'], notes: 'Alumni association food drive.', status: 'pending', created_at: '2026-02-01T14:00:00Z', _test: true },
];

const mockDonations = [
  { id: 'd1', payment_intent_id: 'pi_3Qa1b2c3d4e5f6g7h8', amount: 100, donation_type: 'one-time', donor_name: 'Sarah Johnson', donor_email: 'sarah@gracecc.org', donor_phone: '(804) 555-1234', donor_address: '123 Grace Ave, Richmond, VA 23220', card_last4: '4242', card_brand: 'Visa', volunteer_id: 'v1', created_at: '2025-12-15T14:30:00Z', _test: true },
  { id: 'd2', payment_intent_id: 'pi_8Xk9m2n3p4q5r6s7t8', amount: 250, donation_type: 'monthly', donor_name: 'Jennifer Lee', donor_email: 'jennifer.lee@capitalone.com', donor_phone: '(804) 555-6789', donor_address: '456 Corporate Blvd, Richmond, VA 23219', card_last4: '1234', card_brand: 'Mastercard', volunteer_id: 'v8', created_at: '2025-11-20T09:15:00Z', _test: true },
  { id: 'd3', payment_intent_id: 'pi_2Yz3a4b5c6d7e8f9g0', amount: 50, donation_type: 'one-time', donor_name: 'Rachel Kim', donor_email: 'rachel.kim@gmail.com', donor_phone: '(804) 555-4567', donor_address: '789 Elm St, Richmond, VA 23221', card_last4: '5678', card_brand: 'Visa', volunteer_id: 'v16', created_at: '2026-01-10T16:45:00Z', _test: true },
  { id: 'd4', payment_intent_id: 'pi_4Cd5e6f7g8h9i0j1k2', amount: 75, donation_type: 'one-time', donor_name: 'Rachel Kim', donor_email: 'rachel.kim@gmail.com', donor_phone: '(804) 555-4567', donor_address: '789 Elm St, Richmond, VA 23221', card_last4: '5678', card_brand: 'Visa', volunteer_id: 'v16', created_at: '2026-02-05T11:20:00Z', _test: true },
  { id: 'd5', payment_intent_id: 'pi_6Ef7g8h9i0j1k2l3m4', amount: 500, donation_type: 'one-time', donor_name: 'James Wilson', donor_email: 'jwilson.volunteer@yahoo.com', donor_phone: '(804) 555-5678', donor_address: '321 Oak Lane, Richmond, VA 23222', card_last4: '9012', card_brand: 'Amex', volunteer_id: 'v17', created_at: '2025-12-28T10:00:00Z', _test: true },
  { id: 'd6', payment_intent_id: 'pi_7Fg8h9i0j1k2l3m4n5', amount: 200, donation_type: 'monthly', donor_name: 'Catherine Brooks', donor_email: 'cbrooks@outlook.com', donor_phone: '(804) 555-7777', donor_address: '550 Monument Ave, Richmond, VA 23220', card_last4: '3456', card_brand: 'Visa', volunteer_id: null, created_at: '2025-11-05T13:00:00Z', _test: true },
  { id: 'd7', payment_intent_id: 'pi_9Hi0j1k2l3m4n5o6p7', amount: 200, donation_type: 'monthly', donor_name: 'Catherine Brooks', donor_email: 'cbrooks@outlook.com', donor_phone: '(804) 555-7777', donor_address: '550 Monument Ave, Richmond, VA 23220', card_last4: '3456', card_brand: 'Visa', volunteer_id: null, created_at: '2025-12-05T13:00:00Z', _test: true },
  { id: 'd8', payment_intent_id: 'pi_1Ab2c3d4e5f6g7h8i9', amount: 1000, donation_type: 'one-time', donor_name: 'Robert Taylor', donor_email: 'rtaylor@taylorlaw.com', donor_phone: '(804) 555-8888', donor_address: '900 Main St, Suite 200, Richmond, VA 23219', card_last4: '7890', card_brand: 'Amex', volunteer_id: null, created_at: '2026-01-22T15:30:00Z', _test: true },
  { id: 'd9', payment_intent_id: 'pi_3Cd4e5f6g7h8i9j0k1', amount: 150, donation_type: 'one-time', donor_name: 'Priya Patel', donor_email: 'priya.patel@gmail.com', donor_phone: '(804) 555-9999', donor_address: '42 Riverside Dr, Richmond, VA 23225', card_last4: '2468', card_brand: 'Mastercard', volunteer_id: null, created_at: '2026-02-01T10:45:00Z', _test: true },
  { id: 'd10', payment_intent_id: 'pi_5Ef6g7h8i9j0k1l2m3', amount: 25, donation_type: 'one-time', donor_name: 'William & Margaret Hayes', donor_email: 'wmhayes@verizon.net', donor_phone: '(804) 555-1010', donor_address: '15 Church Hill Rd, Richmond, VA 23223', card_last4: '1357', card_brand: 'Discover', volunteer_id: null, created_at: '2026-02-08T18:00:00Z', _test: true },
];

// ─── Route handlers ──────────────────────────────────────────────────────────

function handleLogin(req, res) {
  const secret = process.env.ADMIN_TOKEN_SECRET;
  const password = process.env.ADMIN_PASSWORD;

  if (!secret || !password) {
    return res.status(500).json({ error: 'Admin auth not configured' });
  }

  const { password: inputPassword } = req.body || {};

  if (!inputPassword || !safeCompare(inputPassword, password)) {
    // 1-second delay on failed attempts (brute-force mitigation)
    return new Promise((resolve) => {
      setTimeout(() => {
        res.status(401).json({ success: false, error: 'Invalid password' });
        resolve();
      }, 1000);
    });
  }

  const token = signToken(secret);
  return res.status(200).json({ success: true, token });
}

function handleGetEvents(req, res) {
  const eventsWithType = mockEvents.map(e => ({ ...e, event_type: 'connection-night' }));
  return res.status(200).json({ events: eventsWithType, supplyDrives: mockSupplyDrives });
}

function handleApproveEvent(req, res, id) {
  const event = mockEvents.find(e => e.id === id);
  if (event) {
    event.status = 'approved';
  }
  return res.status(200).json({ success: true });
}

function handleDenyEvent(req, res, id) {
  const { reason } = req.body || {};
  const event = mockEvents.find(e => e.id === id);
  if (event) {
    event.status = 'denied';
    event.denial_reason = reason || null;
  }
  return res.status(200).json({ success: true });
}

function handleApproveSupplyDrive(req, res, id) {
  const sd = mockSupplyDrives.find(e => e.id === id);
  if (sd) {
    sd.status = 'approved';
    sd.approved_at = new Date().toISOString();
  }
  return res.status(200).json({ success: true });
}

function handleDenySupplyDrive(req, res, id) {
  const { reason } = req.body || {};
  const sd = mockSupplyDrives.find(e => e.id === id);
  if (sd) {
    sd.status = 'denied';
    sd.denial_reason = reason || null;
  }
  return res.status(200).json({ success: true });
}

function handleCompleteSupplyDrive(req, res, id) {
  const sd = mockSupplyDrives.find(e => e.id === id);
  if (sd) {
    sd.status = 'completed';
    sd.completed_at = new Date().toISOString();
  }
  return res.status(200).json({ success: true });
}

function handleGetVolunteers(req, res) {
  const enrichedVolunteers = mockVolunteers.map(volunteer => {
    const volunteerEvents = mockEvents.filter(e => e.volunteer_id === volunteer.id);
    const completedEvents = volunteerEvents.filter(e => e.status === 'completed');
    const upcomingEvents = volunteerEvents.filter(e => ['pending', 'approved'].includes(e.status));

    const volunteerSupplyDrives = mockSupplyDrives.filter(e => e.volunteer_id === volunteer.id);
    const completedSupplyDrives = volunteerSupplyDrives.filter(e => e.status === 'completed');
    const upcomingSupplyDrives = volunteerSupplyDrives.filter(e => ['pending', 'approved'].includes(e.status));

    const allCompleted = [...completedEvents, ...completedSupplyDrives];
    const allUpcoming = [...upcomingEvents, ...upcomingSupplyDrives];

    const volunteerDonations = mockDonations.filter(d => d.volunteer_id === volunteer.id);
    const totalDonated = volunteerDonations.reduce((sum, d) => sum + d.amount, 0);
    const donationCount = volunteerDonations.length;

    const roles = ['volunteer'];
    if (donationCount > 0) roles.push('donor');

    return {
      ...volunteer,
      roles,
      total_events: volunteerEvents.length + volunteerSupplyDrives.length,
      completed_events: allCompleted.length,
      upcoming_events: allUpcoming.length,
      total_donated: totalDonated,
      donation_count: donationCount,
      last_event: allCompleted.length > 0
        ? allCompleted.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0]
        : null,
      next_event: allUpcoming.length > 0
        ? allUpcoming.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0]
        : null,
    };
  });

  // Build donor-only people
  const donorOnlyEmails = new Set();
  const donorOnlyPeople = [];
  mockDonations
    .filter(d => !d.volunteer_id)
    .forEach(d => {
      if (!donorOnlyEmails.has(d.donor_email)) {
        donorOnlyEmails.add(d.donor_email);
        const allDonationsForDonor = mockDonations.filter(
          dd => dd.donor_email === d.donor_email && !dd.volunteer_id
        );
        const totalDonated = allDonationsForDonor.reduce((sum, dd) => sum + dd.amount, 0);
        donorOnlyPeople.push({
          id: `donor-${d.donor_email}`,
          name: d.donor_name,
          email: d.donor_email,
          phone: d.donor_phone,
          organization: null,
          type: 'individual',
          notes: null,
          first_event: null,
          total_events: 0,
          completed_events: 0,
          upcoming_events: 0,
          total_donated: totalDonated,
          donation_count: allDonationsForDonor.length,
          roles: ['donor'],
          last_event: null,
          next_event: null,
          created_at: allDonationsForDonor.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0].created_at,
          _test: true,
        });
      }
    });

  return res.status(200).json({ volunteers: [...enrichedVolunteers, ...donorOnlyPeople] });
}

function handleGetVolunteer(req, res, id) {
  // Handle donor-only people
  if (id.startsWith('donor-')) {
    const donorEmail = id.replace('donor-', '');
    const donorDonations = mockDonations
      .filter(d => d.donor_email === donorEmail && !d.volunteer_id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (donorDonations.length === 0) {
      return res.status(404).json({ error: 'Person not found' });
    }

    const first = donorDonations[donorDonations.length - 1];
    const totalDonated = donorDonations.reduce((sum, d) => sum + d.amount, 0);

    return res.status(200).json({
      volunteer: {
        id,
        name: first.donor_name,
        email: first.donor_email,
        phone: first.donor_phone,
        organization: null,
        type: 'individual',
        notes: null,
        roles: ['donor'],
        total_donated: totalDonated,
        donation_count: donorDonations.length,
        events: [],
        donations: donorDonations,
        created_at: first.created_at,
        _test: true,
      },
    });
  }

  const volunteer = mockVolunteers.find(v => v.id === id);
  if (!volunteer) {
    return res.status(404).json({ error: 'Volunteer not found' });
  }

  const volunteerEvents = mockEvents
    .filter(e => e.volunteer_id === id)
    .map(e => ({ ...e, event_type: 'connection-night' }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const volunteerSupplyDrives = mockSupplyDrives
    .filter(e => e.volunteer_id === id)
    .map(e => ({ ...e, event_type: 'supply-drive' }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const allEvents = [...volunteerEvents, ...volunteerSupplyDrives]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const volunteerDonations = mockDonations
    .filter(d => d.volunteer_id === id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const totalDonated = volunteerDonations.reduce((sum, d) => sum + d.amount, 0);

  const roles = ['volunteer'];
  if (volunteerDonations.length > 0) roles.push('donor');

  return res.status(200).json({
    volunteer: {
      ...volunteer,
      roles,
      total_donated: totalDonated,
      donation_count: volunteerDonations.length,
      events: allEvents,
      donations: volunteerDonations,
    },
  });
}

function handleUpdateVolunteer(req, res, id) {
  const volunteer = mockVolunteers.find(v => v.id === id);
  if (!volunteer) {
    return res.status(404).json({ error: 'Volunteer not found' });
  }

  const { notes, name, email, phone, organization } = req.body || {};
  if (notes !== undefined) volunteer.notes = notes;
  if (name !== undefined) volunteer.name = name;
  if (email !== undefined) volunteer.email = email;
  if (phone !== undefined) volunteer.phone = phone;
  if (organization !== undefined) volunteer.organization = organization;

  return res.status(200).json({ success: true, volunteer });
}

function handleGetStats(req, res) {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const totalVolunteers = mockVolunteers.length;
  const totalEvents = mockEvents.length;
  const completedEvents = mockEvents.filter(e => e.status === 'completed').length;
  const pendingEvents = mockEvents.filter(e => e.status === 'pending').length;
  const approvedEvents = mockEvents.filter(e => e.status === 'approved').length;

  const eventsThisMonth = mockEvents.filter(e => {
    const eventDate = new Date(e.created_at);
    return eventDate.getMonth() === thisMonth && eventDate.getFullYear() === thisYear;
  }).length;

  const totalVolunteerHours = mockEvents
    .filter(e => e.status === 'completed')
    .reduce((sum, e) => sum + (e.group_size * 2), 0);

  const residentsServed = completedEvents * 15;

  const totalDonations = mockDonations.length;
  const totalAmountRaised = mockDonations.reduce((sum, d) => sum + d.amount, 0);

  return res.status(200).json({
    stats: {
      totalVolunteers,
      totalEvents,
      completedEvents,
      pendingEvents,
      approvedEvents,
      eventsThisMonth,
      totalVolunteerHours,
      residentsServed,
      totalDonations,
      totalAmountRaised,
    },
  });
}

function handleGetDonations(req, res) {
  const sorted = [...mockDonations].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
  return res.status(200).json({ donations: sorted });
}

function handleGetDonation(req, res, id) {
  const donation = mockDonations.find(d => d.id === id);
  if (!donation) {
    return res.status(404).json({ error: 'Donation not found' });
  }

  let volunteer = null;
  if (donation.volunteer_id) {
    volunteer = mockVolunteers.find(v => v.id === donation.volunteer_id) || null;
  }

  return res.status(200).json({
    donation: { ...donation, volunteer },
  });
}

// ─── Main handler ────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse the path from the URL (strip /api/admin/ prefix)
  const urlPath = (req.url || '').split('?')[0];
  const path = urlPath.replace(/^\/api\/admin\/?/, '');
  const method = req.method;

  // Safely access Vercel's auto-parsed body (its getter can throw)
  if (method === 'POST' || method === 'PATCH') {
    try {
      // Trigger Vercel's lazy body parser
      if (!req.body) req.body = {};
    } catch {
      req.body = {};
    }
  }

  // POST /api/admin/login — no auth required
  if (method === 'POST' && path === 'login') {
    return handleLogin(req, res);
  }

  // All other routes require auth
  const secret = process.env.ADMIN_TOKEN_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'Admin auth not configured' });
  }

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!verifyToken(token, secret)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ─── Authenticated routes ──────────────────────────────────────────────

  // GET /api/admin/events
  if (method === 'GET' && path === 'events') {
    return handleGetEvents(req, res);
  }

  // POST /api/admin/events/:id/approve
  const eventApproveMatch = path.match(/^events\/([^/]+)\/approve$/);
  if (method === 'POST' && eventApproveMatch) {
    return handleApproveEvent(req, res, eventApproveMatch[1]);
  }

  // POST /api/admin/events/:id/deny
  const eventDenyMatch = path.match(/^events\/([^/]+)\/deny$/);
  if (method === 'POST' && eventDenyMatch) {
    return handleDenyEvent(req, res, eventDenyMatch[1]);
  }

  // POST /api/admin/supply-drives/:id/approve
  const sdApproveMatch = path.match(/^supply-drives\/([^/]+)\/approve$/);
  if (method === 'POST' && sdApproveMatch) {
    return handleApproveSupplyDrive(req, res, sdApproveMatch[1]);
  }

  // POST /api/admin/supply-drives/:id/deny
  const sdDenyMatch = path.match(/^supply-drives\/([^/]+)\/deny$/);
  if (method === 'POST' && sdDenyMatch) {
    return handleDenySupplyDrive(req, res, sdDenyMatch[1]);
  }

  // POST /api/admin/supply-drives/:id/complete
  const sdCompleteMatch = path.match(/^supply-drives\/([^/]+)\/complete$/);
  if (method === 'POST' && sdCompleteMatch) {
    return handleCompleteSupplyDrive(req, res, sdCompleteMatch[1]);
  }

  // GET /api/admin/volunteers
  if (method === 'GET' && path === 'volunteers') {
    return handleGetVolunteers(req, res);
  }

  // GET /api/admin/volunteers/:id
  const volunteerGetMatch = path.match(/^volunteers\/([^/]+)$/);
  if (method === 'GET' && volunteerGetMatch) {
    return handleGetVolunteer(req, res, volunteerGetMatch[1]);
  }

  // PATCH /api/admin/volunteers/:id
  const volunteerPatchMatch = path.match(/^volunteers\/([^/]+)$/);
  if (method === 'PATCH' && volunteerPatchMatch) {
    return handleUpdateVolunteer(req, res, volunteerPatchMatch[1]);
  }

  // GET /api/admin/stats
  if (method === 'GET' && path === 'stats') {
    return handleGetStats(req, res);
  }

  // GET /api/admin/donations
  if (method === 'GET' && path === 'donations') {
    return handleGetDonations(req, res);
  }

  // GET /api/admin/donations/:id
  const donationGetMatch = path.match(/^donations\/([^/]+)$/);
  if (method === 'GET' && donationGetMatch) {
    return handleGetDonation(req, res, donationGetMatch[1]);
  }

  // No route matched
  return res.status(404).json({ error: 'Not found' });
}
