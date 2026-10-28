import { setCorsHeaders } from './_cors.js';
import { sendEmail } from './_email.js';
import { checkRateLimit } from './_rateLimit.js';
import Stripe from 'stripe';
import { findOrCreateConstituent, createPledge } from './_bloomerang.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'jsnook@supportworkshousing.org';
const ACCOUNTING_EMAIL = 'accountsreceivable@supportworkshousing.org';

const getAdminNotificationEmail = (data) => {
  const donationTypeText = data.donationType === 'monthly' ? 'Monthly' : 'One-time';
  const addressLine = data.address ? `${data.address}, ${data.city}, ${data.state} ${data.zip}` : null;

  return {
    subject: `Donation Received: $${data.amount} from ${data.firstName} ${data.lastName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; color: #4A4A4A; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #9B1B5D; color: white; padding: 24px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 22px; }
          .content { background-color: #FFFFFF; padding: 30px; border: 1px solid #E5E7EB; border-top: none; }
          .alert-box { background-color: #FDF2F4; border-left: 4px solid #9B1B5D; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .info-row { margin: 10px 0; }
          .info-label { font-weight: 600; color: #1A1A1A; display: inline-block; min-width: 140px; vertical-align: top; }
          .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://supportworkshousing.org/images/logo-white.png" alt="SupportWorks Housing" style="display: block; margin: 0 auto 12px; height: 40px; width: auto;" />
            <h1>Donation Received</h1>
          </div>
          <div class="content">
            <div class="alert-box">
              A new donation has been processed through Stripe on the SupportWorks Housing website.
            </div>

            <h2 style="color: #9B1B5D; margin-top: 30px;">Donation Details</h2>
            <div class="info-row"><span class="info-label">Amount:</span> <strong>$${data.amount}</strong> (${donationTypeText})</div>
            ${data.coverFees && data.feeAmount ? `<div class="info-row"><span class="info-label">Covers fees:</span> Yes, $${data.feeAmount} of this was added by the donor to cover processing fees (gift $${data.giftAmount})</div>` : ''}
            <div class="info-row"><span class="info-label">Card:</span> •••• •••• •••• ${data.cardLast4} (${data.cardBrand})</div>
            <div class="info-row"><span class="info-label">Transaction ID:</span> ${data.transactionId}</div>

            <h2 style="color: #9B1B5D; margin-top: 30px;">Donor Information</h2>
            <div class="info-row"><span class="info-label">Name:</span> ${data.firstName} ${data.lastName}</div>
            <div class="info-row"><span class="info-label">Email:</span> <a href="mailto:${data.email}" style="color: #9B1B5D;">${data.email}</a></div>
            ${data.phone ? `<div class="info-row"><span class="info-label">Phone:</span> ${data.phone}</div>` : ''}
            ${addressLine ? `<div class="info-row"><span class="info-label">Address:</span> ${addressLine}</div>` : ''}
          </div>
          <div class="footer">
            <p>SupportWorks Housing | Making Homelessness History</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

const getAccountingNotificationEmail = (data) => {
  const donationTypeText = data.donationType === 'monthly' ? 'Monthly' : 'One-time';
  const grossAmount = Number(data.amount);
  const stripeFee = (grossAmount * 0.022) + 0.30;
  const expectedPayout = (grossAmount - stripeFee).toFixed(2);

  return {
    subject: `Donation Payout: $${expectedPayout} expected from $${data.amount} donation`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; color: #4A4A4A; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #9B1B5D; color: white; padding: 24px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 22px; }
          .content { background-color: #FFFFFF; padding: 30px; border: 1px solid #E5E7EB; border-top: none; }
          .info-row { margin: 10px 0; }
          .info-label { font-weight: 600; color: #1A1A1A; display: inline-block; min-width: 160px; vertical-align: top; }
          .payout-box { background-color: #F0FDF4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://supportworkshousing.org/images/logo-white.png" alt="SupportWorks Housing" style="display: block; margin: 0 auto 12px; height: 40px; width: auto;" />
            <h1>Donation Payout Notification</h1>
          </div>
          <div class="content">
            <p>A new donation has been processed. Below are the details and expected payout to the operating account.</p>

            <h2 style="color: #9B1B5D; margin-top: 30px;">Payout Summary</h2>
            <div class="info-row"><span class="info-label">Donor:</span> ${data.firstName} ${data.lastName}</div>
            <div class="info-row"><span class="info-label">Donation Amount:</span> <strong>$${data.amount}</strong> (${donationTypeText})</div>
            <div class="info-row"><span class="info-label">Stripe Fee:</span> −$${stripeFee.toFixed(2)} (2.2% + $0.30)</div>

            <div class="payout-box">
              <span class="info-label">Expected Payout:</span> <strong style="color: #16a34a; font-size: 18px;">$${expectedPayout}</strong>
            </div>
          </div>
          <div class="footer">
            <p>SupportWorks Housing | Making Homelessness History</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

// ─── Stock gift pledges ──────────────────────────────────────────────────────
//
// A donor tells us about a stock transfer they are making to our Merrill
// Lynch account, so the shares can be matched to them when they arrive.
// Folded into this function rather than a new one: the Vercel plan is at its
// limit of 12 functions.

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (s, n) => String(s ?? '').trim().slice(0, n);
const isEmail = (e) => /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]+$/.test(e);

export const TRANSFER_DETAILS = [
  ['DTC number', '8862'],
  ['Firm', 'Merrill Lynch, Pierce, Fenner & Smith Incorporated'],
  ['Account name', 'SupportWorks Housing'],
  ['Account number', '758-02792'],
];

const MAX_PLEDGE = 10000000;

export function cleanStockPledge(body) {
  const value = Number(String(body.approxValue ?? '').replace(/[$,\s]/g, ''));
  const d = {
    name: clip(body.name, 120), email: clip(body.email, 254),
    approxValue: Number.isFinite(value) ? Math.round(value * 100) / 100 : NaN,
    transferDate: clip(body.transferDate, 10),
  };
  const errors = [];
  if (!d.name) errors.push('name');
  if (!isEmail(d.email)) errors.push('email');
  if (!(d.approxValue >= 1 && d.approxValue <= MAX_PLEDGE)) errors.push('approxValue');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.transferDate)) errors.push('transferDate');
  return { data: d, errors };
}

const STYLE = `body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.6;color:#4A4A4A}
.container{max-width:600px;margin:0 auto;padding:20px}
.header{background-color:#9B1B5D;color:#fff;padding:24px 20px;text-align:center;border-radius:8px 8px 0 0}
.header h1{margin:0;font-size:22px}
.content{background-color:#fff;padding:30px;border:1px solid #E5E7EB;border-top:none}
.box{background-color:#FDF2F4;border-left:4px solid #9B1B5D;padding:15px;margin:20px 0;border-radius:4px}
.info-row{margin:8px 0}.info-label{font-weight:600;color:#1A1A1A;display:inline-block;min-width:150px;vertical-align:top}
.footer{text-align:center;padding:20px;color:#6B7280;font-size:13px}`;

const shell = (title, inner) => `<!DOCTYPE html><html><head><style>${STYLE}</style></head><body><div class="container">
<div class="header"><img src="https://supportworkshousing.org/images/logo-white.png" alt="SupportWorks Housing" style="display:block;margin:0 auto 12px;height:40px;width:auto;" /><h1>${title}</h1></div>
<div class="content">${inner}</div><div class="footer"><p>SupportWorks Housing | Making Homelessness History</p></div></div></body></html>`;

const row = (label, value) => value ? `<div class="info-row"><span class="info-label">${esc(label)}:</span> ${esc(value)}</div>` : '';
const transferRows = () => TRANSFER_DETAILS.map(([k, v]) => row(k, v)).join('');
const fmtDate = (iso) => { const [y, m, dd] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, dd)).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' }); };

const usd = v => Number(v).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

// bloomerang: { ok, transactionId, matched } or { ok: false }.
export function stockPledgeStaffEmail(d, bloomerang = { ok: false }) {
  const logged = bloomerang.ok
    ? `Logged in Bloomerang as a pledge of ${usd(d.approxValue)} due ${fmtDate(d.transferDate)} (transaction ${bloomerang.transactionId}; donor ${bloomerang.matched === 'created' ? 'added as a new constituent' : `matched by ${bloomerang.matched}`}). When the shares arrive, record their value as a pledge payment against it.`
    : 'This pledge could NOT be logged in Bloomerang automatically. Please enter it by hand.';
  return {
    subject: `Stock gift pledged: about ${usd(d.approxValue)} from ${d.name}`,
    html: shell('Stock Gift Pledged', `
<div class="box">A donor has pledged a gift of stock to our Merrill Lynch account. Watch for the transfer around the date below, match it to this donor, and follow up to confirm and collect anything else we need.</div>
${row('Approximate value', usd(d.approxValue))}${row('Expected transfer', fmtDate(d.transferDate))}
${row('Name', d.name)}${row('Email', d.email)}
<p style="margin-top:20px;">${esc(logged)}</p>`),
  };
}

export function stockPledgeDonorEmail(d) {
  const first = d.name.split(/\s+/)[0];
  return {
    subject: 'Thank you for your gift of stock to SupportWorks Housing',
    html: shell('Thank You for Your Gift of Stock', `
<p>Dear ${esc(first)},</p>
<p>Thank you for your pledge of stock to SupportWorks Housing. Your generous gift will help us end homelessness in your community.</p>
${row('Approximate value', usd(d.approxValue))}${row('Expected transfer', fmtDate(d.transferDate))}
<p>The value of your gift will be the value of the shares on the day they arrive, and your receipt will show that amount. We'll be in touch to confirm your gift and collect any other information we need.</p>
<h2 style="color:#9B1B5D;margin-top:24px;">Transfer instructions for your broker</h2><div class="box">${transferRows()}</div>
<p>Please consult your tax advisor about your situation. If anything changes, just reply to this email.</p>
<p>With gratitude,<br />The SupportWorks Housing team</p>`),
  };
}

// Logs the pledge in Bloomerang. Never throws: the donor's thank-you and the
// staff notification go out regardless, and the staff email says if this failed.
export async function logPledgeInBloomerang(d) {
  const key = process.env.BLOOMERANG_API_KEY;
  if (!key) return { ok: false };
  try {
    const [firstName, ...rest] = d.name.split(/\s+/);
    const who = await findOrCreateConstituent(key, { firstName, lastName: rest.join(' '), email: d.email });
    const note = `Stock pledge via website: approximately ${usd(d.approxValue)}, transfer expected ${d.transferDate} to Merrill Lynch (DTC 8862).`;
    const { transactionId } = await createPledge(key, { accountId: who.id, amount: d.approxValue, dueDate: d.transferDate, note });
    return { ok: true, transactionId, matched: who.matched };
  } catch (error) {
    console.error('Bloomerang pledge error:', error.message);
    return { ok: false };
  }
}

// ─── Card donation thank-you ─────────────────────────────────────────────────
//
// Sent to the donor after a card donation, alongside Stripe's own receipt.
// This endpoint is public, so the request is never trusted for who to email:
// the payment is looked up in Stripe and must have succeeded recently for the
// amount claimed, and the email goes to the address Stripe holds for it.
// Monthly donors are thanked once, at sign-up (the only time the donate form
// calls this); later monthly charges do not come through here.

const DAY_MS = 24 * 60 * 60 * 1000;

export async function verifiedDonation(stripe, paymentIntentId, claimedAmount) {
  if (!/^pi_[A-Za-z0-9]+$/.test(String(paymentIntentId || ''))) return null;
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ['customer', 'payment_method'] });
  if (pi.status !== 'succeeded') return null;
  if (Date.now() - pi.created * 1000 > 2 * DAY_MS) return null;
  if (Math.round(Number(claimedAmount) * 100) !== pi.amount_received) return null;
  const customer = pi.customer && typeof pi.customer === 'object' ? pi.customer : null;
  const email = pi.metadata?.donor_email || pi.receipt_email || customer?.email || '';
  if (!email) return null;
  const name = pi.metadata?.donor_name || customer?.name || '';
  const card = pi.payment_method && typeof pi.payment_method === 'object' ? pi.payment_method.card : null;
  return {
    email,
    firstName: name.trim().split(/\s+/)[0] || '',
    amount: pi.amount_received / 100,
    monthly: (pi.metadata?.donation_type || customer?.metadata?.donation_type) === 'monthly' || (!pi.metadata?.donation_type && !!customer),
    date: new Date(pi.created * 1000),
    cardBrand: card?.brand ? card.brand.charAt(0).toUpperCase() + card.brand.slice(1) : '',
    cardLast4: card?.last4 || '',
  };
}

export function donorThankYouEmail(d) {
  const amount = d.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const date = d.date.toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'long', day: 'numeric', year: 'numeric' });
  return {
    subject: 'Thank you for your gift to SupportWorks Housing',
    html: shell('Thank You for Your Gift', `
<p>Dear ${esc(d.firstName || 'friend')},</p>
<p>Thank you for your donation. Your generous gift will help us end homelessness in your community.</p>
<p>For 37 years, SupportWorks Housing has helped older adults, veterans, and people with disabilities across Virginia find a home and keep it. Year over year, 96% or more of our residents and program participants do not return to homelessness. Gifts like yours make that possible.</p>
<div class="box">${row('Gift', d.monthly ? `${amount} per month` : amount)}${row('Date', date)}${d.cardLast4 ? row('Payment', `${d.cardBrand || 'Card'} ending in ${d.cardLast4}`) : ''}</div>
${d.monthly ? '<p>Your monthly gift will continue each month. If you ever want to change or stop it, just reply to this email.</p>' : ''}
<p style="font-size:13px;color:#6B7280;">SupportWorks Housing is a 501(c)(3) nonprofit organization, EIN 54-1444564. No goods or services were provided in exchange for this gift. Please keep this email for your tax records.</p>
<p>With gratitude,<br />The SupportWorks Housing team</p>`),
  };
}

async function handleStockPledge(req, res) {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip, 'stock-pledge', 5)) {
    return res.status(429).json({ error: 'Too many submissions today' });
  }
  const { data, errors } = cleanStockPledge(req.body || {});
  if (errors.length) return res.status(400).json({ error: `Please check: ${errors.join(', ')}` });

  // Bloomerang first, so the staff email can say whether it worked.
  const bloomerang = await logPledgeInBloomerang(data);
  const staff = stockPledgeStaffEmail(data, bloomerang);
  const donor = stockPledgeDonorEmail(data);
  try {
    await Promise.all([
      // The donor's thank-you with the transfer instructions, and the staff
      // notification to jsnook and accounting, as for card donations.
      sendEmail({ to: data.email, subject: donor.subject, html: donor.html, replyTo: ADMIN_EMAIL }),
      sendEmail({ to: ADMIN_EMAIL, subject: staff.subject, html: staff.html, replyTo: data.email }),
      sendEmail({ to: ACCOUNTING_EMAIL, subject: staff.subject, html: staff.html, replyTo: data.email }),
    ]);
  } catch (error) {
    // The cause goes to the logs, never to the donor.
    console.error('Stock pledge email error:', error);
    return res.status(502).json({ error: 'send-failed' });
  }
  return res.status(200).json({ success: true });
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const data = req.body;
    if (data && data.kind === 'stock-pledge') return await handleStockPledge(req, res);

    // Basic validation — must have required fields from a real payment
    if (!data || !data.transactionId || !data.amount || !data.firstName || !data.email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
    if (!checkRateLimit(ip, 'donation-notification', 20)) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    // Nothing is sent, to staff or donor, unless Stripe confirms the payment:
    // succeeded, recent, and for the amount claimed. The amount and donor
    // email in every message then come from Stripe, not from the request.
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return res.status(500).json({ error: 'Payments not configured' });
    let donor = null;
    try {
      donor = await verifiedDonation(new Stripe(key), data.transactionId, data.amount);
    } catch (error) {
      console.error('Donation verification error:', error.message);
    }
    if (!donor) return res.status(400).json({ error: 'Donation could not be verified' });

    // Request fields are escaped: they are inserted into the staff emails' HTML.
    const clean = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, typeof v === 'string' ? esc(v.slice(0, 200)) : v]));
    const verified = { ...clean, amount: String(donor.amount), email: esc(donor.email),
      cardBrand: esc(donor.cardBrand || clean.cardBrand || ''), cardLast4: esc(donor.cardLast4 || clean.cardLast4 || '') };
    const adminEmail = getAdminNotificationEmail(verified);
    const accountingEmail = getAccountingNotificationEmail(verified);

    await Promise.all([
      sendEmail({ to: ADMIN_EMAIL, subject: adminEmail.subject, html: adminEmail.html, replyTo: donor.email }),
      sendEmail({ to: ACCOUNTING_EMAIL, subject: accountingEmail.subject, html: accountingEmail.html, replyTo: ADMIN_EMAIL }),
    ]);

    // The donor's thank-you. Its failure must not hide the staff emails' success.
    try {
      const thanks = donorThankYouEmail(donor);
      await sendEmail({ to: donor.email, subject: thanks.subject, html: thanks.html, replyTo: ADMIN_EMAIL });
    } catch (error) {
      console.error('Donor thank-you error:', error);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Donation notification error:', error);
    return res.status(500).json({ error: 'Notification failed' });
  }
}
