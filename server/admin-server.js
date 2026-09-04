/**
 * Local Admin Server for Development
 *
 * This provides a simple API for the admin dashboard when running locally.
 * In production, these endpoints would be Vercel serverless functions.
 *
 * Usage: node server/admin-server.js
 */

import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 3001;

// Admin config from environment
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'jsnook@supportworkshousing.org';
const SESSION_TOKEN = 'admin-session-token-' + crypto.randomBytes(32).toString('hex');

// The Crossings dashboard has its own password and its own session token.
// Two separate tokens rather than one with a scope claim, because that is
// all this dev stand-in needs: an admin token is a different string from a
// Crossings token, so neither opens the other's routes. Production signs a
// scope into the token instead -- see api/admin/[...path].js.
const CROSSINGS_PASSWORD = process.env.CROSSINGS_PASSWORD;
const CROSSINGS_TOKEN = 'crossings-session-token-' + crypto.randomBytes(32).toString('hex');

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase if credentials available
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  console.log('✓ Connected to Supabase');
} else {
  console.log('⚠ No Supabase credentials - using mock data');
}

// Mock data for development without Supabase
// This data is ONLY for localhost testing - never push to production

// Volunteers database
const mockVolunteers = [
  {
    id: 'v1',
    name: 'Sarah Johnson',
    email: 'sarah@gracecc.org',
    phone: '(804) 555-1234',
    organization: 'Grace Community Church',
    type: 'organization',
    notes: 'Very reliable group. Great with residents.',
    first_event: '2025-06-15',
    total_events: 8,
    created_at: '2025-06-01T10:00:00Z',
    _test: true,
  },
  {
    id: 'v2',
    name: 'Mike Chen',
    email: 'mchen@vcu.edu',
    phone: '(804) 555-5678',
    organization: 'VCU Student Volunteers',
    type: 'organization',
    notes: 'College students, energetic group. Good for game nights.',
    first_event: '2025-09-10',
    total_events: 5,
    created_at: '2025-09-01T14:30:00Z',
    _test: true,
  },
  {
    id: 'v3',
    name: 'David Williams',
    email: 'david@richmondrotary.org',
    phone: '(804) 555-9012',
    organization: 'Richmond Rotary Club',
    type: 'organization',
    notes: 'Professional group, prefers weekday evenings.',
    first_event: '2025-07-20',
    total_events: 6,
    created_at: '2025-07-15T09:00:00Z',
    _test: true,
  },
  {
    id: 'v4',
    name: 'Pastor James Miller',
    email: 'jmiller@firstbaptist.org',
    phone: '(804) 555-2345',
    organization: 'First Baptist Youth Group',
    type: 'organization',
    notes: 'Youth group ages 14-18. Always brings homemade food.',
    first_event: '2025-08-05',
    total_events: 7,
    created_at: '2025-08-01T11:00:00Z',
    _test: true,
  },
  {
    id: 'v5',
    name: 'Lisa Martinez',
    email: 'lmartinez@henrico.k12.va.us',
    phone: '(804) 555-3456',
    organization: 'Henrico High School Key Club',
    type: 'organization',
    notes: 'High school service club. Need adult chaperone present.',
    first_event: '2025-10-12',
    total_events: 4,
    created_at: '2025-10-01T16:00:00Z',
    _test: true,
  },
  {
    id: 'v6',
    name: 'Tom Anderson',
    email: 'tom@rivercityrunners.com',
    phone: '(804) 555-4567',
    organization: 'River City Running Club',
    type: 'organization',
    notes: 'Athletic group, good energy. Prefers active games.',
    first_event: '2025-11-08',
    total_events: 3,
    created_at: '2025-11-01T08:00:00Z',
    _test: true,
  },
  {
    id: 'v7',
    name: 'Maria Santos',
    email: 'msantos@stmarysrva.org',
    phone: '(804) 555-5678',
    organization: "St. Mary's Catholic Church",
    type: 'organization',
    notes: 'Bilingual group (English/Spanish). Wonderful with families.',
    first_event: '2025-05-20',
    total_events: 12,
    created_at: '2025-05-15T10:00:00Z',
    _test: true,
  },
  {
    id: 'v8',
    name: 'Jennifer Lee',
    email: 'jennifer.lee@capitalone.com',
    phone: '(804) 555-6789',
    organization: 'Capital One Cares Team',
    type: 'organization',
    notes: 'Corporate volunteer program. Well-organized, large groups.',
    first_event: '2025-04-10',
    total_events: 9,
    created_at: '2025-04-01T09:00:00Z',
    _test: true,
  },
  {
    id: 'v9',
    name: 'Brian Thompson',
    email: 'bthompson@uvaalumni.org',
    phone: '(804) 555-7890',
    organization: 'UVA Alumni Chapter',
    type: 'organization',
    notes: 'Alumni group, professional. Great trivia hosts.',
    first_event: '2025-09-25',
    total_events: 4,
    created_at: '2025-09-20T14:00:00Z',
    _test: true,
  },
  {
    id: 'v10',
    name: 'Nancy White',
    email: 'nwhite@midlothianwc.org',
    phone: '(804) 555-8901',
    organization: "Midlothian Women's Club",
    type: 'organization',
    notes: 'Experienced volunteers. Excellent craft activities.',
    first_event: '2025-03-15',
    total_events: 14,
    created_at: '2025-03-10T11:00:00Z',
    _test: true,
  },
  {
    id: 'v11',
    name: 'Alex Kumar',
    email: 'alex@rvatechmeetup.com',
    phone: '(804) 555-9012',
    organization: 'Richmond Tech Meetup',
    type: 'organization',
    notes: 'Tech professionals. Good with board games and puzzles.',
    first_event: '2025-12-05',
    total_events: 2,
    created_at: '2025-12-01T10:00:00Z',
    _test: true,
  },
  {
    id: 'v12',
    name: 'Patricia Green',
    email: 'pgreen@bonairgardens.org',
    phone: '(804) 555-0123',
    organization: 'Bon Air Garden Club',
    type: 'organization',
    notes: 'Smaller group, brings beautiful flower arrangements.',
    first_event: '2025-07-10',
    total_events: 5,
    created_at: '2025-07-05T09:00:00Z',
    _test: true,
  },
  {
    id: 'v13',
    name: 'Robert Davis',
    email: 'rdavis@carilloncivic.org',
    phone: '(804) 555-1234',
    organization: 'Carillon Civic Association',
    type: 'organization',
    notes: 'Neighborhood association. Very community-minded.',
    first_event: '2025-08-20',
    total_events: 6,
    created_at: '2025-08-15T10:00:00Z',
    _test: true,
  },
  {
    id: 'v14',
    name: 'Emily Chen',
    email: 'echen@shortpumprotaract.org',
    phone: '(804) 555-2345',
    organization: 'Short Pump Rotaract',
    type: 'organization',
    notes: 'Young professionals Rotary group. Very enthusiastic.',
    first_event: '2025-10-30',
    total_events: 3,
    created_at: '2025-10-25T14:00:00Z',
    _test: true,
  },
  {
    id: 'v15',
    name: 'Michael Brown',
    email: 'mbrown@dominionenergy.com',
    phone: '(804) 555-3456',
    organization: 'Dominion Energy Volunteers',
    type: 'organization',
    notes: 'Large corporate group. Can handle big events.',
    first_event: '2025-02-15',
    total_events: 16,
    created_at: '2025-02-10T09:00:00Z',
    _test: true,
  },
  {
    id: 'v16',
    name: 'Rachel Kim',
    email: 'rachel.kim@gmail.com',
    phone: '(804) 555-4567',
    organization: null,
    type: 'individual',
    notes: 'Individual volunteer. Flexible schedule, very dependable.',
    first_event: '2025-06-25',
    total_events: 10,
    created_at: '2025-06-20T11:00:00Z',
    _test: true,
  },
  {
    id: 'v17',
    name: 'James Wilson',
    email: 'jwilson.volunteer@yahoo.com',
    phone: '(804) 555-5678',
    organization: null,
    type: 'individual',
    notes: 'Retired teacher. Great with conversation and games.',
    first_event: '2025-04-20',
    total_events: 18,
    created_at: '2025-04-15T10:00:00Z',
    _test: true,
  },
  {
    id: 'v18',
    name: 'Amanda Foster',
    email: 'afoster@outlook.com',
    phone: '(804) 555-6789',
    organization: null,
    type: 'individual',
    notes: 'Social worker by profession. Excellent with residents.',
    first_event: '2025-05-05',
    total_events: 15,
    created_at: '2025-05-01T09:00:00Z',
    _test: true,
  },
];

const mockEvents = [
  // ========== HISTORICAL EVENTS (Completed) ==========
  // September 2025
  { id: 'h1', volunteer_id: 'v7', group_name: "St. Mary's Catholic Church", location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, September 9', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Maria Santos', contact_email: 'msantos@stmarysrva.org', contact_phone: '(804) 555-5678', group_size: 16, food_plan: 'bring', activity_plan: 'Bingo', status: 'completed', created_at: '2025-08-25T10:00:00Z', completed_at: '2025-09-09T20:00:00Z', _test: true },
  { id: 'h2', volunteer_id: 'v8', group_name: 'Capital One Cares Team', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, September 11', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Jennifer Lee', contact_email: 'jennifer.lee@capitalone.com', contact_phone: '(804) 555-6789', group_size: 22, food_plan: 'cater', activity_plan: 'Board games', status: 'completed', created_at: '2025-08-28T14:00:00Z', completed_at: '2025-09-11T20:00:00Z', _test: true },
  { id: 'h3', volunteer_id: 'v17', group_name: 'James Wilson (Individual)', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, September 16', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'James Wilson', contact_email: 'jwilson.volunteer@yahoo.com', contact_phone: '(804) 555-5678', group_size: 1, food_plan: 'bring', activity_plan: 'Conversation & Games', status: 'completed', created_at: '2025-09-01T09:00:00Z', completed_at: '2025-09-16T20:00:00Z', _test: true },
  { id: 'h4', volunteer_id: 'v15', group_name: 'Dominion Energy Volunteers', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Wednesday, September 17', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Michael Brown', contact_email: 'mbrown@dominionenergy.com', contact_phone: '(804) 555-3456', group_size: 28, food_plan: 'cater', activity_plan: 'Board games', status: 'completed', created_at: '2025-09-03T11:00:00Z', completed_at: '2025-09-17T20:00:00Z', _test: true },
  { id: 'h5', volunteer_id: 'v2', group_name: 'VCU Student Volunteers', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, September 25', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Mike Chen', contact_email: 'mchen@vcu.edu', contact_phone: '(804) 555-5678', group_size: 10, food_plan: 'bring', activity_plan: 'Trivia', status: 'completed', created_at: '2025-09-10T14:00:00Z', completed_at: '2025-09-25T20:00:00Z', _test: true },

  // October 2025
  { id: 'h6', volunteer_id: 'v10', group_name: "Midlothian Women's Club", location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, October 7', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Nancy White', contact_email: 'nwhite@midlothianwc.org', contact_phone: '(804) 555-8901', group_size: 12, food_plan: 'bring', activity_plan: 'Crafts', status: 'completed', created_at: '2025-09-22T10:00:00Z', completed_at: '2025-10-07T20:00:00Z', _test: true },
  { id: 'h7', volunteer_id: 'v4', group_name: 'First Baptist Youth Group', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, October 9', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Pastor James Miller', contact_email: 'jmiller@firstbaptist.org', contact_phone: '(804) 555-2345', group_size: 18, food_plan: 'bring', activity_plan: 'Games & Fellowship', status: 'completed', created_at: '2025-09-25T11:00:00Z', completed_at: '2025-10-09T20:00:00Z', _test: true },
  { id: 'h8', volunteer_id: 'v18', group_name: 'Amanda Foster (Individual)', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, October 14', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Amanda Foster', contact_email: 'afoster@outlook.com', contact_phone: '(804) 555-6789', group_size: 1, food_plan: 'bring', activity_plan: 'Conversation', status: 'completed', created_at: '2025-10-01T09:00:00Z', completed_at: '2025-10-14T20:00:00Z', _test: true },
  { id: 'h9', volunteer_id: 'v1', group_name: 'Grace Community Church', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Wednesday, October 15', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Sarah Johnson', contact_email: 'sarah@gracecc.org', contact_phone: '(804) 555-1234', group_size: 14, food_plan: 'bring', activity_plan: 'Board games', status: 'completed', created_at: '2025-10-02T10:00:00Z', completed_at: '2025-10-15T20:00:00Z', _test: true },
  { id: 'h10', volunteer_id: 'v13', group_name: 'Carillon Civic Association', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, October 23', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Robert Davis', contact_email: 'rdavis@carilloncivic.org', contact_phone: '(804) 555-1234', group_size: 20, food_plan: 'bring', activity_plan: 'Halloween Party', status: 'completed', created_at: '2025-10-08T14:00:00Z', completed_at: '2025-10-23T20:00:00Z', _test: true },
  { id: 'h11', volunteer_id: 'v16', group_name: 'Rachel Kim (Individual)', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, October 28', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Rachel Kim', contact_email: 'rachel.kim@gmail.com', contact_phone: '(804) 555-4567', group_size: 1, food_plan: 'bring', activity_plan: 'Crafts', status: 'completed', created_at: '2025-10-15T11:00:00Z', completed_at: '2025-10-28T20:00:00Z', _test: true },

  // November 2025
  { id: 'h12', volunteer_id: 'v3', group_name: 'Richmond Rotary Club', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, November 4', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'David Williams', contact_email: 'david@richmondrotary.org', contact_phone: '(804) 555-9012', group_size: 15, food_plan: 'bring', activity_plan: 'Bingo', status: 'completed', created_at: '2025-10-20T10:00:00Z', completed_at: '2025-11-04T20:00:00Z', _test: true },
  { id: 'h13', volunteer_id: 'v6', group_name: 'River City Running Club', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, November 6', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Tom Anderson', contact_email: 'tom@rivercityrunners.com', contact_phone: '(804) 555-4567', group_size: 12, food_plan: 'bring', activity_plan: 'Trivia', status: 'completed', created_at: '2025-10-22T09:00:00Z', completed_at: '2025-11-06T20:00:00Z', _test: true },
  { id: 'h14', volunteer_id: 'v7', group_name: "St. Mary's Catholic Church", location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, November 11', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Maria Santos', contact_email: 'msantos@stmarysrva.org', contact_phone: '(804) 555-5678', group_size: 20, food_plan: 'bring', activity_plan: 'Veterans Day Celebration', status: 'completed', created_at: '2025-10-28T11:00:00Z', completed_at: '2025-11-11T20:00:00Z', _test: true },
  { id: 'h15', volunteer_id: 'v8', group_name: 'Capital One Cares Team', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Wednesday, November 19', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Jennifer Lee', contact_email: 'jennifer.lee@capitalone.com', contact_phone: '(804) 555-6789', group_size: 25, food_plan: 'cater', activity_plan: 'Thanksgiving Dinner', status: 'completed', created_at: '2025-11-05T14:00:00Z', completed_at: '2025-11-19T20:00:00Z', _test: true },

  // December 2025
  { id: 'h16', volunteer_id: 'v15', group_name: 'Dominion Energy Volunteers', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, December 2', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Michael Brown', contact_email: 'mbrown@dominionenergy.com', contact_phone: '(804) 555-3456', group_size: 30, food_plan: 'cater', activity_plan: 'Holiday Party', status: 'completed', created_at: '2025-11-18T10:00:00Z', completed_at: '2025-12-02T20:00:00Z', _test: true },
  { id: 'h17', volunteer_id: 'v11', group_name: 'Richmond Tech Meetup', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, December 4', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Alex Kumar', contact_email: 'alex@rvatechmeetup.com', contact_phone: '(804) 555-9012', group_size: 14, food_plan: 'cater', activity_plan: 'Board games', status: 'completed', created_at: '2025-11-20T09:00:00Z', completed_at: '2025-12-04T20:00:00Z', _test: true },
  { id: 'h18', volunteer_id: 'v4', group_name: 'First Baptist Youth Group', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, December 9', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Pastor James Miller', contact_email: 'jmiller@firstbaptist.org', contact_phone: '(804) 555-2345', group_size: 22, food_plan: 'bring', activity_plan: 'Christmas Caroling', status: 'completed', created_at: '2025-11-25T11:00:00Z', completed_at: '2025-12-09T20:00:00Z', _test: true },
  { id: 'h19', volunteer_id: 'v10', group_name: "Midlothian Women's Club", location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Wednesday, December 10', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Nancy White', contact_email: 'nwhite@midlothianwc.org', contact_phone: '(804) 555-8901', group_size: 15, food_plan: 'bring', activity_plan: 'Holiday Crafts', status: 'completed', created_at: '2025-11-26T10:00:00Z', completed_at: '2025-12-10T20:00:00Z', _test: true },
  { id: 'h20', volunteer_id: 'v17', group_name: 'James Wilson (Individual)', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, December 18', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'James Wilson', contact_email: 'jwilson.volunteer@yahoo.com', contact_phone: '(804) 555-5678', group_size: 1, food_plan: 'bring', activity_plan: 'Holiday Stories', status: 'completed', created_at: '2025-12-05T09:00:00Z', completed_at: '2025-12-18T20:00:00Z', _test: true },

  // January 2026
  { id: 'h21', volunteer_id: 'v1', group_name: 'Grace Community Church', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, January 7', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Sarah Johnson', contact_email: 'sarah@gracecc.org', contact_phone: '(804) 555-1234', group_size: 12, food_plan: 'bring', activity_plan: 'Board games', status: 'completed', created_at: '2025-12-23T10:00:00Z', completed_at: '2026-01-07T20:00:00Z', _test: true },
  { id: 'h22', volunteer_id: 'v9', group_name: 'UVA Alumni Chapter', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, January 9', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Brian Thompson', contact_email: 'bthompson@uvaalumni.org', contact_phone: '(804) 555-7890', group_size: 10, food_plan: 'bring', activity_plan: 'Trivia Night', status: 'completed', created_at: '2025-12-26T14:00:00Z', completed_at: '2026-01-09T20:00:00Z', _test: true },
  { id: 'h23', volunteer_id: 'v18', group_name: 'Amanda Foster (Individual)', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, January 14', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Amanda Foster', contact_email: 'afoster@outlook.com', contact_phone: '(804) 555-6789', group_size: 1, food_plan: 'bring', activity_plan: 'Conversation', status: 'completed', created_at: '2026-01-02T09:00:00Z', completed_at: '2026-01-14T20:00:00Z', _test: true },
  { id: 'h24', volunteer_id: 'v14', group_name: 'Short Pump Rotaract', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Wednesday, January 15', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Emily Chen', contact_email: 'echen@shortpumprotaract.org', contact_phone: '(804) 555-2345', group_size: 16, food_plan: 'cater', activity_plan: 'Game Night', status: 'completed', created_at: '2026-01-03T11:00:00Z', completed_at: '2026-01-15T20:00:00Z', _test: true },
  { id: 'h25', volunteer_id: 'v12', group_name: 'Bon Air Garden Club', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, January 23', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Patricia Green', contact_email: 'pgreen@bonairgardens.org', contact_phone: '(804) 555-0123', group_size: 8, food_plan: 'bring', activity_plan: 'Flower Arranging', status: 'completed', created_at: '2026-01-10T10:00:00Z', completed_at: '2026-01-23T20:00:00Z', _test: true },
  { id: 'h26', volunteer_id: 'v16', group_name: 'Rachel Kim (Individual)', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, January 28', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Rachel Kim', contact_email: 'rachel.kim@gmail.com', contact_phone: '(804) 555-4567', group_size: 1, food_plan: 'bring', activity_plan: 'Crafts', status: 'completed', created_at: '2026-01-15T11:00:00Z', completed_at: '2026-01-28T20:00:00Z', _test: true },

  // ========== UPCOMING/CURRENT EVENTS ==========
  // February 2026
  { id: '1', volunteer_id: 'v1', group_name: 'Grace Community Church', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, February 11', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Sarah Johnson', contact_email: 'sarah@gracecc.org', contact_phone: '(804) 555-1234', group_size: 12, food_plan: 'bring', activity_plan: 'Board games', status: 'pending', created_at: '2026-01-28T10:00:00Z', _test: true },
  { id: '2', volunteer_id: 'v2', group_name: 'VCU Student Volunteers', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, February 13', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Mike Chen', contact_email: 'mchen@vcu.edu', contact_phone: '(804) 555-5678', group_size: 8, food_plan: 'cater', activity_plan: 'Trivia', status: 'approved', created_at: '2026-01-27T14:00:00Z', _test: true },
  { id: '3', volunteer_id: 'v3', group_name: 'Richmond Rotary Club', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Wednesday, February 19', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'David Williams', contact_email: 'david@richmondrotary.org', contact_phone: '(804) 555-9012', group_size: 15, food_plan: 'bring', activity_plan: 'Bingo', status: 'denied', denial_reason: 'Date conflict with property maintenance', created_at: '2026-01-26T10:00:00Z', _test: true },
  { id: '4', volunteer_id: 'v4', group_name: 'First Baptist Youth Group', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, February 18', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Pastor James Miller', contact_email: 'jmiller@firstbaptist.org', contact_phone: '(804) 555-2345', group_size: 20, food_plan: 'bring', activity_plan: 'Crafts', status: 'approved', created_at: '2026-01-25T11:00:00Z', _test: true },
  { id: '5', volunteer_id: 'v5', group_name: 'Henrico High School Key Club', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, February 20', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Lisa Martinez', contact_email: 'lmartinez@henrico.k12.va.us', contact_phone: '(804) 555-3456', group_size: 15, food_plan: 'cater', activity_plan: 'Board games', status: 'pending', created_at: '2026-01-24T16:00:00Z', _test: true },
  { id: '6', volunteer_id: 'v6', group_name: 'River City Running Club', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Wednesday, February 26', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Tom Anderson', contact_email: 'tom@rivercityrunners.com', contact_phone: '(804) 555-4567', group_size: 10, food_plan: 'bring', activity_plan: 'Trivia', status: 'approved', created_at: '2026-01-23T09:00:00Z', _test: true },
  { id: '7', volunteer_id: 'v7', group_name: "St. Mary's Catholic Church", location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, February 25', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Maria Santos', contact_email: 'msantos@stmarysrva.org', contact_phone: '(804) 555-5678', group_size: 18, food_plan: 'bring', activity_plan: 'Bingo', status: 'pending', created_at: '2026-01-22T11:00:00Z', _test: true },

  // March 2026
  { id: '8', volunteer_id: 'v8', group_name: 'Capital One Cares Team', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, March 6', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Jennifer Lee', contact_email: 'jennifer.lee@capitalone.com', contact_phone: '(804) 555-6789', group_size: 25, food_plan: 'cater', activity_plan: 'Board games', status: 'approved', created_at: '2026-01-21T14:00:00Z', _test: true },
  { id: '9', volunteer_id: 'v9', group_name: 'UVA Alumni Chapter', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, March 4', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Brian Thompson', contact_email: 'bthompson@uvaalumni.org', contact_phone: '(804) 555-7890', group_size: 12, food_plan: 'bring', activity_plan: 'Trivia', status: 'pending', created_at: '2026-01-20T14:00:00Z', _test: true },
  { id: '10', volunteer_id: 'v10', group_name: "Midlothian Women's Club", location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Wednesday, March 5', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Nancy White', contact_email: 'nwhite@midlothianwc.org', contact_phone: '(804) 555-8901', group_size: 14, food_plan: 'bring', activity_plan: 'Crafts', status: 'approved', created_at: '2026-01-19T10:00:00Z', _test: true },
  { id: '11', volunteer_id: 'v11', group_name: 'Richmond Tech Meetup', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, March 13', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Alex Kumar', contact_email: 'alex@rvatechmeetup.com', contact_phone: '(804) 555-9012', group_size: 16, food_plan: 'cater', activity_plan: 'Board games', status: 'pending', created_at: '2026-01-18T10:00:00Z', _test: true },
  { id: '12', volunteer_id: 'v12', group_name: 'Bon Air Garden Club', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, March 11', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Patricia Green', contact_email: 'pgreen@bonairgardens.org', contact_phone: '(804) 555-0123', group_size: 10, food_plan: 'bring', activity_plan: 'Bingo', status: 'denied', denial_reason: 'Group size too small for requested date', created_at: '2026-01-17T10:00:00Z', _test: true },
  { id: '13', volunteer_id: 'v13', group_name: 'Carillon Civic Association', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Wednesday, March 12', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Robert Davis', contact_email: 'rdavis@carilloncivic.org', contact_phone: '(804) 555-1234', group_size: 22, food_plan: 'bring', activity_plan: 'Trivia', status: 'approved', created_at: '2026-01-16T14:00:00Z', _test: true },
  { id: '14', volunteer_id: 'v14', group_name: 'Short Pump Rotaract', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, March 18', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Emily Chen', contact_email: 'echen@shortpumprotaract.org', contact_phone: '(804) 555-2345', group_size: 18, food_plan: 'cater', activity_plan: 'Crafts', status: 'pending', created_at: '2026-01-15T11:00:00Z', _test: true },
  { id: '15', volunteer_id: 'v15', group_name: 'Dominion Energy Volunteers', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, March 20', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Michael Brown', contact_email: 'mbrown@dominionenergy.com', contact_phone: '(804) 555-3456', group_size: 30, food_plan: 'cater', activity_plan: 'Board games', status: 'approved', created_at: '2026-01-14T09:00:00Z', _test: true },
];

// Supply Drive submissions
const mockSupplyDrives = [
  {
    id: 'sd1',
    volunteer_id: 'v8',
    event_type: 'supply-drive',
    contact_name: 'Jennifer Lee',
    contact_email: 'jennifer.lee@capitalone.com',
    contact_phone: '(804) 555-6789',
    organization: 'Capital One Cares Team',
    location_name: 'New Clay House',
    location_address: '707 N Harrison St, Richmond, VA 23220',
    drop_off_date: 'Friday, February 7',
    drop_off_time: '9:00 AM - 5:00 PM',
    items: ['All-purpose cleaner', 'Dish soap', 'Paper towels', 'Toilet paper', 'Shampoo', 'Body wash/soap'],
    notes: 'We have about 50 care packages to drop off.',
    status: 'completed',
    created_at: '2026-01-20T10:00:00Z',
    completed_at: '2026-02-07T14:00:00Z',
    _test: true,
  },
  {
    id: 'sd2',
    volunteer_id: 'v10',
    event_type: 'supply-drive',
    contact_name: 'Nancy White',
    contact_email: 'nwhite@midlothianwc.org',
    contact_phone: '(804) 555-8901',
    organization: "Midlothian Women's Club",
    location_name: 'New Clay House',
    location_address: '707 N Harrison St, Richmond, VA 23220',
    drop_off_date: 'Friday, February 14',
    drop_off_time: '9:00 AM - 5:00 PM',
    items: ['Bath towels', 'Washcloths', 'Twin sheets', 'Pillows', 'Blankets'],
    notes: 'Collected linens from our annual drive.',
    status: 'approved',
    created_at: '2026-02-01T11:00:00Z',
    _test: true,
  },
  {
    id: 'sd3',
    volunteer_id: 'v16',
    event_type: 'supply-drive',
    contact_name: 'Rachel Kim',
    contact_email: 'rachel.kim@gmail.com',
    contact_phone: '(804) 555-4567',
    organization: null,
    location_name: 'New Clay House',
    location_address: '707 N Harrison St, Richmond, VA 23220',
    drop_off_date: 'Friday, February 21',
    drop_off_time: '9:00 AM - 5:00 PM',
    items: ['Canned vegetables', 'Canned soup', 'Pasta', 'Rice', 'Peanut butter', 'Cereal'],
    notes: 'Personal donation - cleaning out my pantry of extras.',
    status: 'pending',
    created_at: '2026-02-02T09:00:00Z',
    _test: true,
  },
  // January 2026 Supply Drives (completed)
  {
    id: 'sd4',
    volunteer_id: 'v1',
    event_type: 'supply-drive',
    contact_name: 'Sarah Johnson',
    contact_email: 'sarah@gracecc.org',
    contact_phone: '(804) 555-1234',
    organization: 'Grace Community Church',
    location_name: 'New Clay House',
    location_address: '707 N Harrison St, Richmond, VA 23220',
    drop_off_date: 'Friday, January 3',
    drop_off_time: '9:00 AM - 5:00 PM',
    items: ['Toilet paper', 'Paper towels', 'Trash bags', 'Laundry detergent', 'Dish soap'],
    notes: 'New year cleaning supply drive from our congregation.',
    status: 'completed',
    created_at: '2025-12-20T10:00:00Z',
    completed_at: '2026-01-03T14:00:00Z',
    _test: true,
  },
  {
    id: 'sd5',
    volunteer_id: 'v15',
    event_type: 'supply-drive',
    contact_name: 'Michael Brown',
    contact_email: 'mbrown@dominionenergy.com',
    contact_phone: '(804) 555-3456',
    organization: 'Dominion Energy Volunteers',
    location_name: 'New Clay House',
    location_address: '707 N Harrison St, Richmond, VA 23220',
    drop_off_date: 'Friday, January 10',
    drop_off_time: '9:00 AM - 5:00 PM',
    items: ['Bath towels', 'Washcloths', 'Twin sheets', 'Pillows', 'Blankets'],
    notes: 'Corporate donation drive - linens collection.',
    status: 'completed',
    created_at: '2025-12-28T14:00:00Z',
    completed_at: '2026-01-10T15:30:00Z',
    _test: true,
  },
  {
    id: 'sd6',
    volunteer_id: 'v7',
    event_type: 'supply-drive',
    contact_name: 'Maria Santos',
    contact_email: 'msantos@stmarysrva.org',
    contact_phone: '(804) 555-5678',
    organization: "St. Mary's Catholic Church",
    location_name: 'New Clay House',
    location_address: '707 N Harrison St, Richmond, VA 23220',
    drop_off_date: 'Friday, January 17',
    drop_off_time: '9:00 AM - 5:00 PM',
    items: ['Canned vegetables', 'Canned soup', 'Pasta', 'Rice', 'Peanut butter', 'Cereal'],
    notes: 'Parish food drive collection.',
    status: 'completed',
    created_at: '2026-01-05T10:00:00Z',
    completed_at: '2026-01-17T11:00:00Z',
    _test: true,
  },
  {
    id: 'sd7',
    volunteer_id: 'v17',
    event_type: 'supply-drive',
    contact_name: 'James Wilson',
    contact_email: 'jwilson.volunteer@yahoo.com',
    contact_phone: '(804) 555-5678',
    organization: null,
    location_name: 'New Clay House',
    location_address: '707 N Harrison St, Richmond, VA 23220',
    drop_off_date: 'Friday, January 24',
    drop_off_time: '9:00 AM - 5:00 PM',
    items: ['Toothpaste', 'Toothbrushes', 'Deodorant', 'Shampoo', 'Conditioner', 'Body wash/soap'],
    notes: 'Personal toiletry donation.',
    status: 'completed',
    created_at: '2026-01-12T11:00:00Z',
    completed_at: '2026-01-24T10:30:00Z',
    _test: true,
  },
  {
    id: 'sd8',
    volunteer_id: 'v5',
    event_type: 'supply-drive',
    contact_name: 'Lisa Martinez',
    contact_email: 'lmartinez@henrico.k12.va.us',
    contact_phone: '(804) 555-3456',
    organization: 'Henrico High School Key Club',
    location_name: 'New Clay House',
    location_address: '707 N Harrison St, Richmond, VA 23220',
    drop_off_date: 'Friday, January 31',
    drop_off_time: '9:00 AM - 5:00 PM',
    items: ['All-purpose cleaner', 'Disinfecting wipes', 'Sponges', 'Trash bags', 'Paper towels'],
    notes: 'Student council cleaning supply drive.',
    status: 'completed',
    created_at: '2026-01-18T09:00:00Z',
    completed_at: '2026-01-31T14:00:00Z',
    _test: true,
  },
  // February 2026 Supply Drives (current month)
  {
    id: 'sd9',
    volunteer_id: 'v9',
    event_type: 'supply-drive',
    contact_name: 'Brian Thompson',
    contact_email: 'bthompson@uvaalumni.org',
    contact_phone: '(804) 555-7890',
    organization: 'UVA Alumni Chapter',
    location_name: 'New Clay House',
    location_address: '707 N Harrison St, Richmond, VA 23220',
    drop_off_date: 'Friday, February 28',
    drop_off_time: '9:00 AM - 5:00 PM',
    items: ['Canned vegetables', 'Canned soup', 'Pasta', 'Rice', 'Cooking oil', 'Cereal'],
    notes: 'Alumni association food drive.',
    status: 'pending',
    created_at: '2026-02-01T14:00:00Z',
    _test: true,
  },
];

// Donation records (mock Stripe data)
const mockDonations = [
  // Donations from existing volunteers (making them "both")
  {
    id: 'd1',
    payment_intent_id: 'pi_3Qa1b2c3d4e5f6g7h8',
    amount: 100,
    donation_type: 'one-time',
    donor_name: 'Sarah Johnson',
    donor_email: 'sarah@gracecc.org',
    donor_phone: '(804) 555-1234',
    donor_address: '123 Grace Ave, Richmond, VA 23220',
    volunteer_id: 'v1',
    created_at: '2025-12-15T14:30:00Z',
    _test: true,
  },
  {
    id: 'd2',
    payment_intent_id: 'pi_8Xk9m2n3p4q5r6s7t8',
    amount: 250,
    donation_type: 'monthly',
    donor_name: 'Jennifer Lee',
    donor_email: 'jennifer.lee@capitalone.com',
    donor_phone: '(804) 555-6789',
    donor_address: '456 Corporate Blvd, Richmond, VA 23219',
    volunteer_id: 'v8',
    created_at: '2025-11-20T09:15:00Z',
    _test: true,
  },
  {
    id: 'd3',
    payment_intent_id: 'pi_2Yz3a4b5c6d7e8f9g0',
    amount: 50,
    donation_type: 'one-time',
    donor_name: 'Rachel Kim',
    donor_email: 'rachel.kim@gmail.com',
    donor_phone: '(804) 555-4567',
    donor_address: '789 Elm St, Richmond, VA 23221',
    volunteer_id: 'v16',
    created_at: '2026-01-10T16:45:00Z',
    _test: true,
  },
  {
    id: 'd4',
    payment_intent_id: 'pi_4Cd5e6f7g8h9i0j1k2',
    amount: 75,
    donation_type: 'one-time',
    donor_name: 'Rachel Kim',
    donor_email: 'rachel.kim@gmail.com',
    donor_phone: '(804) 555-4567',
    donor_address: '789 Elm St, Richmond, VA 23221',
    volunteer_id: 'v16',
    created_at: '2026-02-05T11:20:00Z',
    _test: true,
  },
  {
    id: 'd5',
    payment_intent_id: 'pi_6Ef7g8h9i0j1k2l3m4',
    amount: 500,
    donation_type: 'one-time',
    donor_name: 'James Wilson',
    donor_email: 'jwilson.volunteer@yahoo.com',
    donor_phone: '(804) 555-5678',
    donor_address: '321 Oak Lane, Richmond, VA 23222',
    volunteer_id: 'v17',
    created_at: '2025-12-28T10:00:00Z',
    _test: true,
  },
  // Donor-only people (no volunteer_id)
  {
    id: 'd6',
    payment_intent_id: 'pi_7Fg8h9i0j1k2l3m4n5',
    amount: 200,
    donation_type: 'monthly',
    donor_name: 'Catherine Brooks',
    donor_email: 'cbrooks@outlook.com',
    donor_phone: '(804) 555-7777',
    donor_address: '550 Monument Ave, Richmond, VA 23220',
    volunteer_id: null,
    created_at: '2025-11-05T13:00:00Z',
    _test: true,
  },
  {
    id: 'd7',
    payment_intent_id: 'pi_9Hi0j1k2l3m4n5o6p7',
    amount: 200,
    donation_type: 'monthly',
    donor_name: 'Catherine Brooks',
    donor_email: 'cbrooks@outlook.com',
    donor_phone: '(804) 555-7777',
    donor_address: '550 Monument Ave, Richmond, VA 23220',
    volunteer_id: null,
    created_at: '2025-12-05T13:00:00Z',
    _test: true,
  },
  {
    id: 'd8',
    payment_intent_id: 'pi_1Ab2c3d4e5f6g7h8i9',
    amount: 1000,
    donation_type: 'one-time',
    donor_name: 'Robert Taylor',
    donor_email: 'rtaylor@taylorlaw.com',
    donor_phone: '(804) 555-8888',
    donor_address: '900 Main St, Suite 200, Richmond, VA 23219',
    volunteer_id: null,
    created_at: '2026-01-22T15:30:00Z',
    _test: true,
  },
  {
    id: 'd9',
    payment_intent_id: 'pi_3Cd4e5f6g7h8i9j0k1',
    amount: 150,
    donation_type: 'one-time',
    donor_name: 'Priya Patel',
    donor_email: 'priya.patel@gmail.com',
    donor_phone: '(804) 555-9999',
    donor_address: '42 Riverside Dr, Richmond, VA 23225',
    volunteer_id: null,
    created_at: '2026-02-01T10:45:00Z',
    _test: true,
  },
  {
    id: 'd10',
    payment_intent_id: 'pi_5Ef6g7h8i9j0k1l2m3',
    amount: 25,
    donation_type: 'one-time',
    donor_name: 'William & Margaret Hayes',
    donor_email: 'wmhayes@verizon.net',
    donor_phone: '(804) 555-1010',
    donor_address: '15 Church Hill Rd, Richmond, VA 23223',
    volunteer_id: null,
    created_at: '2026-02-08T18:00:00Z',
    _test: true,
  },
];

// Auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || '';
  // Constant-time comparison against the full issued token. A prefix check
  // (startsWith) or a plain === would let a forged/guessed token through;
  // timingSafeEqual requires equal-length buffers, so length is checked first.
  const tokenBuf = Buffer.from(token);
  const expectedBuf = Buffer.from(SESSION_TOKEN);
  if (
    tokenBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(tokenBuf, expectedBuf)
  ) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Public endpoint - get booked dates (no auth required)
// Returns dates that have pending or approved events (both Connection Nights and Supply Drives)
app.get('/api/booked-dates', (req, res) => {
  try {
    const connectionNightDates = mockEvents
      .filter(e => e.status === 'pending' || e.status === 'approved')
      .map(e => e.time_slot_day);

    const supplyDriveDates = mockSupplyDrives
      .filter(e => e.status === 'pending' || e.status === 'approved')
      .map(e => e.drop_off_date);

    res.json({
      bookedDates: connectionNightDates,
      bookedSupplyDriveDates: supplyDriveDates,
    });
  } catch (error) {
    console.error('Error fetching booked dates:', error);
    res.status(500).json({ error: 'Failed to fetch booked dates' });
  }
});

// Public endpoint - submit a supply drive (no auth required)
app.post('/api/supply-drives', (req, res) => {
  try {
    const {
      contact_name,
      contact_email,
      contact_phone,
      organization,
      location_name,
      location_address,
      drop_off_date,
      drop_off_time,
      items,
      notes,
    } = req.body;

    const newSupplyDrive = {
      id: 'sd' + (mockSupplyDrives.length + 1),
      volunteer_id: null, // Will be linked when volunteer is created/found
      event_type: 'supply-drive',
      contact_name,
      contact_email,
      contact_phone,
      organization: organization || null,
      location_name,
      location_address,
      drop_off_date,
      drop_off_time,
      items,
      notes: notes || null,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    mockSupplyDrives.push(newSupplyDrive);
    console.log('New supply drive submission:', newSupplyDrive);

    res.json({ success: true, id: newSupplyDrive.id });
  } catch (error) {
    console.error('Error creating supply drive:', error);
    res.status(500).json({ error: 'Failed to create supply drive' });
  }
});

// Public endpoint - send email (dev: logs what would be sent, no actual Resend call)
app.post('/api/send-email', (req, res) => {
  try {
    const { type, contactName, contactEmail } = req.body;

    console.log('\n📧 [DEV] send-email called');
    console.log('─── Admin Notification ───');
    console.log(`  To: ${ADMIN_EMAIL}`);
    console.log(`  Type: ${type}`);
    console.log(`  From: ${contactName} <${contactEmail}>`);
    console.log('  Body:', JSON.stringify(req.body, null, 2));

    console.log('─── Receipt Email ───');
    console.log(`  To: ${contactEmail}`);
    console.log(`  Subject: Thank You for Your ${type === 'supply-drive' ? 'Supply Drive Donation' : 'Connection Night Request'}!`);
    console.log('');

    res.json({ success: true, id: 'dev-' + Date.now() });
  } catch (error) {
    console.error('Error in send-email dev endpoint:', error);
    res.status(500).json({ error: 'Failed to process email request' });
  }
});

// Login endpoint
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;

  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, token: SESSION_TOKEN });
  } else {
    res.status(401).json({ success: false, error: 'Invalid password' });
  }
});

// ─── The Crossings asset dashboard ──────────────────────────────────────────

app.post('/api/admin/crossings-login', (req, res) => {
  const { password } = req.body;
  if (!CROSSINGS_PASSWORD) {
    return res.status(500).json({ error: 'CROSSINGS_PASSWORD is not set' });
  }
  if (password === CROSSINGS_PASSWORD) {
    return res.json({ success: true, token: CROSSINGS_TOKEN });
  }
  // Matches production's penalty on a wrong password.
  return setTimeout(
    () => res.status(401).json({ success: false, error: 'Invalid password' }),
    1000
  );
});

// Accepts either token: an admin already has strictly more access than this
// dashboard grants, so a second password would be ceremony.
const crossingsAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || '';
  for (const expected of [CROSSINGS_TOKEN, SESSION_TOKEN]) {
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
};

app.get('/api/admin/crossings', crossingsAuth, async (req, res) => {
  try {
    const { default: encoded } = await import('../api/admin/_crossings-dashboard.js');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(Buffer.from(encoded, 'base64').toString('utf8'));
  } catch (err) {
    console.error('crossings dashboard:', err.message);
    res.status(500).json({
      error: 'Dashboard payload missing. Run: node scripts/sync-crossings-dashboard.mjs',
    });
  }
});

// Get events (includes both Connection Nights and Supply Drives)
app.get('/api/admin/events', authMiddleware, async (req, res) => {
  try {
    // Fetch real data from Supabase
    let supabaseEvents = [];
    let supabaseSupplyDrives = [];
    if (supabase) {
      try {
        const { data: cnData } = await supabase
          .from('connection_nights')
          .select('*')
          .order('created_at', { ascending: false });
        if (cnData) {
          supabaseEvents = cnData.map(e => ({ ...e, event_type: 'connection-night' }));
        }
      } catch (err) {
        console.error('Supabase connection_nights error:', err.message);
      }

      try {
        const { data: sdData } = await supabase
          .from('supply_drives')
          .select('*')
          .order('created_at', { ascending: false });
        if (sdData) {
          supabaseSupplyDrives = sdData.map(e => ({ ...e, event_type: 'supply-drive' }));
        }
      } catch (err) {
        console.error('Supabase supply_drives error:', err.message);
      }
    }

    // Merge with mock data
    const mockEventsWithType = mockEvents.map(e => ({ ...e, event_type: 'connection-night' }));
    const allEvents = [...supabaseEvents, ...mockEventsWithType];
    const allSupplyDrives = [...supabaseSupplyDrives, ...mockSupplyDrives];

    res.json({ events: allEvents, supplyDrives: allSupplyDrives });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Approve event
app.post('/api/admin/events/:id/approve', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    if (supabase) {
      const { error } = await supabase
        .from('connection_nights')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      // Email notifications handled by Vercel API (api/approve-connection-night.js) in production

      res.json({ success: true });
    } else {
      // Update mock data
      const event = mockEvents.find(e => e.id === id);
      if (event) {
        event.status = 'approved';
      }
      res.json({ success: true });
    }
  } catch (error) {
    console.error('Error approving event:', error);
    res.status(500).json({ error: 'Failed to approve event' });
  }
});

// Deny event
app.post('/api/admin/events/:id/deny', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    if (supabase) {
      const { error } = await supabase
        .from('connection_nights')
        .update({
          status: 'denied',
          denial_reason: reason || null,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      // Email notifications handled by Vercel API (api/deny-connection-night.js) in production

      res.json({ success: true });
    } else {
      // Update mock data
      const event = mockEvents.find(e => e.id === id);
      if (event) {
        event.status = 'denied';
        event.denial_reason = reason || null;
      }
      res.json({ success: true });
    }
  } catch (error) {
    console.error('Error denying event:', error);
    res.status(500).json({ error: 'Failed to deny event' });
  }
});

// Approve supply drive
app.post('/api/admin/supply-drives/:id/approve', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    const { error } = await supabase.from('supply_drives')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error approving supply drive:', error);
    res.status(500).json({ error: 'Failed to approve supply drive' });
  }
});

// Deny supply drive
app.post('/api/admin/supply-drives/:id/deny', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    const { error } = await supabase.from('supply_drives')
      .update({ status: 'denied', denial_reason: reason || null })
      .eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error denying supply drive:', error);
    res.status(500).json({ error: 'Failed to deny supply drive' });
  }
});

// Mark supply drive as completed
app.post('/api/admin/supply-drives/:id/complete', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    if (supabase && id.includes('-') && id.length > 10) {
      await supabase.from('supply_drives')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', id);
      return res.json({ success: true });
    }
    const supplyDrive = mockSupplyDrives.find(e => e.id === id);
    if (supplyDrive) {
      supplyDrive.status = 'completed';
      supplyDrive.completed_at = new Date().toISOString();
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error completing supply drive:', error);
    res.status(500).json({ error: 'Failed to complete supply drive' });
  }
});

// Get all volunteers (now "people" — volunteers, donors, or both)
app.get('/api/admin/volunteers', authMiddleware, async (req, res) => {
  try {
    // Fetch all donations (Supabase + mock) for volunteer enrichment
    let allDonations = [...mockDonations];
    let supabasePeople = [];

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('donations')
          .select('*');

        if (!error && data) {
          const supabaseDonations = data.map(d => ({
            ...d,
            payment_intent_id: d.stripe_payment_intent_id,
            amount: parseFloat(d.amount),
          }));
          allDonations = [...supabaseDonations, ...mockDonations];
        }
      } catch (err) {
        console.error('Supabase donations error:', err.message);
      }

      // Fetch people from people table
      try {
        const { data: peopleData, error: peopleError } = await supabase
          .from('people')
          .select('*')
          .order('created_at', { ascending: false });

        if (!peopleError && peopleData) {
          supabasePeople = peopleData;
        }
      } catch (err) {
        console.error('Supabase people error:', err.message);
      }
    }

    // Build Supabase people into the same shape as mock volunteers
    const supabaseEmails = new Set();
    const realPeople = supabasePeople.map(p => {
      if (p.primary_email) supabaseEmails.add(p.primary_email.toLowerCase());

      const personDonations = allDonations.filter(
        d => d.person_id === p.id || (p.primary_email && d.donor_email && d.donor_email.toLowerCase() === p.primary_email.toLowerCase())
      );
      const totalDonated = personDonations.reduce((sum, d) => sum + d.amount, 0);

      return {
        id: p.id,
        name: [p.first_name, p.last_name].filter(Boolean).join(' ') || p.organization_name || 'Unknown',
        email: p.primary_email,
        phone: p.primary_phone,
        organization: p.organization_name,
        type: p.type === 'Organization' ? 'organization' : 'individual',
        notes: p.notes,
        roles: p.roles || [],
        total_events: 0,
        completed_events: 0,
        upcoming_events: 0,
        total_donated: totalDonated,
        donation_count: personDonations.length,
        last_event: null,
        next_event: null,
        created_at: p.created_at,
        _source: 'supabase',
      };
    });

    // Enrich mock volunteers with event counts and donation info
    const enrichedVolunteers = mockVolunteers.map(volunteer => {
      const volunteerEvents = mockEvents.filter(e => e.volunteer_id === volunteer.id);
      const completedEvents = volunteerEvents.filter(e => e.status === 'completed');
      const upcomingEvents = volunteerEvents.filter(e => ['pending', 'approved'].includes(e.status));

      const volunteerSupplyDrives = mockSupplyDrives.filter(e => e.volunteer_id === volunteer.id);
      const completedSupplyDrives = volunteerSupplyDrives.filter(e => e.status === 'completed');
      const upcomingSupplyDrives = volunteerSupplyDrives.filter(e => ['pending', 'approved'].includes(e.status));

      const allCompleted = [...completedEvents, ...completedSupplyDrives];
      const allUpcoming = [...upcomingEvents, ...upcomingSupplyDrives];

      const volunteerDonations = allDonations.filter(
        d => d.donor_email === volunteer.email || d.volunteer_id === volunteer.id
      );
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

    // Build donor-only people from donations not linked to any volunteer or Supabase person
    const volunteerEmails = new Set(mockVolunteers.map(v => v.email));
    const donorOnlyEmails = new Set();
    const donorOnlyPeople = [];
    allDonations
      .filter(d => !d.volunteer_id && !d.person_id && !volunteerEmails.has(d.donor_email) && !supabaseEmails.has((d.donor_email || '').toLowerCase()))
      .forEach(d => {
        if (!donorOnlyEmails.has(d.donor_email)) {
          donorOnlyEmails.add(d.donor_email);
          const allDonationsForDonor = allDonations.filter(
            dd => dd.donor_email === d.donor_email && !dd.volunteer_id && !dd.person_id && !volunteerEmails.has(dd.donor_email) && !supabaseEmails.has((dd.donor_email || '').toLowerCase())
          );
          const totalDonated = allDonationsForDonor.reduce((sum, dd) => sum + dd.amount, 0);
          const isTest = allDonationsForDonor.every(dd => dd._test);
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
            ...(isTest ? { _test: true } : {}),
          });
        }
      });

    res.json({ volunteers: [...realPeople, ...enrichedVolunteers, ...donorOnlyPeople] });
  } catch (error) {
    console.error('Error fetching volunteers:', error);
    res.status(500).json({ error: 'Failed to fetch volunteers' });
  }
});

// Get single volunteer/person with full event and donation history
app.get('/api/admin/volunteers/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch all donations (Supabase + mock)
    let allDonations = [...mockDonations];
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('donations')
          .select('*');

        if (!error && data) {
          const supabaseDonations = data.map(d => ({
            ...d,
            payment_intent_id: d.stripe_payment_intent_id,
            amount: parseFloat(d.amount),
          }));
          allDonations = [...supabaseDonations, ...mockDonations];
        }
      } catch (err) {
        console.error('Supabase donations error:', err.message);
      }
    }

    // Handle donor-only people (legacy synthetic IDs)
    if (id.startsWith('donor-')) {
      const donorEmail = id.replace('donor-', '');
      const donorDonations = allDonations
        .filter(d => d.donor_email === donorEmail)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      if (donorDonations.length === 0) {
        return res.status(404).json({ error: 'Person not found' });
      }

      const first = donorDonations[donorDonations.length - 1];
      const totalDonated = donorDonations.reduce((sum, d) => sum + d.amount, 0);
      const isTest = donorDonations.every(d => d._test);

      return res.json({
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
          interactions: [],
          created_at: first.created_at,
          ...(isTest ? { _test: true } : {}),
        },
      });
    }

    // Try Supabase people table for UUID-style IDs
    if (supabase && id.includes('-') && id.length > 10) {
      try {
        const { data: person, error: personError } = await supabase
          .from('people')
          .select('*')
          .eq('id', id)
          .single();

        if (!personError && person) {
          // Fetch related donations
          const personDonations = allDonations
            .filter(d => d.person_id === person.id || (person.primary_email && d.donor_email && d.donor_email.toLowerCase() === person.primary_email.toLowerCase()))
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          const totalDonated = personDonations.reduce((sum, d) => sum + d.amount, 0);

          // Fetch related connection nights
          let personEvents = [];
          const { data: cnData } = await supabase
            .from('connection_nights')
            .select('*')
            .eq('person_id', id)
            .order('created_at', { ascending: false });
          if (cnData) {
            personEvents = cnData.map(e => ({ ...e, event_type: 'connection-night' }));
          }

          // Fetch related supply drives
          let personSupplyDrives = [];
          const { data: sdData } = await supabase
            .from('supply_drives')
            .select('*')
            .eq('person_id', id)
            .order('created_at', { ascending: false });
          if (sdData) {
            personSupplyDrives = sdData.map(e => ({ ...e, event_type: 'supply-drive' }));
          }

          // Fetch interactions (activity log)
          let personInteractions = [];
          const { data: intData } = await supabase
            .from('interactions')
            .select('*')
            .eq('person_id', id)
            .order('occurred_at', { ascending: false });
          if (intData) {
            personInteractions = intData;
          }

          const allEvents = [...personEvents, ...personSupplyDrives]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

          return res.json({
            volunteer: {
              id: person.id,
              name: [person.first_name, person.last_name].filter(Boolean).join(' ') || person.organization_name || 'Unknown',
              email: person.primary_email,
              phone: person.primary_phone,
              organization: person.organization_name,
              type: person.type === 'Organization' ? 'organization' : 'individual',
              notes: person.notes,
              roles: person.roles || [],
              total_donated: totalDonated,
              donation_count: personDonations.length,
              events: allEvents,
              donations: personDonations,
              interactions: personInteractions,
              created_at: person.created_at,
              _source: 'supabase',
            },
          });
        }
      } catch (err) {
        console.error('Supabase person lookup error:', err.message);
      }
    }

    // Fall back to mock volunteers
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

    const volunteerDonations = allDonations
      .filter(d => d.donor_email === volunteer.email || d.volunteer_id === id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const totalDonated = volunteerDonations.reduce((sum, d) => sum + d.amount, 0);

    const roles = ['volunteer'];
    if (volunteerDonations.length > 0) roles.push('donor');

    res.json({
      volunteer: {
        ...volunteer,
        roles,
        total_donated: totalDonated,
        donation_count: volunteerDonations.length,
        events: allEvents,
        donations: volunteerDonations,
        interactions: [],
      },
    });
  } catch (error) {
    console.error('Error fetching volunteer:', error);
    res.status(500).json({ error: 'Failed to fetch volunteer' });
  }
});

// Update volunteer profile
app.patch('/api/admin/volunteers/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { notes, name, email, phone, organization } = req.body;

  try {
    // Try Supabase people table for UUID-style IDs
    if (supabase && id.includes('-') && id.length > 10 && !id.startsWith('v') && !id.startsWith('donor-')) {
      const updateData = {};
      if (notes !== undefined) updateData.notes = notes;
      if (name !== undefined) {
        const nameParts = (name || '').trim().split(/\s+/);
        updateData.first_name = nameParts[0] || null;
        updateData.last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;
      }
      if (email !== undefined) updateData.primary_email = email ? email.toLowerCase().trim() : null;
      if (phone !== undefined) updateData.primary_phone = phone;
      if (organization !== undefined) updateData.organization_name = organization;

      const { data: updated, error } = await supabase
        .from('people')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        return res.status(404).json({ error: 'Person not found' });
      }

      // Log interaction when notes change
      if (notes !== undefined) {
        await supabase.from('interactions').insert({
          person_id: id,
          type: 'note',
          subject: 'Notes updated',
          body: notes,
          created_by: 'admin',
        });
      }

      return res.json({
        success: true,
        volunteer: {
          id: updated.id,
          name: [updated.first_name, updated.last_name].filter(Boolean).join(' ') || updated.organization_name || 'Unknown',
          email: updated.primary_email,
          phone: updated.primary_phone,
          organization: updated.organization_name,
          type: updated.type === 'Organization' ? 'organization' : 'individual',
          notes: updated.notes,
          roles: updated.roles || [],
          created_at: updated.created_at,
          _source: 'supabase',
        },
      });
    }

    // Fall back to mock volunteers
    const volunteer = mockVolunteers.find(v => v.id === id);
    if (!volunteer) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }

    if (notes !== undefined) volunteer.notes = notes;
    if (name !== undefined) volunteer.name = name;
    if (email !== undefined) volunteer.email = email;
    if (phone !== undefined) volunteer.phone = phone;
    if (organization !== undefined) volunteer.organization = organization;

    res.json({ success: true, volunteer });
  } catch (error) {
    console.error('Error updating volunteer:', error);
    res.status(500).json({ error: 'Failed to update volunteer' });
  }
});

// Get dashboard stats
app.get('/api/admin/stats', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    // Count real people from Supabase + mock fallback
    let totalVolunteers = mockVolunteers.length;
    if (supabase) {
      try {
        const { count, error } = await supabase
          .from('people')
          .select('*', { count: 'exact', head: true });
        if (!error && count !== null) {
          totalVolunteers = count + mockVolunteers.length;
        }
      } catch (err) {
        console.error('Supabase people count error:', err.message);
      }
    }

    let totalEvents = mockEvents.length;
    let completedEvents = mockEvents.filter(e => e.status === 'completed').length;
    let pendingEvents = mockEvents.filter(e => e.status === 'pending').length;
    let approvedEvents = mockEvents.filter(e => e.status === 'approved').length;

    // Events this month (using created_at as proxy)
    let eventsThisMonth = mockEvents.filter(e => {
      const eventDate = new Date(e.created_at);
      return eventDate.getMonth() === thisMonth && eventDate.getFullYear() === thisYear;
    }).length;

    // Total volunteer hours (estimated: 2 hours per completed event * group size avg)
    let totalVolunteerHours = mockEvents
      .filter(e => e.status === 'completed')
      .reduce((sum, e) => sum + (e.group_size * 2), 0);

    // Include Supabase connection_nights + supply_drives in event counts
    if (supabase) {
      try {
        const { data: cnData, error: cnError } = await supabase
          .from('connection_nights')
          .select('status, group_size, created_at');
        if (!cnError && cnData) {
          totalEvents += cnData.length;
          completedEvents += cnData.filter(e => e.status === 'completed').length;
          pendingEvents += cnData.filter(e => e.status === 'pending').length;
          approvedEvents += cnData.filter(e => e.status === 'approved').length;
          eventsThisMonth += cnData.filter(e => {
            const d = new Date(e.created_at);
            return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
          }).length;
          totalVolunteerHours += cnData
            .filter(e => e.status === 'completed')
            .reduce((sum, e) => sum + ((e.group_size || 5) * 2), 0);
        }
      } catch (err) {
        console.error('Supabase connection_nights stats error:', err.message);
      }

      try {
        const { data: sdData, error: sdError } = await supabase
          .from('supply_drives')
          .select('status, created_at');
        if (!sdError && sdData) {
          totalEvents += sdData.length;
          completedEvents += sdData.filter(e => e.status === 'completed').length;
          pendingEvents += sdData.filter(e => e.status === 'pending').length;
          approvedEvents += sdData.filter(e => e.status === 'approved').length;
          eventsThisMonth += sdData.filter(e => {
            const d = new Date(e.created_at);
            return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
          }).length;
        }
      } catch (err) {
        console.error('Supabase supply_drives stats error:', err.message);
      }
    }

    // Total residents served (estimated: 15 residents per event)
    const residentsServed = completedEvents * 15;

    // Donation stats: combine Supabase + mock
    let totalDonations = mockDonations.length;
    let totalAmountRaised = mockDonations.reduce((sum, d) => sum + d.amount, 0);

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('donations')
          .select('amount');

        if (!error && data) {
          totalDonations += data.length;
          totalAmountRaised += data.reduce((sum, d) => sum + parseFloat(d.amount), 0);
        }
      } catch (err) {
        console.error('Supabase stats error:', err.message);
      }
    }

    res.json({
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
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get all donations
app.get('/api/admin/donations', authMiddleware, async (req, res) => {
  try {
    let supabaseDonations = [];
    if (supabase) {
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase donations query failed:', error.message);
      } else {
        supabaseDonations = (data || []).map(d => ({
          ...d,
          payment_intent_id: d.stripe_payment_intent_id,
          amount: parseFloat(d.amount),
          person_id: d.person_id || null,
        }));
      }
    }

    const allDonations = [...supabaseDonations, ...mockDonations.map(d => ({ ...d, _test: true }))];
    const sorted = allDonations.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    res.json({ donations: sorted });
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
});

// Get single donation with linked volunteer info
app.get('/api/admin/donations/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    // Try Supabase first
    if (supabase) {
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        const donation = {
          ...data,
          payment_intent_id: data.stripe_payment_intent_id,
          amount: parseFloat(data.amount),
        };
        return res.json({ donation: { ...donation, volunteer: null } });
      }
    }

    // Fall back to mock
    const donation = mockDonations.find(d => d.id === id);
    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    let volunteer = null;
    if (donation.volunteer_id) {
      volunteer = mockVolunteers.find(v => v.id === donation.volunteer_id) || null;
    }

    res.json({
      donation: {
        ...donation,
        volunteer,
      },
    });
  } catch (error) {
    console.error('Error fetching donation:', error);
    res.status(500).json({ error: 'Failed to fetch donation' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║     SupportWorks Housing Admin Server              ║
╠════════════════════════════════════════════════════╣
║  Local API: http://localhost:${PORT}                  ║
║  Password:  ${ADMIN_PASSWORD}                             ║
╚════════════════════════════════════════════════════╝
  `);
});
