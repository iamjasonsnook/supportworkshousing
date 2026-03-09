// API endpoint to approve a Supply Drive drop-off request

import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors.js';
import { sendEmail } from './_email.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'jsnook@supportworkshousing.org';

const getApprovalEmail = (data) => ({
  subject: 'Supply Drop-Off Confirmed! - SupportWorks Housing',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #4A4A4A; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10B981; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background-color: #FFFFFF; padding: 30px; border: 1px solid #E5E7EB; border-top: none; }
        .success-box { background-color: #D1FAE5; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .info-row { margin: 10px 0; }
        .info-label { font-weight: 600; color: #1A1A1A; }
        .items-list { margin: 10px 0; padding-left: 20px; }
        .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Your Drop-Off is Confirmed!</h1>
        </div>
        <div class="content">
          <p>Dear ${data.contact_name},</p>
          <div class="success-box">
            <p style="margin: 0;"><strong>Great news!</strong> Your supply drop-off has been confirmed by our team.</p>
          </div>
          <p>Thank you for donating essential items to support our residents!</p>

          <h2 style="color: #9B1B5D;">Confirmed Drop-Off Details</h2>
          <div class="info-row"><span class="info-label">Location:</span> ${data.location_name}</div>
          <div class="info-row"><span class="info-label">Address:</span> ${data.location_address}</div>
          <div class="info-row"><span class="info-label">Date & Time:</span> ${data.drop_off_date}, ${data.drop_off_time}</div>

          ${data.selected_items && data.selected_items.length > 0 ? `
          <div class="info-row"><span class="info-label">Items:</span></div>
          <ul class="items-list">${data.selected_items.map(item => `<li>${item}</li>`).join('')}</ul>
          ` : ''}

          <p style="margin-top: 30px;">You'll receive a reminder 3 days before your drop-off. If you need to make any changes, contact us at <a href="mailto:${ADMIN_EMAIL}" style="color: #9B1B5D;">${ADMIN_EMAIL}</a>.</p>
          <p><strong>Thank you for making a difference!</strong></p>
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
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { token } = req.query;
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

    await supabase
      .from('supply_drives')
      .update({ status: 'approved', approved_by: ADMIN_EMAIL, approved_at: new Date().toISOString() })
      .eq('id', requestData.id);

    try {
      const approvalEmail = getApprovalEmail(requestData);
      await sendEmail({ to: requestData.contact_email, subject: approvalEmail.subject, html: approvalEmail.html });
    } catch (emailError) {
      console.error('Email send error:', emailError);
    }

    return res.status(200).send(`
      <!DOCTYPE html>
      <html><head><style>
        body { font-family: 'Inter', -apple-system, sans-serif; padding: 40px; text-align: center; background-color: #F9FAFB; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .success-icon { width: 64px; height: 64px; background-color: #D1FAE5; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 32px; }
        h1 { color: #10B981; } p { color: #4A4A4A; }
        .details { background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left; }
        .detail-row { margin: 8px 0; } .detail-label { font-weight: 600; color: #1A1A1A; }
      </style></head>
      <body><div class="container">
        <div class="success-icon">✓</div>
        <h1>Drop-Off Approved!</h1>
        <p>The donor has been notified with confirmation details.</p>
        <div class="details">
          <div class="detail-row"><span class="detail-label">Donor:</span> ${requestData.contact_name}</div>
          <div class="detail-row"><span class="detail-label">Location:</span> ${requestData.location_name}</div>
          <div class="detail-row"><span class="detail-label">Date & Time:</span> ${requestData.drop_off_date}, ${requestData.drop_off_time}</div>
        </div>
        <p style="color: #6B7280; font-size: 14px;">Confirmation email sent to ${requestData.contact_email}.</p>
      </div></body></html>
    `);
  } catch (error) {
    console.error('Error approving supply drive:', error);
    return res.status(500).send('<h1>Error</h1><p>An error occurred while processing the approval.</p>');
  }
}
