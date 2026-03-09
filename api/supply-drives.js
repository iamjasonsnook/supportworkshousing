// API endpoint to submit a new Supply Drive request

import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors.js';
import { findOrCreatePerson } from './_people.js';
import { sendEmail, sendEmailViaResend } from './_email.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'jsnook@supportworkshousing.org';

const getVolunteerReceiptEmail = (data) => ({
  subject: 'Supply Drive Drop-Off Confirmed - SupportWorks Housing',
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
        .info-box { background-color: #FDF2F4; border-left: 4px solid #9B1B5D; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .info-row { margin: 10px 0; }
        .info-label { font-weight: 600; color: #1A1A1A; }
        .items-list { margin: 10px 0; padding-left: 20px; }
        .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Thank You for Your Donation!</h1>
        </div>
        <div class="content">
          <p>Dear ${data.contact_name},</p>
          <p>Thank you for scheduling a supply drop-off at SupportWorks Housing! We've received your request and a SupportWorks team member will be in touch to confirm.</p>

          <div class="info-box">
            <p style="margin-top: 0;"><strong>What happens next?</strong></p>
            <ol style="margin: 10px 0; padding-left: 20px;">
              <li>A SupportWorks team member will review and confirm your drop-off</li>
              <li>Three days before your drop-off, you'll receive a reminder</li>
            </ol>
          </div>

          <h2 style="color: #9B1B5D; margin-top: 30px;">Your Drop-Off Details</h2>
          <div class="info-row"><span class="info-label">Location:</span> ${data.location_name}</div>
          <div class="info-row"><span class="info-label">Address:</span> ${data.location_address}</div>
          <div class="info-row"><span class="info-label">Date & Time:</span> ${data.drop_off_date}, ${data.drop_off_time}</div>

          ${data.selected_items && data.selected_items.length > 0 ? `
          <div class="info-row"><span class="info-label">Items to Donate:</span></div>
          <ul class="items-list">${data.selected_items.map(item => `<li>${item}</li>`).join('')}</ul>
          ` : ''}

          <p style="margin-top: 30px;">If you have any questions, please reach out at <a href="mailto:${ADMIN_EMAIL}" style="color: #9B1B5D;">${ADMIN_EMAIL}</a>.</p>
          <p>Thank you for making a difference in our community!</p>
          <p><strong>SupportWorks Housing Team</strong></p>
        </div>
        <div class="footer">
          <p>SupportWorks Housing | Creating Stable Communities</p>
        </div>
      </div>
    </body>
    </html>
  `,
});

const getAdminNotificationEmail = (data, confirmationToken, appUrl) => {
  const approveUrl = `${appUrl}/api/approve-supply-drive?token=${confirmationToken}`;
  const denyUrl = `${appUrl}/api/deny-supply-drive?token=${confirmationToken}`;

  return {
    subject: `New Supply Drive Drop-Off - ${data.contact_name} on ${data.drop_off_date}`,
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
          .alert-box { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .info-row { margin: 10px 0; }
          .info-label { font-weight: 600; color: #1A1A1A; display: inline-block; min-width: 140px; }
          .items-list { margin: 10px 0; padding-left: 20px; }
          .actions { text-align: center; margin: 30px 0; }
          .button { display: inline-block; padding: 14px 32px; text-decoration: none; border-radius: 50px; margin: 0 10px; font-weight: 600; }
          .button-approve { background-color: #10B981; color: white; }
          .button-deny { background-color: #EF4444; color: white; }
          .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Supply Drive Drop-Off</h1>
          </div>
          <div class="content">
            <div class="alert-box">
              <strong>Action Required:</strong> Please review and approve or deny this supply drop-off request.
            </div>

            <h2 style="color: #9B1B5D;">Drop-Off Details</h2>
            <div class="info-row"><span class="info-label">Location:</span> ${data.location_name}</div>
            <div class="info-row"><span class="info-label">Address:</span> ${data.location_address}</div>
            <div class="info-row"><span class="info-label">Date & Time:</span> ${data.drop_off_date}, ${data.drop_off_time}</div>

            <h3 style="color: #1A1A1A; font-size: 16px; margin-top: 20px;">Contact</h3>
            <div class="info-row"><span class="info-label">Name:</span> ${data.contact_name}</div>
            <div class="info-row"><span class="info-label">Email:</span> <a href="mailto:${data.contact_email}" style="color: #9B1B5D;">${data.contact_email}</a></div>
            <div class="info-row"><span class="info-label">Phone:</span> <a href="tel:${data.contact_phone}" style="color: #9B1B5D;">${data.contact_phone}</a></div>

            ${data.selected_items && data.selected_items.length > 0 ? `
            <h3 style="color: #1A1A1A; font-size: 16px; margin-top: 20px;">Items to Donate</h3>
            <ul class="items-list">${data.selected_items.map(item => `<li>${item}</li>`).join('')}</ul>
            ` : ''}

            <div class="actions">
              <a href="${approveUrl}" class="button button-approve">✓ Approve Drop-Off</a>
              <a href="${denyUrl}" class="button button-deny">✗ Deny Drop-Off</a>
            </div>

            <p style="text-align: center; color: #6B7280; font-size: 14px; margin-top: 20px;">
              Click a button above to approve or deny. The donor will be notified automatically.
            </p>
          </div>
          <div class="footer">
            <p>SupportWorks Housing | Mission Advancement</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

const getReminderEmailHtml = ({ recipientName, data, isAdmin }) => `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #4A4A4A; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #9B1B5D; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .header h1 { margin: 0; font-size: 24px; }
      .content { background-color: #FFFFFF; padding: 30px; border: 1px solid #E5E7EB; border-top: none; }
      .info-box { background-color: #FDF2F4; border-left: 4px solid #9B1B5D; padding: 15px; margin: 20px 0; border-radius: 4px; }
      .info-row { margin: 10px 0; }
      .info-label { font-weight: 600; color: #1A1A1A; }
      .items-list { margin: 10px 0; padding-left: 20px; }
      .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>⏰ Supply Drop-Off in 3 Days!</h1>
      </div>
      <div class="content">
        <p>Hi ${recipientName},</p>
        ${isAdmin
          ? `<p>Just a reminder that a supply drop-off is coming up in 3 days.</p>`
          : `<p>Your supply drop-off at SupportWorks Housing is just 3 days away!</p>`
        }
        <div class="info-box">
          <div class="info-row"><span class="info-label">Date & Time:</span> ${data.drop_off_date}, ${data.drop_off_time}</div>
          <div class="info-row"><span class="info-label">Location:</span> ${data.location_name}</div>
          <div class="info-row"><span class="info-label">Address:</span> ${data.location_address}</div>
          ${isAdmin ? `
          <div class="info-row"><span class="info-label">Donor:</span> ${data.contact_name} — <a href="mailto:${data.contact_email}" style="color: #9B1B5D;">${data.contact_email}</a> — ${data.contact_phone}</div>
          ` : ''}
        </div>
        ${data.selected_items && data.selected_items.length > 0 ? `
        <div class="info-row"><span class="info-label">Items:</span></div>
        <ul class="items-list">${data.selected_items.map(item => `<li>${item}</li>`).join('')}</ul>
        ` : ''}
        ${!isAdmin ? `<p>If anything has changed, please contact us at <a href="mailto:${ADMIN_EMAIL}" style="color: #9B1B5D;">${ADMIN_EMAIL}</a>.</p>` : ''}
        <p>Thank you for supporting our residents!</p>
        <p><strong>SupportWorks Housing Team</strong></p>
      </div>
      <div class="footer">
        <p>SupportWorks Housing | Creating Stable Communities</p>
      </div>
    </div>
  </body>
  </html>
`;

// Parse "Tuesday, March 14" → scheduled ISO timestamp at 9 AM ET (1 PM UTC) 3 days before
const getReminderScheduledAt = (dropOffDate) => {
  try {
    const now = new Date();
    let eventDate = new Date(`${dropOffDate}, ${now.getFullYear()}`);
    if (isNaN(eventDate.getTime())) return null;
    if (eventDate < now) eventDate.setFullYear(now.getFullYear() + 1);

    const reminderDate = new Date(eventDate);
    reminderDate.setDate(reminderDate.getDate() - 3);
    reminderDate.setUTCHours(13, 0, 0, 0); // 9 AM ET / 1 PM UTC

    if (reminderDate <= now) return null;
    return reminderDate.toISOString();
  } catch {
    return null;
  }
};

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    location_id,
    location_name,
    location_address,
    drop_off_date,
    drop_off_time,
    contact_name,
    contact_email,
    contact_phone,
    selected_items,
  } = req.body || {};

  if (!contact_name || !contact_email || !drop_off_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const appUrl = process.env.APP_URL || 'https://supportworkshousing.org';

  const emailData = {
    location_id,
    location_name,
    location_address,
    drop_off_date,
    drop_off_time,
    contact_name,
    contact_email,
    contact_phone,
    selected_items,
  };

  let savedId = `sd-${Date.now()}`;
  let confirmationToken = `stub-${Date.now()}`;

  // Save to Supabase if configured
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data, error } = await supabase
        .from('supply_drives')
        .insert([{
          location_id,
          location_name,
          location_address,
          drop_off_date,
          drop_off_time,
          contact_name,
          contact_email,
          contact_phone,
          selected_items,
          status: 'pending',
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        return res.status(500).json({ error: 'Failed to save supply drive' });
      }

      savedId = data.id;
      confirmationToken = data.confirmation_token || confirmationToken;

      // Link to person record
      try {
        const person = await findOrCreatePerson(supabase, {
          email: contact_email,
          name: contact_name,
          phone: contact_phone,
          role: 'volunteer',
        });

        if (person) {
          await supabase.from('supply_drives').update({ person_id: person.id }).eq('id', data.id);
          await supabase.from('interactions').insert({
            person_id: person.id,
            type: 'form_submission',
            subject: `Supply Drive submission: ${location_name || 'Drop-off'}`,
            metadata: { supply_drive_id: data.id, location: location_name, drop_off_date, items: selected_items },
            direction: 'inbound',
            created_by: 'supply-drives',
          });
        }
      } catch (personErr) {
        console.error('Person linking error:', personErr.message);
      }
    } catch (err) {
      console.error('Supply drive submission error:', err);
      return res.status(500).json({ error: 'Failed to save supply drive' });
    }
  }

  // Send confirmation emails
  try {
    await sendEmail({
      to: contact_email,
      subject: getVolunteerReceiptEmail(emailData).subject,
      html: getVolunteerReceiptEmail(emailData).html,
    });

    const adminEmail = getAdminNotificationEmail(emailData, confirmationToken, appUrl);
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: adminEmail.subject,
      html: adminEmail.html,
      replyTo: contact_email,
    });
  } catch (emailError) {
    console.error('Email send error:', emailError);
  }

  // Schedule 3-day reminder via Resend
  try {
    const reminderScheduledAt = getReminderScheduledAt(drop_off_date);
    if (reminderScheduledAt) {
      await sendEmailViaResend({
        to: contact_email,
        subject: `Reminder: Your Supply Drop-Off is in 3 Days!`,
        html: getReminderEmailHtml({ recipientName: contact_name, data: emailData, isAdmin: false }),
        scheduledAt: reminderScheduledAt,
      });

      await sendEmailViaResend({
        to: ADMIN_EMAIL,
        subject: `Reminder: Supply Drop-Off in 3 Days — ${contact_name}`,
        html: getReminderEmailHtml({ recipientName: 'Jason', data: emailData, isAdmin: true }),
        scheduledAt: reminderScheduledAt,
      });

      console.log(`Supply drive reminders scheduled for ${reminderScheduledAt}`);
    }
  } catch (reminderError) {
    console.error('Reminder scheduling error:', reminderError);
  }

  return res.status(200).json({ success: true, id: savedId });
}
