// API endpoint to deny a Supply Drive drop-off request

import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors.js';
import { sendEmail } from './_email.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'jsnook@supportworkshousing.org';

const getDenialEmail = (data, reason) => ({
  subject: 'Supply Drop-Off Request Update - SupportWorks Housing',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #4A4A4A; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #9B1B5D; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background-color: #FFFFFF; padding: 30px; border: 1px solid #E5E7EB; border-top: none; }
        .info-box { background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Supply Drop-Off Request Update</h1>
        </div>
        <div class="content">
          <p>Dear ${data.contact_name},</p>
          <p>Thank you for your interest in donating to SupportWorks Housing.</p>
          <div class="info-box">
            <p style="margin: 0;"><strong>We're unable to accommodate your drop-off request at this time.</strong></p>
          </div>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          <p>We truly appreciate your generosity. While we can't accommodate this particular request, we'd love to work with you on future opportunities.</p>
          <h3 style="color: #1A1A1A; margin-top: 25px;">What's Next?</h3>
          <ul style="line-height: 2;">
            <li>You can submit a new request for a different date</li>
            <li>Contact us to discuss alternative ways to donate</li>
          </ul>
          <p style="margin-top: 30px;">If you have questions, please reach out at <a href="mailto:${ADMIN_EMAIL}" style="color: #9B1B5D;">${ADMIN_EMAIL}</a>.</p>
          <p><strong>Thank you for your understanding and continued support!</strong></p>
          <p>SupportWorks Housing Team</p>
        </div>
        <div class="footer">
          <p>SupportWorks Housing | Creating Stable Communities</p>
        </div>
      </div>
    </body>
    </html>
  `,
});

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { token } = req.query;
  let reason = '';
  if (req.method === 'POST') reason = req.body?.reason || '';

  if (!token) return res.status(400).send('<h1>Invalid or missing token</h1>');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(500).send('<h1>Server configuration error</h1>');

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: requestData, error: findError } = await supabase
      .from('supply_drives')
      .select('*')
      .eq('confirmation_token', token)
      .single();

    if (findError || !requestData) {
      return res.status(404).send('<h1>Request not found</h1><p>This link may be invalid or expired.</p>');
    }

    if (requestData.status !== 'pending') {
      return res.status(400).send(`
        <html><head><style>
          body { font-family: 'Inter', -apple-system, sans-serif; padding: 40px; text-align: center; background-color: #F9FAFB; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        </style></head>
        <body><div class="container">
          <h1>Already Processed</h1>
          <p>This request has already been ${requestData.status}.</p>
        </div></body></html>
      `);
    }

    // GET — show denial form
    if (req.method === 'GET') {
      return res.status(200).send(`
        <!DOCTYPE html>
        <html><head><style>
          body { font-family: 'Inter', -apple-system, sans-serif; padding: 40px; background-color: #F9FAFB; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          h1 { color: #1A1A1A; margin-bottom: 8px; } .subtitle { color: #6B7280; margin-bottom: 30px; }
          .details { background-color: #FDF2F4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9B1B5D; }
          .detail-row { margin: 8px 0; } .detail-label { font-weight: 600; color: #1A1A1A; display: inline-block; min-width: 100px; }
          label { display: block; font-weight: 600; color: #1A1A1A; margin-bottom: 8px; margin-top: 20px; }
          textarea { width: 100%; padding: 12px; border: 2px solid #E5E7EB; border-radius: 8px; font-family: inherit; font-size: 14px; resize: vertical; box-sizing: border-box; }
          textarea:focus { outline: none; border-color: #9B1B5D; }
          .actions { margin-top: 30px; display: flex; gap: 12px; }
          button { flex: 1; padding: 14px 24px; border: none; border-radius: 50px; font-weight: 600; font-size: 16px; cursor: pointer; font-family: inherit; }
          .btn-deny { background-color: #EF4444; color: white; }
          .btn-cancel { background-color: #E5E7EB; color: #1A1A1A; }
        </style></head>
        <body><div class="container">
          <h1>Deny Supply Drop-Off Request</h1>
          <p class="subtitle">Review the request details and provide an optional reason for denial.</p>
          <div class="details">
            <div class="detail-row"><span class="detail-label">Donor:</span> ${requestData.contact_name}</div>
            <div class="detail-row"><span class="detail-label">Location:</span> ${requestData.location_name}</div>
            <div class="detail-row"><span class="detail-label">Date:</span> ${requestData.drop_off_date}, ${requestData.drop_off_time}</div>
          </div>
          <form method="POST" action="?token=${token}">
            <label for="reason">Reason for Denial (Optional)</label>
            <textarea id="reason" name="reason" rows="4" placeholder="Provide a brief explanation that will be shared with the donor..."></textarea>
            <div class="actions">
              <button type="button" class="btn-cancel" onclick="window.history.back()">Cancel</button>
              <button type="submit" class="btn-deny">Confirm Denial</button>
            </div>
          </form>
        </div></body></html>
      `);
    }

    // POST — process the denial
    if (req.method === 'POST') {
      await supabase
        .from('supply_drives')
        .update({ status: 'denied', denial_reason: reason, approved_by: ADMIN_EMAIL, approved_at: new Date().toISOString() })
        .eq('id', requestData.id);

      try {
        const denialEmail = getDenialEmail(requestData, reason);
        await sendEmail({ to: requestData.contact_email, subject: denialEmail.subject, html: denialEmail.html });
      } catch (emailError) {
        console.error('Email send error:', emailError);
      }

      return res.status(200).send(`
        <!DOCTYPE html>
        <html><head><style>
          body { font-family: 'Inter', -apple-system, sans-serif; padding: 40px; text-align: center; background-color: #F9FAFB; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .icon { width: 64px; height: 64px; background-color: #FEE2E2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 32px; }
          h1 { color: #1A1A1A; } p { color: #4A4A4A; }
          .details { background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left; }
          .detail-row { margin: 8px 0; } .detail-label { font-weight: 600; color: #1A1A1A; }
        </style></head>
        <body><div class="container">
          <div class="icon">✗</div>
          <h1>Request Denied</h1>
          <p>The donor has been notified.</p>
          <div class="details">
            <div class="detail-row"><span class="detail-label">Donor:</span> ${requestData.contact_name}</div>
            <div class="detail-row"><span class="detail-label">Location:</span> ${requestData.location_name}</div>
            ${reason ? `<div class="detail-row"><span class="detail-label">Reason:</span> ${reason}</div>` : ''}
          </div>
        </div></body></html>
      `);
    }
  } catch (error) {
    console.error('Error denying supply drive:', error);
    return res.status(500).send('<h1>Error</h1><p>An error occurred while processing the denial.</p>');
  }
}
