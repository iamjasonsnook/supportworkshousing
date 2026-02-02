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
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 3001;

// Simple admin password - in production use environment variable
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'swh2024';
const SESSION_TOKEN = 'admin-session-token-' + Date.now();

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
  },
];

const mockEvents = [
  // ========== HISTORICAL EVENTS (Completed) ==========
  // September 2025
  { id: 'h1', volunteer_id: 'v7', group_name: "St. Mary's Catholic Church", location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, September 9', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Maria Santos', contact_email: 'msantos@stmarysrva.org', contact_phone: '(804) 555-5678', group_size: 16, food_plan: 'bring', activity_plan: 'Bingo', status: 'completed', created_at: '2025-08-25T10:00:00Z', completed_at: '2025-09-09T20:00:00Z' },
  { id: 'h2', volunteer_id: 'v8', group_name: 'Capital One Cares Team', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, September 11', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Jennifer Lee', contact_email: 'jennifer.lee@capitalone.com', contact_phone: '(804) 555-6789', group_size: 22, food_plan: 'cater', activity_plan: 'Board games', status: 'completed', created_at: '2025-08-28T14:00:00Z', completed_at: '2025-09-11T20:00:00Z' },
  { id: 'h3', volunteer_id: 'v17', group_name: 'James Wilson (Individual)', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, September 16', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'James Wilson', contact_email: 'jwilson.volunteer@yahoo.com', contact_phone: '(804) 555-5678', group_size: 1, food_plan: 'bring', activity_plan: 'Conversation & Games', status: 'completed', created_at: '2025-09-01T09:00:00Z', completed_at: '2025-09-16T20:00:00Z' },
  { id: 'h4', volunteer_id: 'v15', group_name: 'Dominion Energy Volunteers', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Wednesday, September 17', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Michael Brown', contact_email: 'mbrown@dominionenergy.com', contact_phone: '(804) 555-3456', group_size: 28, food_plan: 'cater', activity_plan: 'Board games', status: 'completed', created_at: '2025-09-03T11:00:00Z', completed_at: '2025-09-17T20:00:00Z' },
  { id: 'h5', volunteer_id: 'v2', group_name: 'VCU Student Volunteers', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, September 25', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Mike Chen', contact_email: 'mchen@vcu.edu', contact_phone: '(804) 555-5678', group_size: 10, food_plan: 'bring', activity_plan: 'Trivia', status: 'completed', created_at: '2025-09-10T14:00:00Z', completed_at: '2025-09-25T20:00:00Z' },

  // October 2025
  { id: 'h6', volunteer_id: 'v10', group_name: "Midlothian Women's Club", location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, October 7', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Nancy White', contact_email: 'nwhite@midlothianwc.org', contact_phone: '(804) 555-8901', group_size: 12, food_plan: 'bring', activity_plan: 'Crafts', status: 'completed', created_at: '2025-09-22T10:00:00Z', completed_at: '2025-10-07T20:00:00Z' },
  { id: 'h7', volunteer_id: 'v4', group_name: 'First Baptist Youth Group', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, October 9', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Pastor James Miller', contact_email: 'jmiller@firstbaptist.org', contact_phone: '(804) 555-2345', group_size: 18, food_plan: 'bring', activity_plan: 'Games & Fellowship', status: 'completed', created_at: '2025-09-25T11:00:00Z', completed_at: '2025-10-09T20:00:00Z' },
  { id: 'h8', volunteer_id: 'v18', group_name: 'Amanda Foster (Individual)', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, October 14', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Amanda Foster', contact_email: 'afoster@outlook.com', contact_phone: '(804) 555-6789', group_size: 1, food_plan: 'bring', activity_plan: 'Conversation', status: 'completed', created_at: '2025-10-01T09:00:00Z', completed_at: '2025-10-14T20:00:00Z' },
  { id: 'h9', volunteer_id: 'v1', group_name: 'Grace Community Church', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Wednesday, October 15', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Sarah Johnson', contact_email: 'sarah@gracecc.org', contact_phone: '(804) 555-1234', group_size: 14, food_plan: 'bring', activity_plan: 'Board games', status: 'completed', created_at: '2025-10-02T10:00:00Z', completed_at: '2025-10-15T20:00:00Z' },
  { id: 'h10', volunteer_id: 'v13', group_name: 'Carillon Civic Association', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, October 23', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Robert Davis', contact_email: 'rdavis@carilloncivic.org', contact_phone: '(804) 555-1234', group_size: 20, food_plan: 'bring', activity_plan: 'Halloween Party', status: 'completed', created_at: '2025-10-08T14:00:00Z', completed_at: '2025-10-23T20:00:00Z' },
  { id: 'h11', volunteer_id: 'v16', group_name: 'Rachel Kim (Individual)', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, October 28', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Rachel Kim', contact_email: 'rachel.kim@gmail.com', contact_phone: '(804) 555-4567', group_size: 1, food_plan: 'bring', activity_plan: 'Crafts', status: 'completed', created_at: '2025-10-15T11:00:00Z', completed_at: '2025-10-28T20:00:00Z' },

  // November 2025
  { id: 'h12', volunteer_id: 'v3', group_name: 'Richmond Rotary Club', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, November 4', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'David Williams', contact_email: 'david@richmondrotary.org', contact_phone: '(804) 555-9012', group_size: 15, food_plan: 'bring', activity_plan: 'Bingo', status: 'completed', created_at: '2025-10-20T10:00:00Z', completed_at: '2025-11-04T20:00:00Z' },
  { id: 'h13', volunteer_id: 'v6', group_name: 'River City Running Club', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, November 6', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Tom Anderson', contact_email: 'tom@rivercityrunners.com', contact_phone: '(804) 555-4567', group_size: 12, food_plan: 'bring', activity_plan: 'Trivia', status: 'completed', created_at: '2025-10-22T09:00:00Z', completed_at: '2025-11-06T20:00:00Z' },
  { id: 'h14', volunteer_id: 'v7', group_name: "St. Mary's Catholic Church", location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, November 11', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Maria Santos', contact_email: 'msantos@stmarysrva.org', contact_phone: '(804) 555-5678', group_size: 20, food_plan: 'bring', activity_plan: 'Veterans Day Celebration', status: 'completed', created_at: '2025-10-28T11:00:00Z', completed_at: '2025-11-11T20:00:00Z' },
  { id: 'h15', volunteer_id: 'v8', group_name: 'Capital One Cares Team', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Wednesday, November 19', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Jennifer Lee', contact_email: 'jennifer.lee@capitalone.com', contact_phone: '(804) 555-6789', group_size: 25, food_plan: 'cater', activity_plan: 'Thanksgiving Dinner', status: 'completed', created_at: '2025-11-05T14:00:00Z', completed_at: '2025-11-19T20:00:00Z' },

  // December 2025
  { id: 'h16', volunteer_id: 'v15', group_name: 'Dominion Energy Volunteers', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, December 2', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Michael Brown', contact_email: 'mbrown@dominionenergy.com', contact_phone: '(804) 555-3456', group_size: 30, food_plan: 'cater', activity_plan: 'Holiday Party', status: 'completed', created_at: '2025-11-18T10:00:00Z', completed_at: '2025-12-02T20:00:00Z' },
  { id: 'h17', volunteer_id: 'v11', group_name: 'Richmond Tech Meetup', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, December 4', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Alex Kumar', contact_email: 'alex@rvatechmeetup.com', contact_phone: '(804) 555-9012', group_size: 14, food_plan: 'cater', activity_plan: 'Board games', status: 'completed', created_at: '2025-11-20T09:00:00Z', completed_at: '2025-12-04T20:00:00Z' },
  { id: 'h18', volunteer_id: 'v4', group_name: 'First Baptist Youth Group', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, December 9', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Pastor James Miller', contact_email: 'jmiller@firstbaptist.org', contact_phone: '(804) 555-2345', group_size: 22, food_plan: 'bring', activity_plan: 'Christmas Caroling', status: 'completed', created_at: '2025-11-25T11:00:00Z', completed_at: '2025-12-09T20:00:00Z' },
  { id: 'h19', volunteer_id: 'v10', group_name: "Midlothian Women's Club", location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Wednesday, December 10', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Nancy White', contact_email: 'nwhite@midlothianwc.org', contact_phone: '(804) 555-8901', group_size: 15, food_plan: 'bring', activity_plan: 'Holiday Crafts', status: 'completed', created_at: '2025-11-26T10:00:00Z', completed_at: '2025-12-10T20:00:00Z' },
  { id: 'h20', volunteer_id: 'v17', group_name: 'James Wilson (Individual)', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, December 18', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'James Wilson', contact_email: 'jwilson.volunteer@yahoo.com', contact_phone: '(804) 555-5678', group_size: 1, food_plan: 'bring', activity_plan: 'Holiday Stories', status: 'completed', created_at: '2025-12-05T09:00:00Z', completed_at: '2025-12-18T20:00:00Z' },

  // January 2026
  { id: 'h21', volunteer_id: 'v1', group_name: 'Grace Community Church', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, January 7', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Sarah Johnson', contact_email: 'sarah@gracecc.org', contact_phone: '(804) 555-1234', group_size: 12, food_plan: 'bring', activity_plan: 'Board games', status: 'completed', created_at: '2025-12-23T10:00:00Z', completed_at: '2026-01-07T20:00:00Z' },
  { id: 'h22', volunteer_id: 'v9', group_name: 'UVA Alumni Chapter', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, January 9', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Brian Thompson', contact_email: 'bthompson@uvaalumni.org', contact_phone: '(804) 555-7890', group_size: 10, food_plan: 'bring', activity_plan: 'Trivia Night', status: 'completed', created_at: '2025-12-26T14:00:00Z', completed_at: '2026-01-09T20:00:00Z' },
  { id: 'h23', volunteer_id: 'v18', group_name: 'Amanda Foster (Individual)', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, January 14', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Amanda Foster', contact_email: 'afoster@outlook.com', contact_phone: '(804) 555-6789', group_size: 1, food_plan: 'bring', activity_plan: 'Conversation', status: 'completed', created_at: '2026-01-02T09:00:00Z', completed_at: '2026-01-14T20:00:00Z' },
  { id: 'h24', volunteer_id: 'v14', group_name: 'Short Pump Rotaract', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Wednesday, January 15', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Emily Chen', contact_email: 'echen@shortpumprotaract.org', contact_phone: '(804) 555-2345', group_size: 16, food_plan: 'cater', activity_plan: 'Game Night', status: 'completed', created_at: '2026-01-03T11:00:00Z', completed_at: '2026-01-15T20:00:00Z' },
  { id: 'h25', volunteer_id: 'v12', group_name: 'Bon Air Garden Club', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, January 23', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Patricia Green', contact_email: 'pgreen@bonairgardens.org', contact_phone: '(804) 555-0123', group_size: 8, food_plan: 'bring', activity_plan: 'Flower Arranging', status: 'completed', created_at: '2026-01-10T10:00:00Z', completed_at: '2026-01-23T20:00:00Z' },
  { id: 'h26', volunteer_id: 'v16', group_name: 'Rachel Kim (Individual)', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, January 28', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Rachel Kim', contact_email: 'rachel.kim@gmail.com', contact_phone: '(804) 555-4567', group_size: 1, food_plan: 'bring', activity_plan: 'Crafts', status: 'completed', created_at: '2026-01-15T11:00:00Z', completed_at: '2026-01-28T20:00:00Z' },

  // ========== UPCOMING/CURRENT EVENTS ==========
  // February 2026
  { id: '1', volunteer_id: 'v1', group_name: 'Grace Community Church', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, February 11', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Sarah Johnson', contact_email: 'sarah@gracecc.org', contact_phone: '(804) 555-1234', group_size: 12, food_plan: 'bring', activity_plan: 'Board games', status: 'pending', created_at: '2026-01-28T10:00:00Z' },
  { id: '2', volunteer_id: 'v2', group_name: 'VCU Student Volunteers', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, February 13', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Mike Chen', contact_email: 'mchen@vcu.edu', contact_phone: '(804) 555-5678', group_size: 8, food_plan: 'cater', activity_plan: 'Trivia', status: 'approved', created_at: '2026-01-27T14:00:00Z' },
  { id: '3', volunteer_id: 'v3', group_name: 'Richmond Rotary Club', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Wednesday, February 19', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'David Williams', contact_email: 'david@richmondrotary.org', contact_phone: '(804) 555-9012', group_size: 15, food_plan: 'bring', activity_plan: 'Bingo', status: 'denied', denial_reason: 'Date conflict with property maintenance', created_at: '2026-01-26T10:00:00Z' },
  { id: '4', volunteer_id: 'v4', group_name: 'First Baptist Youth Group', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, February 18', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Pastor James Miller', contact_email: 'jmiller@firstbaptist.org', contact_phone: '(804) 555-2345', group_size: 20, food_plan: 'bring', activity_plan: 'Crafts', status: 'approved', created_at: '2026-01-25T11:00:00Z' },
  { id: '5', volunteer_id: 'v5', group_name: 'Henrico High School Key Club', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, February 20', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Lisa Martinez', contact_email: 'lmartinez@henrico.k12.va.us', contact_phone: '(804) 555-3456', group_size: 15, food_plan: 'cater', activity_plan: 'Board games', status: 'pending', created_at: '2026-01-24T16:00:00Z' },
  { id: '6', volunteer_id: 'v6', group_name: 'River City Running Club', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Wednesday, February 26', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Tom Anderson', contact_email: 'tom@rivercityrunners.com', contact_phone: '(804) 555-4567', group_size: 10, food_plan: 'bring', activity_plan: 'Trivia', status: 'approved', created_at: '2026-01-23T09:00:00Z' },
  { id: '7', volunteer_id: 'v7', group_name: "St. Mary's Catholic Church", location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, February 25', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Maria Santos', contact_email: 'msantos@stmarysrva.org', contact_phone: '(804) 555-5678', group_size: 18, food_plan: 'bring', activity_plan: 'Bingo', status: 'pending', created_at: '2026-01-22T11:00:00Z' },

  // March 2026
  { id: '8', volunteer_id: 'v8', group_name: 'Capital One Cares Team', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, March 6', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Jennifer Lee', contact_email: 'jennifer.lee@capitalone.com', contact_phone: '(804) 555-6789', group_size: 25, food_plan: 'cater', activity_plan: 'Board games', status: 'approved', created_at: '2026-01-21T14:00:00Z' },
  { id: '9', volunteer_id: 'v9', group_name: 'UVA Alumni Chapter', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, March 4', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Brian Thompson', contact_email: 'bthompson@uvaalumni.org', contact_phone: '(804) 555-7890', group_size: 12, food_plan: 'bring', activity_plan: 'Trivia', status: 'pending', created_at: '2026-01-20T14:00:00Z' },
  { id: '10', volunteer_id: 'v10', group_name: "Midlothian Women's Club", location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Wednesday, March 5', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Nancy White', contact_email: 'nwhite@midlothianwc.org', contact_phone: '(804) 555-8901', group_size: 14, food_plan: 'bring', activity_plan: 'Crafts', status: 'approved', created_at: '2026-01-19T10:00:00Z' },
  { id: '11', volunteer_id: 'v11', group_name: 'Richmond Tech Meetup', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, March 13', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Alex Kumar', contact_email: 'alex@rvatechmeetup.com', contact_phone: '(804) 555-9012', group_size: 16, food_plan: 'cater', activity_plan: 'Board games', status: 'pending', created_at: '2026-01-18T10:00:00Z' },
  { id: '12', volunteer_id: 'v12', group_name: 'Bon Air Garden Club', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, March 11', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Patricia Green', contact_email: 'pgreen@bonairgardens.org', contact_phone: '(804) 555-0123', group_size: 10, food_plan: 'bring', activity_plan: 'Bingo', status: 'denied', denial_reason: 'Group size too small for requested date', created_at: '2026-01-17T10:00:00Z' },
  { id: '13', volunteer_id: 'v13', group_name: 'Carillon Civic Association', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Wednesday, March 12', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Robert Davis', contact_email: 'rdavis@carilloncivic.org', contact_phone: '(804) 555-1234', group_size: 22, food_plan: 'bring', activity_plan: 'Trivia', status: 'approved', created_at: '2026-01-16T14:00:00Z' },
  { id: '14', volunteer_id: 'v14', group_name: 'Short Pump Rotaract', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Tuesday, March 18', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Emily Chen', contact_email: 'echen@shortpumprotaract.org', contact_phone: '(804) 555-2345', group_size: 18, food_plan: 'cater', activity_plan: 'Crafts', status: 'pending', created_at: '2026-01-15T11:00:00Z' },
  { id: '15', volunteer_id: 'v15', group_name: 'Dominion Energy Volunteers', location_name: 'New Clay House', location_address: '707 N Harrison St, Richmond, VA 23220', time_slot_day: 'Thursday, March 20', time_slot_time: '6:00 PM - 8:00 PM', contact_name: 'Michael Brown', contact_email: 'mbrown@dominionenergy.com', contact_phone: '(804) 555-3456', group_size: 30, food_plan: 'cater', activity_plan: 'Board games', status: 'approved', created_at: '2026-01-14T09:00:00Z' },
];

// Auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !token.startsWith('admin-session-token-')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Public endpoint - get booked dates (no auth required)
// Returns dates that have pending or approved events
app.get('/api/booked-dates', (req, res) => {
  try {
    const bookedDates = mockEvents
      .filter(e => e.status === 'pending' || e.status === 'approved')
      .map(e => e.time_slot_day);

    res.json({ bookedDates });
  } catch (error) {
    console.error('Error fetching booked dates:', error);
    res.status(500).json({ error: 'Failed to fetch booked dates' });
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

// Get events
app.get('/api/admin/events', authMiddleware, async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('connection_nights')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json({ events: data || [] });
    } else {
      // Return mock data
      res.json({ events: mockEvents });
    }
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

      // TODO: Send approval email via Resend

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

      // TODO: Send denial email via Resend

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

// Get all volunteers
app.get('/api/admin/volunteers', authMiddleware, async (req, res) => {
  try {
    // Enrich volunteers with event counts
    const enrichedVolunteers = mockVolunteers.map(volunteer => {
      const volunteerEvents = mockEvents.filter(e => e.volunteer_id === volunteer.id);
      const completedEvents = volunteerEvents.filter(e => e.status === 'completed');
      const upcomingEvents = volunteerEvents.filter(e => ['pending', 'approved'].includes(e.status));

      return {
        ...volunteer,
        total_events: volunteerEvents.length,
        completed_events: completedEvents.length,
        upcoming_events: upcomingEvents.length,
        last_event: completedEvents.length > 0
          ? completedEvents.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0]
          : null,
        next_event: upcomingEvents.length > 0
          ? upcomingEvents.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0]
          : null,
      };
    });

    res.json({ volunteers: enrichedVolunteers });
  } catch (error) {
    console.error('Error fetching volunteers:', error);
    res.status(500).json({ error: 'Failed to fetch volunteers' });
  }
});

// Get single volunteer with full event history
app.get('/api/admin/volunteers/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const volunteer = mockVolunteers.find(v => v.id === id);
    if (!volunteer) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }

    const volunteerEvents = mockEvents
      .filter(e => e.volunteer_id === id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      volunteer: {
        ...volunteer,
        events: volunteerEvents,
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
    const volunteer = mockVolunteers.find(v => v.id === id);
    if (!volunteer) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }

    // Update fields if provided
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

    const totalVolunteers = mockVolunteers.length;
    const totalEvents = mockEvents.length;
    const completedEvents = mockEvents.filter(e => e.status === 'completed').length;
    const pendingEvents = mockEvents.filter(e => e.status === 'pending').length;
    const approvedEvents = mockEvents.filter(e => e.status === 'approved').length;

    // Events this month (using created_at as proxy)
    const eventsThisMonth = mockEvents.filter(e => {
      const eventDate = new Date(e.created_at);
      return eventDate.getMonth() === thisMonth && eventDate.getFullYear() === thisYear;
    }).length;

    // Total volunteer hours (estimated: 2 hours per completed event * group size avg)
    const totalVolunteerHours = mockEvents
      .filter(e => e.status === 'completed')
      .reduce((sum, e) => sum + (e.group_size * 2), 0);

    // Total residents served (estimated: 15 residents per event)
    const residentsServed = completedEvents * 15;

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
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
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
