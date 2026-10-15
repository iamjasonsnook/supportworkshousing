import { setCorsHeaders } from './_cors.js';
import { sendEmail } from './_email.js';
import { checkRateLimit } from './_rateLimit.js';

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

export function cleanStockPledge(body) {
  const d = {
    firstName: clip(body.firstName, 80), lastName: clip(body.lastName, 80),
    email: clip(body.email, 254), phone: clip(body.phone, 40),
    approxValue: clip(body.approxValue, 40), transferDate: clip(body.transferDate, 10),
    brokerFirm: clip(body.brokerFirm, 120), note: clip(body.note, 1000),
    stocks: (Array.isArray(body.stocks) ? body.stocks : []).slice(0, 5)
      .map(s => ({ name: clip(s?.name, 120), shares: clip(s?.shares, 40) }))
      .filter(s => s.name && s.shares),
  };
  const errors = [];
  if (!d.firstName || !d.lastName) errors.push('name');
  if (!isEmail(d.email)) errors.push('email');
  if (!d.stocks.length) errors.push('stocks');
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
const stockRows = (d) => d.stocks.map(s => `<div class="info-row"><span class="info-label">${esc(s.name)}:</span> ${esc(s.shares)} shares</div>`).join('');
const transferRows = () => TRANSFER_DETAILS.map(([k, v]) => row(k, v)).join('');
const fmtDate = (iso) => { const [y, m, dd] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, dd)).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' }); };

export function stockPledgeStaffEmail(d) {
  const name = `${d.firstName} ${d.lastName}`;
  return {
    subject: `Stock gift on the way: ${d.stocks.map(s => s.name).join(', ')} from ${name}`,
    html: shell('Stock Gift Pledged', `
<div class="box">A donor has told us about a stock transfer to our Merrill Lynch account. Watch for it around the date below and match it to this donor.</div>
<h2 style="color:#9B1B5D;margin-top:24px;">Gift</h2>${stockRows(d)}
${row('Approximate value', d.approxValue ? `$${d.approxValue.replace(/^\$/, '')}` : '')}
${row('Expected transfer', fmtDate(d.transferDate))}${row('Donor\'s brokerage', d.brokerFirm)}${row('Note', d.note)}
<h2 style="color:#9B1B5D;margin-top:24px;">Donor</h2>${row('Name', name)}${row('Email', d.email)}${row('Phone', d.phone)}`),
  };
}

export function stockPledgeDonorEmail(d) {
  return {
    subject: 'Thank you for your gift of stock to SupportWorks Housing',
    html: shell('Thank You for Your Gift of Stock', `
<p>Dear ${esc(d.firstName)},</p>
<p>Thank you for choosing to give stock to SupportWorks Housing. We have your details and will watch for the transfer, then send you a receipt once the shares arrive.</p>
<h2 style="color:#9B1B5D;margin-top:24px;">Your gift</h2>${stockRows(d)}${row('Expected transfer', fmtDate(d.transferDate))}
<h2 style="color:#9B1B5D;margin-top:24px;">Transfer instructions for your broker</h2><div class="box">${transferRows()}</div>
<p>Please consult your tax advisor about your situation. If anything changes, just reply to this email.</p>
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

  const staff = stockPledgeStaffEmail(data);
  const donor = stockPledgeDonorEmail(data);
  try {
    await Promise.all([
      sendEmail({ to: ADMIN_EMAIL, subject: staff.subject, html: staff.html, replyTo: data.email }),
      sendEmail({ to: ACCOUNTING_EMAIL, subject: staff.subject, html: staff.html, replyTo: data.email }),
      sendEmail({ to: data.email, subject: donor.subject, html: donor.html, replyTo: ADMIN_EMAIL }),
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
    if (!data.transactionId || !data.amount || !data.firstName || !data.email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const adminEmail = getAdminNotificationEmail(data);
    const accountingEmail = getAccountingNotificationEmail(data);

    await Promise.all([
      sendEmail({ to: ADMIN_EMAIL, subject: adminEmail.subject, html: adminEmail.html, replyTo: data.email }),
      sendEmail({ to: ACCOUNTING_EMAIL, subject: accountingEmail.subject, html: accountingEmail.html, replyTo: ADMIN_EMAIL }),
    ]);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Donation notification error:', error);
    return res.status(500).json({ error: error.message });
  }
}
