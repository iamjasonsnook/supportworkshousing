// Shared EmailJS REST API helper for server-side email sending
// Uses the "universal" template configured in the EmailJS dashboard.
// The template's "To Email" field must use {{to_email}} (with default = admin email).
//
// NOTE: Requires "Allow non-browser environments" enabled in EmailJS dashboard:
// https://dashboard.emailjs.com/admin/account/security

export async function sendEmail({ to, subject, html, replyTo }) {
  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: 'service_EmailJSBrevo',
      template_id: 'universal',
      user_id: '76TcHTUs1bvcN68kM',
      accessToken: process.env.EMAILJS_PRIVATE_KEY,
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
