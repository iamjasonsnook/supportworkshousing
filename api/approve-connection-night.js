// API endpoint to approve a Connection Night request
// Compatible with Vercel serverless functions

import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors.js';
import { sendEmail } from './_email.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'jsnook@supportworkshousing.org';

const getApprovalEmail = (data) => {
  const locationInfo = `${data.location_name} - ${data.location_address}`;
  const timeInfo = `${data.time_slot_day}, ${data.time_slot_time}`;

  return {
    subject: 'Connection Night Request Approved! - SupportWorks Housing',
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
          .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Your Connection Night is Confirmed!</h1>
          </div>
          <div class="content">
            <p>Dear ${data.contact_name},</p>

            <div class="success-box">
              <p style="margin: 0;"><strong>Great news!</strong> Your Connection Night request has been approved by our team.</p>
            </div>

            <p>We're excited to have you host this event and create meaningful connections within our community!</p>

            <h2 style="color: #9B1B5D;">Confirmed Event Details</h2>
            <div class="info-row"><span class="info-label">Location:</span> ${locationInfo}</div>
            <div class="info-row"><span class="info-label">Date & Time:</span> ${timeInfo}</div>
            <div class="info-row"><span class="info-label">Group Size:</span> ${data.group_size} people</div>

            <h3 style="color: #1A1A1A; margin-top: 25px;">Before the Event:</h3>
            <ul style="line-height: 2;">
              <li>You'll receive a reminder email 3 days before the event</li>
              <li>The property manager has been notified and will be ready to welcome you</li>
              <li>Please arrive 15 minutes early to coordinate with property staff</li>
              <li>Bring any materials or food you planned for the evening</li>
            </ul>

            <h3 style="color: #1A1A1A; margin-top: 25px;">Day of the Event:</h3>
            <ul style="line-height: 2;">
              <li>Check in with the property manager upon arrival</li>
              <li>Set up in the designated common area</li>
              <li>Welcome residents and create a warm, inclusive atmosphere</li>
              <li>Enjoy building connections through food and activities!</li>
            </ul>

            <p style="margin-top: 30px;">If you have any questions or need to make changes, please contact us at <a href="mailto:${ADMIN_EMAIL}" style="color: #9B1B5D;">${ADMIN_EMAIL}</a>.</p>

            <p><strong>Thank you for making a difference!</strong></p>

            <p style="margin-top: 20px;">SupportWorks Housing Team</p>
          </div>
          <div class="footer">
            <p>SupportWorks Housing | Creating Stable Communities</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

const getPropertyManagerEmail = (data) => {
  const locationInfo = `${data.location_name} - ${data.location_address}`;
  const timeInfo = `${data.time_slot_day}, ${data.time_slot_time}`;
  const groupType = data.is_individual ? 'Individual' : 'Group/Organization';

  return {
    subject: `Connection Night Scheduled - ${timeInfo}`,
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
          .info-label { font-weight: 600; color: #1A1A1A; display: inline-block; min-width: 140px; }
          .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Connection Night Scheduled</h1>
          </div>
          <div class="content">
            <p>Hello,</p>

            <div class="info-box">
              <p style="margin: 0;"><strong>A Connection Night has been scheduled at your property.</strong></p>
            </div>

            <h2 style="color: #9B1B5D;">Event Details</h2>
            <div class="info-row"><span class="info-label">Location:</span> ${locationInfo}</div>
            <div class="info-row"><span class="info-label">Date & Time:</span> ${timeInfo}</div>

            <h3 style="color: #1A1A1A; font-size: 16px; margin-top: 20px;">Volunteer Group</h3>
            <div class="info-row"><span class="info-label">Type:</span> ${groupType}</div>
            <div class="info-row"><span class="info-label">Group Name:</span> ${data.group_name}</div>
            <div class="info-row"><span class="info-label">Contact:</span> ${data.contact_name}</div>
            <div class="info-row"><span class="info-label">Email:</span> <a href="mailto:${data.contact_email}" style="color: #9B1B5D;">${data.contact_email}</a></div>
            <div class="info-row"><span class="info-label">Phone:</span> <a href="tel:${data.contact_phone}" style="color: #9B1B5D;">${data.contact_phone}</a></div>
            <div class="info-row"><span class="info-label">Group Size:</span> ${data.group_size} people</div>

            <h3 style="color: #1A1A1A; font-size: 16px; margin-top: 20px;">Event Plan</h3>
            <div class="info-row"><span class="info-label">Food Plan:</span> ${data.food_plan === 'bring' ? 'Bring food' : data.food_plan === 'cater' ? 'Cater/deliver food' : 'Request guidance'}</div>
            ${data.food_details ? `<div class="info-row"><span class="info-label">Food Details:</span> ${data.food_details}</div>` : ''}
            <div class="info-row"><span class="info-label">Activity:</span> ${data.activity_plan}</div>
            ${data.activity_details ? `<div class="info-row"><span class="info-label">Activity Details:</span> ${data.activity_details}</div>` : ''}
            ${data.property_notes ? `<div class="info-box" style="margin-top: 20px;"><strong>Special Notes:</strong><br>${data.property_notes}</div>` : ''}

            <h3 style="color: #1A1A1A; margin-top: 25px;">Preparation:</h3>
            <ul style="line-height: 2;">
              <li>Ensure the common area is available and prepared</li>
              <li>The volunteer group will arrive 15 minutes early</li>
              <li>Please greet them and show them the event space</li>
              <li>Notify residents about the Connection Night</li>
            </ul>

            <p style="margin-top: 30px;">You'll receive a reminder 3 days before the event. If you have any questions, contact <a href="mailto:${ADMIN_EMAIL}" style="color: #9B1B5D;">${ADMIN_EMAIL}</a>.</p>

            <p style="margin-top: 20px;">Thank you,<br><strong>SupportWorks Housing Team</strong></p>
          </div>
          <div class="footer">
            <p>SupportWorks Housing | Creating Stable Communities</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send('<h1>Invalid or missing token</h1>');
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the request by token
    const { data: requestData, error: findError } = await supabase
      .from('connection_nights')
      .select('*')
      .eq('confirmation_token', token)
      .single();

    if (findError || !requestData) {
      return res.status(404).send('<h1>Request not found</h1><p>This link may be invalid or expired.</p>');
    }

    if (requestData.status !== 'pending') {
      return res.status(400).send(`
        <html>
          <head>
            <style>
              body { font-family: 'Inter', -apple-system, sans-serif; padding: 40px; text-align: center; background-color: #F9FAFB; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
              h1 { color: #1A1A1A; }
              p { color: #4A4A4A; line-height: 1.6; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Already Processed</h1>
              <p>This request has already been ${requestData.status}.</p>
            </div>
          </body>
        </html>
      `);
    }

    // Update status to approved
    const { error: updateError } = await supabase
      .from('connection_nights')
      .update({
        status: 'approved',
        approved_by: ADMIN_EMAIL,
        approved_at: new Date().toISOString(),
      })
      .eq('id', requestData.id);

    if (updateError) {
      throw new Error('Failed to update request status');
    }

    // Send approval emails via EmailJS
    try {
      // Send to volunteer
      const volunteerEmail = getApprovalEmail(requestData);
      await sendEmail({
        to: requestData.contact_email,
        subject: volunteerEmail.subject,
        html: volunteerEmail.html,
      });

      // Send to property manager
      const propertyManagerEmail = getPropertyManagerEmail(requestData);
      await sendEmail({
        to: requestData.property_manager_email || ADMIN_EMAIL,
        subject: propertyManagerEmail.subject,
        html: propertyManagerEmail.html,
      });
    } catch (emailError) {
      console.error('Email send error:', emailError);
      // Don't fail the approval if email fails
    }

    // Return success page
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 40px;
            text-align: center;
            background-color: #F9FAFB;
            line-height: 1.6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .success-icon {
            width: 64px;
            height: 64px;
            background-color: #D1FAE5;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 32px;
          }
          h1 { color: #10B981; margin-bottom: 16px; }
          p { color: #4A4A4A; margin-bottom: 12px; }
          .details {
            background-color: #F9FAFB;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: left;
          }
          .detail-row {
            margin: 8px 0;
          }
          .detail-label {
            font-weight: 600;
            color: #1A1A1A;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✓</div>
          <h1>Connection Night Approved!</h1>
          <p>The volunteer group has been notified and the property manager has been informed.</p>

          <div class="details">
            <div class="detail-row">
              <span class="detail-label">Group:</span> ${requestData.group_name}
            </div>
            <div class="detail-row">
              <span class="detail-label">Contact:</span> ${requestData.contact_name}
            </div>
            <div class="detail-row">
              <span class="detail-label">Location:</span> ${requestData.location_name}
            </div>
            <div class="detail-row">
              <span class="detail-label">Time:</span> ${requestData.time_slot_day}, ${requestData.time_slot_time}
            </div>
          </div>

          <p style="margin-top: 30px; color: #6B7280; font-size: 14px;">
            Confirmation emails have been sent to all parties.
          </p>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('Error approving request:', error);
    return res.status(500).send('<h1>Error</h1><p>An error occurred while processing the approval.</p>');
  }
}
