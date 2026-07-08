// API endpoint used by the scheduled careers-sync agent to email a summary
// after checking iSolved for job listing changes. Sends via the site's
// existing EmailJS integration — the caller never sees EMAILJS_PRIVATE_KEY.
import crypto from 'crypto';
import { sendEmail } from './_email.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'jsnook@supportworkshousing.org';

function isAuthorized(req) {
  const secret = process.env.CAREERS_SYNC_SECRET;
  if (!secret) return false;

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  const tokenBuf = Buffer.from(token);
  const secretBuf = Buffer.from(secret);
  if (tokenBuf.length !== secretBuf.length) {
    crypto.timingSafeEqual(secretBuf, secretBuf); // constant-time even on length mismatch
    return false;
  }
  return crypto.timingSafeEqual(tokenBuf, secretBuf);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });

  const { subject, html } = req.body || {};
  if (!subject || !html) return res.status(400).json({ error: 'Missing subject or html' });

  try {
    await sendEmail({ to: ADMIN_EMAIL, subject, html });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Careers sync notification error:', error);
    return res.status(500).json({ error: error.message });
  }
}
