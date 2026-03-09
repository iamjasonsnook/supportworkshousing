// Shared EmailJS REST API helper for server-side email sending
// Uses the "universal" template configured in the EmailJS dashboard.
// The template's "To Email" field must use {{to_email}} (with default = admin email).

export async function sendEmail({ to, subject, html, replyTo }) {
  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: 'service_EmailJSBrevo',
      template_id: 'universal',
      user_id: '76TcHTUs1bvcN68kM',
      template_params: {
        to_email: to,
        email_subject: subject,
        email_html: html,
        reply_to: replyTo || '',
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`EmailJS send failed (${response.status}): ${text}`);
  }

  return response;
}

// Resend helper — supports immediate and scheduled sending via scheduledAt (ISO 8601)
export async function sendEmailViaResend({ to, subject, html, replyTo, scheduledAt }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not configured');

  const from = process.env.RESEND_FROM_EMAIL || 'SupportWorks Housing <team@supportworkshousing.org>';

  const body = { from, to: Array.isArray(to) ? to : [to], subject, html };
  if (replyTo) body.reply_to = replyTo;
  if (scheduledAt) body.scheduled_at = scheduledAt;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Resend send failed (${response.status}): ${text}`);
  }

  return response.json();
}
