// Shared EmailJS REST API helper for server-side email sending
// Uses the "universal" template configured in the EmailJS dashboard.
// The template's "To Email" field must use {{to_email}} (with default = admin email).
//
// NOTE: Requires "Allow non-browser environments" enabled in EmailJS dashboard:
// https://dashboard.emailjs.com/admin/account/security
//
// Every address is checked here, because EmailJS sends to every
// comma-separated address in to_email: an unchecked form field could
// otherwise make SupportWorks email a whole list of strangers. A list is
// allowed only when every address is a SupportWorks staff address, or when
// the caller says so with multipleRecipients (the Friday digest).

export const ORG_DOMAIN = 'supportworkshousing.org';

// One plain address: no spaces, commas, semicolons, quotes or line breaks.
const ONE_EMAIL = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;
export const isOneEmail = s => typeof s === 'string' && s.length <= 254 && ONE_EMAIL.test(s.trim());

export function parseRecipients(value, { multipleRecipients = false } = {}) {
  const list = String(value ?? '').split(',').map(s => s.trim()).filter(Boolean);
  if (!list.length) throw new Error('Email not sent: no recipient');
  if (!list.every(isOneEmail)) throw new Error('Email not sent: a recipient is not a valid email address');
  const allStaff = list.every(a => a.toLowerCase().endsWith('@' + ORG_DOMAIN));
  if (list.length > 1 && !multipleRecipients && !allStaff) throw new Error('Email not sent: more than one recipient');
  return list;
}

export async function sendEmail({ to, subject, html, replyTo, bcc, multipleRecipients = false }) {
  const toList = parseRecipients(to, { multipleRecipients });
  const bccList = bcc ? parseRecipients(bcc, { multipleRecipients: true }) : [];
  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: 'service_EmailJSBrevo',
      template_id: 'universal',
      user_id: '76TcHTUs1bvcN68kM',
      accessToken: process.env.EMAILJS_PRIVATE_KEY,
      template_params: {
        to_email: toList.join(', '),
        // A subject is one line of plain text.
        email_subject: String(subject ?? '').replace(/[\r\n]+/g, ' ').slice(0, 250),
        email_html: html,
        reply_to: isOneEmail(replyTo) ? replyTo.trim() : '',
        bcc_email: bccList.join(', '),
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`EmailJS send failed (${response.status}): ${text}`);
  }

  return response;
}
