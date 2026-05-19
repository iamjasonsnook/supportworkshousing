/**
 * Production Admin API — Vercel Serverless Catch-All
 *
 * Handles all /api/admin/* routes with HMAC-SHA256 token auth.
 *
 * Environment variables required:
 *   ADMIN_PASSWORD     — strong admin password
 *   ADMIN_TOKEN_SECRET — random 64-char hex string for HMAC signing
 */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from '../_cors.js';
import { sendEmail } from '../_email.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'jsnook@supportworkshousing.org';

// ─── Supabase helper ────────────────────────────────────────────────────────

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

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

// ─── GA4 helpers ─────────────────────────────────────────────────────────────

let ga4TokenCache = null;

async function getGa4AccessToken() {
  if (ga4TokenCache && ga4TokenCache.expiresAt > Date.now() + 60_000) {
    return ga4TokenCache.token;
  }

  const email = process.env.GA4_SERVICE_ACCOUNT_EMAIL;
  const privateKey = (process.env.GA4_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!email || !privateKey) return null;

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };
  const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const headerPayload = `${encode(header)}.${encode(payload)}`;

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(headerPayload);
  const signature = sign.sign(privateKey, 'base64url');
  const jwt = `${headerPayload}.${signature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) return null;
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) return null;

  ga4TokenCache = {
    token: tokenData.access_token,
    expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
  };
  return ga4TokenCache.token;
}

async function runGa4EventReport(accessToken, propertyId, startDate, endDate, eventNames) {
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: { fieldName: 'eventName', inListFilter: { values: eventNames } },
      },
    }),
  });
  if (!res.ok) return null;
  return res.json();
}

async function runGa4MetricsReport(accessToken, propertyId, startDate, endDate) {
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }],
    }),
  });
  if (!res.ok) return null;
  return res.json();
}

async function runGa4DailyReport(accessToken, propertyId, startDate, endDate) {
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    }),
  });
  if (!res.ok) return null;
  return res.json();
}

async function handleGa4Report(req, res) {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const email = process.env.GA4_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GA4_PRIVATE_KEY;

  if (!propertyId || !email || !privateKey) {
    return res.status(200).json({
      configured: false,
      message: 'GA4 not configured. Add GA4_PROPERTY_ID, GA4_SERVICE_ACCOUNT_EMAIL, and GA4_PRIVATE_KEY to your environment variables.',
    });
  }

  const rangeParam = (req.url || '').match(/[?&]range=(\d+)/)?.[1];
  const range = parseInt(rangeParam) || 30;
  const endDate = 'today';
  const startDate = `${range}daysAgo`;

  let accessToken;
  try {
    accessToken = await getGa4AccessToken();
  } catch (err) {
    console.error('GA4 auth error:', err.message);
    return res.status(200).json({ configured: false, message: 'Failed to authenticate with Google.' });
  }

  if (!accessToken) {
    return res.status(200).json({ configured: false, message: 'Failed to authenticate with Google.' });
  }

  const funnelEvents = [
    'cn_form_start', 'cn_step1_complete', 'cn_step2_complete', 'cn_step3_complete', 'cn_generate_lead',
    'sd_form_start', 'sd_step1_complete', 'sd_step2_complete', 'sd_step3_complete', 'sd_generate_lead',
    'begin_checkout', 'add_payment_info', 'donation_payment_entered', 'purchase',
  ];

  const yoyStart = `${range + 365}daysAgo`;
  const yoyEnd = `365daysAgo`;

  const [funnelReport, overviewReport, trendCurrent, trendPriorYear] = await Promise.all([
    runGa4EventReport(accessToken, propertyId, startDate, endDate, funnelEvents),
    runGa4MetricsReport(accessToken, propertyId, '7daysAgo', endDate),
    runGa4DailyReport(accessToken, propertyId, startDate, endDate),
    runGa4DailyReport(accessToken, propertyId, yoyStart, yoyEnd),
  ]);

  // Build event count map
  const eventCounts = {};
  if (funnelReport?.rows) {
    for (const row of funnelReport.rows) {
      const name = row.dimensionValues[0].value;
      eventCounts[name] = parseInt(row.metricValues[0].value) || 0;
    }
  }

  // Parse overview
  const overviewRow = overviewReport?.rows?.[0];
  const overview = {
    activeUsers: parseInt(overviewRow?.metricValues?.[0]?.value) || 0,
    sessions: parseInt(overviewRow?.metricValues?.[1]?.value) || 0,
    pageViews: parseInt(overviewRow?.metricValues?.[2]?.value) || 0,
  };

  const c = (name) => eventCounts[name] || 0;

  const parseDailyRows = (report) =>
    (report?.rows || [])
      .sort((a, b) => a.dimensionValues[0].value.localeCompare(b.dimensionValues[0].value))
      .map((row) => ({ date: row.dimensionValues[0].value, value: parseInt(row.metricValues[0].value) || 0 }));

  return res.status(200).json({
    configured: true,
    range,
    overview,
    trend: {
      current: parseDailyRows(trendCurrent),
      priorYear: parseDailyRows(trendPriorYear),
    },
    funnels: {
      donations: [
        { step: 'Amount selected', event: 'begin_checkout', count: c('begin_checkout') },
        { step: 'Personal info', event: 'add_payment_info', count: c('add_payment_info') },
        { step: 'Payment entered', event: 'donation_payment_entered', count: c('donation_payment_entered') },
        { step: 'Donated', event: 'purchase', count: c('purchase') },
      ],
      connectionNights: [
        { step: 'Form started', event: 'cn_form_start', count: c('cn_form_start') },
        { step: 'Location & time', event: 'cn_step1_complete', count: c('cn_step1_complete') },
        { step: 'Group info', event: 'cn_step2_complete', count: c('cn_step2_complete') },
        { step: 'Meal & activity', event: 'cn_step3_complete', count: c('cn_step3_complete') },
        { step: 'Submitted', event: 'cn_generate_lead', count: c('cn_generate_lead') },
      ],
      supplyDrives: [
        { step: 'Form started', event: 'sd_form_start', count: c('sd_form_start') },
        { step: 'Location & date', event: 'sd_step1_complete', count: c('sd_step1_complete') },
        { step: 'Items to donate', event: 'sd_step2_complete', count: c('sd_step2_complete') },
        { step: 'Your information', event: 'sd_step3_complete', count: c('sd_step3_complete') },
        { step: 'Submitted', event: 'sd_generate_lead', count: c('sd_generate_lead') },
      ],
    },
  });
}

async function handleSendBroadcast(req, res) {
  const { subject, html, emails, bcc } = req.body || {};

  const toList = Array.isArray(emails) ? emails.map((e) => e.trim()).filter(Boolean) : [];
  const bccStr = Array.isArray(bcc) && bcc.length > 0
    ? bcc.map((e) => e.trim()).filter(Boolean).join(',')
    : '';

  if (!subject || !html || (toList.length === 0 && !bccStr)) {
    return res.status(400).json({ error: 'subject, html, and at least one recipient or BCC are required.' });
  }

  // If no To recipients, send a single self-addressed email so BCC recipients receive it
  const sendList = toList.length > 0 ? toList : [ADMIN_EMAIL];

  const results = [];
  for (const email of sendList) {
    try {
      await sendEmail({ to: email, subject, html, bcc: bccStr });
      results.push({ email, ok: true });
    } catch (err) {
      results.push({ email, ok: false, error: err.message });
    }
  }

  const failed = results.filter((r) => !r.ok);
  const bccCount = bccStr ? bccStr.split(',').filter(Boolean).length : 0;
  const sentCount = toList.length > 0 ? results.length - failed.length : 0;
  return res.status(200).json({ sent: sentCount, failed: failed.length, bccCount, results });
}

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

async function handleGetEvents(req, res) {
  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  // Fetch real data from Supabase
  let supabaseEvents = [];
  let supabaseSupplyDrives = [];
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
      supabaseSupplyDrives = sdData.map(e => ({ ...e, event_type: 'supply-drive', items: e.selected_items }));
    }
  } catch (err) {
    console.error('Supabase supply_drives error:', err.message);
  }

  return res.status(200).json({ events: supabaseEvents, supplyDrives: supabaseSupplyDrives });
}

async function handleApproveEvent(req, res, id) {
  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }
  // Fetch record first so we can send confirmation email
  const { data: eventData, error: fetchError } = await supabase
    .from('connection_nights').select('*').eq('id', id).single();
  if (fetchError || !eventData) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const { error: updateError } = await supabase.from('connection_nights')
    .update({ status: 'approved', approved_by: ADMIN_EMAIL, approved_at: new Date().toISOString() })
    .eq('id', id);
  if (updateError) {
    console.error('Supabase approve error:', updateError.message);
    return res.status(500).json({ error: 'Failed to approve event' });
  }

  // Send volunteer confirmation email
  try {
    const appUrl = 'https://supportworkshousing.org';
    const locationInfo = `${eventData.location_name} - ${eventData.location_address}`;
    const timeInfo = `${eventData.time_slot_day}, ${eventData.time_slot_time}`;
    await sendEmail({
      to: eventData.contact_email,
      subject: 'Your Community Connection is Confirmed! - SupportWorks Housing',
      html: `<!DOCTYPE html><html><head><style>
        body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #4A4A4A; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #9B1B5D; color: white; padding: 24px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header img { display: block; margin: 0 auto 12px; height: 40px; width: auto; }
        .header h1 { margin: 0; font-size: 22px; }
        .content { background-color: #FFFFFF; padding: 30px; border: 1px solid #E5E7EB; border-top: none; }
        .success-box { background-color: #D1FAE5; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .info-row { margin: 10px 0; }
        .info-label { font-weight: 600; color: #1A1A1A; }
        .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 13px; }
      </style></head><body>
      <div class="container">
        <div class="header">
          <img src="https://supportworkshousing.org/images/logo-white.png" alt="SupportWorks Housing" style="display: block; margin: 0 auto 12px; height: 40px; width: auto;" />
          <h1>Your Community Connection is Confirmed!</h1>
        </div>
        <div class="content">
          <p>Dear ${eventData.contact_name},</p>
          <div class="success-box"><p style="margin:0;"><strong>Great news!</strong> Your Community Connection has been confirmed by our team.</p></div>
          <p>We're excited to have you create meaningful connections with our residents!</p>
          <h2 style="color: #9B1B5D;">Confirmed Event Details</h2>
          <div class="info-row"><span class="info-label">Location:</span> ${eventData.location_name}</div>
          <div class="info-row"><span class="info-label">Address:</span> ${eventData.location_address}</div>
          <div class="info-row"><span class="info-label">Date & Time:</span> ${timeInfo}</div>
          <div class="info-row"><span class="info-label">Group Size:</span> ${eventData.group_size} people</div>
          <h3 style="color: #1A1A1A; margin-top: 25px;">Before the Event:</h3>
          <ul style="line-height: 2;">
            <li>The property manager has been notified and will be ready to welcome you</li>
            <li>Please arrive 15 minutes early to coordinate with property staff</li>
            <li>Bring any materials or food you planned for the event</li>
          </ul>
          <p style="margin-top: 30px;">If you have any questions, contact us at <a href="mailto:${ADMIN_EMAIL}" style="color: #9B1B5D;">${ADMIN_EMAIL}</a>.</p>
          <p><strong>Thank you for making a difference!</strong></p>
          <p>SupportWorks Housing Team</p>
        </div>
        <div class="footer"><p>SupportWorks Housing | Making Homelessness History</p></div>
      </div></body></html>`,
    });
  } catch (emailErr) {
    console.error('Confirmation email error:', emailErr.message);
  }

  return res.status(200).json({ success: true });
}

async function handleDenyEvent(req, res, id) {
  const { reason } = req.body || {};
  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }
  const { error: updateError } = await supabase.from('connection_nights')
    .update({ status: 'denied', denial_reason: reason || null, approved_by: ADMIN_EMAIL, approved_at: new Date().toISOString() })
    .eq('id', id);
  if (updateError) {
    console.error('Supabase deny error:', updateError.message);
    return res.status(500).json({ error: updateError.message });
  }
  return res.status(200).json({ success: true });
}

async function handleCompleteEvent(req, res, id) {
  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }
  const { error } = await supabase
    .from('connection_nights')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) {
    console.error('Supabase complete event error:', error.message);
    return res.status(500).json({ error: error.message });
  }
  return res.status(200).json({ success: true });
}

async function handleApproveSupplyDrive(req, res, id) {
  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }
  const { data: driveData, error: fetchError } = await supabase
    .from('supply_drives').select('*').eq('id', id).single();
  if (fetchError || !driveData) {
    return res.status(404).json({ error: 'Supply drive not found' });
  }

  const { error: updateError } = await supabase.from('supply_drives')
    .update({ status: 'approved', approved_by: ADMIN_EMAIL, approved_at: new Date().toISOString() })
    .eq('id', id);
  if (updateError) {
    console.error('Supabase approve supply drive error:', updateError.message);
    return res.status(500).json({ error: 'Failed to approve supply drive' });
  }

  // Send volunteer confirmation email
  try {
    const appUrl = 'https://supportworkshousing.org';
    await sendEmail({
      to: driveData.contact_email,
      subject: 'Your Supply Drop-Off is Confirmed! - SupportWorks Housing',
      html: `<!DOCTYPE html><html><head><style>
        body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #4A4A4A; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #9B1B5D; color: white; padding: 24px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header img { display: block; margin: 0 auto 12px; height: 40px; width: auto; }
        .header h1 { margin: 0; font-size: 22px; }
        .content { background-color: #FFFFFF; padding: 30px; border: 1px solid #E5E7EB; border-top: none; }
        .success-box { background-color: #D1FAE5; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .info-row { margin: 10px 0; }
        .info-label { font-weight: 600; color: #1A1A1A; }
        .items-list { margin: 10px 0; padding-left: 20px; }
        .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 13px; }
      </style></head><body>
      <div class="container">
        <div class="header">
          <img src="https://supportworkshousing.org/images/logo-white.png" alt="SupportWorks Housing" style="display: block; margin: 0 auto 12px; height: 40px; width: auto;" />
          <h1>Your Drop-Off is Confirmed!</h1>
        </div>
        <div class="content">
          <p>Dear ${driveData.contact_name},</p>
          <div class="success-box"><p style="margin:0;"><strong>Great news!</strong> Your supply drop-off has been confirmed by our team.</p></div>
          <p>Thank you for donating essential items to support our residents!</p>
          <h2 style="color: #9B1B5D;">Confirmed Drop-Off Details</h2>
          <div class="info-row"><span class="info-label">Location:</span> ${driveData.location_name}</div>
          <div class="info-row"><span class="info-label">Address:</span> ${driveData.location_address}</div>
          <div class="info-row"><span class="info-label">Date & Time:</span> ${driveData.drop_off_date}, ${driveData.drop_off_time}</div>
          ${driveData.selected_items && driveData.selected_items.length > 0 ? `
          <div class="info-row"><span class="info-label">Items:</span></div>
          <ul class="items-list">${driveData.selected_items.map(item => `<li>${item}</li>`).join('')}</ul>` : ''}
          <p style="margin-top: 30px;">If you need to make any changes, contact us at <a href="mailto:${ADMIN_EMAIL}" style="color: #9B1B5D;">${ADMIN_EMAIL}</a>.</p>
          <p><strong>Thank you for making a difference!</strong></p>
          <p>SupportWorks Housing Team</p>
        </div>
        <div class="footer"><p>SupportWorks Housing | Making Homelessness History</p></div>
      </div></body></html>`,
    });
  } catch (emailErr) {
    console.error('Confirmation email error:', emailErr.message);
  }

  return res.status(200).json({ success: true });
}

async function handleDenySupplyDrive(req, res, id) {
  const { reason } = req.body || {};
  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }
  const { error: updateError } = await supabase.from('supply_drives')
    .update({ status: 'denied', denial_reason: reason || null, approved_by: ADMIN_EMAIL, approved_at: new Date().toISOString() })
    .eq('id', id);
  if (updateError) {
    console.error('Supabase deny supply drive error:', updateError.message);
    return res.status(500).json({ error: updateError.message });
  }
  return res.status(200).json({ success: true });
}

async function handleCompleteSupplyDrive(req, res, id) {
  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }
  try {
    await supabase.from('supply_drives')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', id);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Supabase complete supply drive error:', err.message);
    return res.status(500).json({ error: 'Failed to complete supply drive' });
  }
}

async function handleGetVolunteers(req, res) {
  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  // Fetch donations from Supabase
  let allDonations = [];
  try {
    const { data, error } = await supabase
      .from('donations')
      .select('*');

    if (!error && data) {
      allDonations = data.map(d => ({
        ...d,
        payment_intent_id: d.stripe_payment_intent_id,
        amount: parseFloat(d.amount),
      }));
    }
  } catch (err) {
    console.error('Supabase donations error:', err.message);
  }

  // Fetch people from Supabase
  let supabasePeople = [];
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

  // Build Supabase people into the volunteer shape
  const supabaseEmails = new Set();
  const realPeople = supabasePeople.map(p => {
    if (p.primary_email) supabaseEmails.add(p.primary_email.toLowerCase());

    // Count donations by person_id or email match
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

  // Build donor-only people (donations not linked to any Supabase person)
  const donorOnlyEmails = new Set();
  const donorOnlyPeople = [];
  allDonations
    .filter(d => !d.person_id && !supabaseEmails.has((d.donor_email || '').toLowerCase()))
    .forEach(d => {
      if (!donorOnlyEmails.has(d.donor_email)) {
        donorOnlyEmails.add(d.donor_email);
        const allDonationsForDonor = allDonations.filter(
          dd => dd.donor_email === d.donor_email && !dd.person_id && !supabaseEmails.has((dd.donor_email || '').toLowerCase())
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
        });
      }
    });

  return res.status(200).json({ volunteers: [...realPeople, ...donorOnlyPeople] });
}

async function handleGetVolunteer(req, res, id) {
  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  // Fetch all donations from Supabase
  let allDonations = [];
  try {
    const { data, error } = await supabase
      .from('donations')
      .select('*');

    if (!error && data) {
      allDonations = data.map(d => ({
        ...d,
        payment_intent_id: d.stripe_payment_intent_id,
        amount: parseFloat(d.amount),
      }));
    }
  } catch (err) {
    console.error('Supabase donations error:', err.message);
  }

  // Handle donor-only people (synthetic IDs)
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
        interactions: [],
        created_at: first.created_at,
      },
    });
  }

  // Look up person in Supabase people table
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

      return res.status(200).json({
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

  return res.status(404).json({ error: 'Volunteer not found' });
}
async function handleUpdateVolunteer(req, res, id) {
  const { notes, name, email, phone, organization } = req.body || {};

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  // Update person in Supabase people table
  if (!id.startsWith('donor-')) {
    try {
      // Build update object
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

      return res.status(200).json({
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
    } catch (err) {
      console.error('Supabase update error:', err.message);
      return res.status(500).json({ error: 'Failed to update volunteer' });
    }
  }

  return res.status(404).json({ error: 'Volunteer not found' });
}

async function handleGetStats(req, res) {
  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  // Count people from Supabase
  let totalVolunteers = 0;
  try {
    const { count, error } = await supabase
      .from('people')
      .select('*', { count: 'exact', head: true });
    if (!error && count !== null) {
      totalVolunteers = count;
    }
  } catch (err) {
    console.error('Supabase people count error:', err.message);
  }

  // Event stats from Supabase
  let totalEvents = 0;
  let completedEvents = 0;
  let pendingEvents = 0;
  let approvedEvents = 0;
  let eventsThisMonth = 0;
  let totalVolunteerHours = 0;

  try {
    const { data: cnStats } = await supabase
      .from('connection_nights')
      .select('status, group_size, created_at');
    if (cnStats) {
      totalEvents = cnStats.length;
      completedEvents = cnStats.filter(e => e.status === 'completed').length;
      pendingEvents = cnStats.filter(e => e.status === 'pending').length;
      approvedEvents = cnStats.filter(e => e.status === 'approved').length;
      eventsThisMonth = cnStats.filter(e => {
        const eventDate = new Date(e.created_at);
        return eventDate.getMonth() === thisMonth && eventDate.getFullYear() === thisYear;
      }).length;
      totalVolunteerHours = cnStats
        .filter(e => e.status === 'completed')
        .reduce((sum, e) => sum + (e.group_size * 2), 0);
    }
  } catch (err) {
    console.error('Supabase event stats error:', err.message);
  }

  const residentsServed = completedEvents * 15;

  // Donation stats from Supabase
  let totalDonations = 0;
  let totalAmountRaised = 0;

  try {
    const { data, error } = await supabase
      .from('donations')
      .select('amount');

    if (!error && data) {
      totalDonations = data.length;
      totalAmountRaised = data.reduce((sum, d) => sum + parseFloat(d.amount), 0);
    }
  } catch (err) {
    console.error('Supabase stats error:', err.message);
  }

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
async function handleGetDonations(req, res) {
  let supabaseDonations = [];
  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
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
  } catch (err) {
    console.error('Supabase donations error:', err.message);
  }

  const sorted = supabaseDonations.sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
  return res.status(200).json({ donations: sorted });
}

async function handleGetDonation(req, res, id) {
  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
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
      return res.status(200).json({ donation: { ...donation, volunteer: null } });
    }
  } catch (err) {
    console.error('Supabase donation lookup error:', err.message);
  }

  return res.status(404).json({ error: 'Donation not found' });
}

// ─── AI Analysis ─────────────────────────────────────────────────────────────

async function handleAiAnalysis(req, res) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Anthropic API not configured' });
  }

  const { ga4Data, range } = req.body || {};
  if (!ga4Data) {
    return res.status(400).json({ error: 'Missing analytics data' });
  }

  const formatFunnel = (steps) =>
    steps.map((s, i) => {
      const pct = steps[0].count > 0 ? Math.round((s.count / steps[0].count) * 100) : 0;
      const dropOff = i > 0 && steps[i - 1].count > 0
        ? Math.round(((steps[i - 1].count - s.count) / steps[i - 1].count) * 100)
        : null;
      return `  - ${s.step}: ${s.count}${dropOff !== null ? ` (−${dropOff}% from previous step)` : ''}`;
    }).join('\n');

  const trendCurrent = ga4Data.trend?.current || [];
  const trendPriorYear = ga4Data.trend?.priorYear || [];
  const totalCurrent = trendCurrent.reduce((sum, d) => sum + d.value, 0);
  const totalPriorYear = trendPriorYear.reduce((sum, d) => sum + d.value, 0);
  const trendPct = totalPriorYear > 0
    ? Math.round(((totalCurrent - totalPriorYear) / totalPriorYear) * 100)
    : null;

  const prompt = `You are analyzing website analytics for SupportWorks Housing, a nonprofit in Richmond, VA that helps people experiencing homelessness transition to stable housing. The website was redesigned and relaunched in Q1 2026 — year-over-year differences largely reflect the new site launch, not organic growth trends.

Data covers the last ${range} days.

TRAFFIC (7-day rolling):
- Active Users: ${ga4Data.overview.activeUsers.toLocaleString()}
- Sessions: ${ga4Data.overview.sessions.toLocaleString()}
- Page Views: ${ga4Data.overview.pageViews.toLocaleString()}
- Sessions per user: ${(ga4Data.overview.sessions / Math.max(ga4Data.overview.activeUsers, 1)).toFixed(1)}
- Pages per session: ${(ga4Data.overview.pageViews / Math.max(ga4Data.overview.sessions, 1)).toFixed(1)}
${trendPct !== null ? `- Active users vs prior year: ${trendPct >= 0 ? '+' : ''}${trendPct}% (interpret carefully due to site relaunch)` : ''}

DONATION FUNNEL:
${formatFunnel(ga4Data.funnels.donations)}

COMMUNITY CONNECTIONS FUNNEL (volunteer groups host dinners/activities with residents):
${formatFunnel(ga4Data.funnels.connectionNights)}

SUPPLY DRIVES FUNNEL (individuals/groups donate household supplies):
${formatFunnel(ga4Data.funnels.supplyDrives)}

Respond with a JSON object (no markdown, no code fences) with this exact shape:
{
  "headline": "One warm, grounded sentence summarizing where things stand — acknowledge what's working before noting what's still developing",
  "sections": [
    { "title": "Traffic & Reach", "body": "2-3 sentences on visitor numbers, engagement, and trends. Use specific numbers. Frame early-stage patterns as normal for a new site." },
    { "title": "Donations", "body": "2-3 sentences on how the donation flow is performing. Use specific numbers. Frame any drop-off as an opportunity to explore, not a problem." },
    { "title": "Volunteer Engagement", "body": "2-3 sentences covering Community Connections and Supply Drives. Use specific numbers. Note what's encouraging and what's worth keeping an eye on." },
    { "title": "One Next Step", "body": "Three specific, small, low-effort suggestions that could make a meaningful difference. Put each idea on its own line starting with a number (1. then 2. then 3.) with a line break between each." }
  ]
}

Write warmly and encouragingly, like a supportive advisor talking to a nonprofit director who cares deeply about this work. This is a new site that just launched — early patterns are completely normal. Use specific numbers but avoid alarm language. Frame everything as natural and improvable. Avoid words like 'crisis', 'badly', 'broken', 'urgent', 'immediately'. Use **bold** (markdown double asterisks) to highlight key numbers and important phrases for scannability.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', errText);
      return res.status(500).json({ error: 'Failed to generate analysis' });
    }

    const data = await response.json();
    const raw = data.content[0].text.trim();
    // Strip markdown code fences if present
    const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    try {
      const analysis = JSON.parse(text);
      return res.status(200).json({ analysis });
    } catch {
      return res.status(200).json({
        analysis: { headline: '', sections: [{ title: 'Analysis', body: text }] },
      });
    }
  } catch (err) {
    console.error('AI analysis error:', err);
    return res.status(500).json({ error: 'Failed to generate analysis' });
  }
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

  // POST /api/admin/events/:id/complete
  const eventCompleteMatch = path.match(/^events\/([^/]+)\/complete$/);
  if (method === 'POST' && eventCompleteMatch) {
    return handleCompleteEvent(req, res, eventCompleteMatch[1]);
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

  // GET /api/admin/ga4-report
  if (method === 'GET' && path.startsWith('ga4-report')) {
    return handleGa4Report(req, res);
  }

  // POST /api/admin/send-broadcast
  if (method === 'POST' && path === 'send-broadcast') {
    return handleSendBroadcast(req, res);
  }

  // POST /api/admin/ai-analysis
  if (method === 'POST' && path === 'ai-analysis') {
    return handleAiAnalysis(req, res);
  }

  // No route matched
  return res.status(404).json({ error: 'Not found' });
}
