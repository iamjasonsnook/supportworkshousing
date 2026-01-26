// API endpoint to create a new Connection Night request
// Compatible with Vercel serverless functions

import { createClient } from '@supabase/supabase-js';

// Email templates
const getVolunteerReceiptEmail = (data) => {
  const locationInfo = `${data.location_name} - ${data.location_address}`;
  const timeInfo = `${data.time_slot_day}, ${data.time_slot_time}`;
  const groupType = data.is_individual ? 'Individual' : 'Group/Organization';

  return {
    subject: 'Connection Night Request Received - SupportWorks Housing',
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
          .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }
          .button { display: inline-block; background-color: #9B1B5D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 50px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thank You for Volunteering!</h1>
          </div>
          <div class="content">
            <p>Dear ${data.contact_name},</p>

            <p>Thank you for your interest in hosting a Connection Night at SupportWorks Housing! We've received your request and our team will review it shortly.</p>

            <div class="info-box">
              <p style="margin-top: 0;"><strong>What happens next?</strong></p>
              <ol style="margin: 10px 0; padding-left: 20px;">
                <li>Our Mission Advancement team will review your request</li>
                <li>Once approved, you'll receive a confirmation email</li>
                <li>Three days before the event, everyone will receive a reminder</li>
              </ol>
            </div>

            <h2 style="color: #9B1B5D; margin-top: 30px;">Your Request Details</h2>

            <h3 style="color: #1A1A1A; font-size: 16px;">Location & Time</h3>
            <div class="info-row"><span class="info-label">Location:</span> ${locationInfo}</div>
            <div class="info-row"><span class="info-label">Time Slot:</span> ${timeInfo}</div>
            ${data.alternate_date_time ? `<div class="info-row"><span class="info-label">Alternate Time:</span> ${data.alternate_date_time}</div>` : ''}

            <h3 style="color: #1A1A1A; font-size: 16px; margin-top: 20px;">Group Information</h3>
            <div class="info-row"><span class="info-label">Type:</span> ${groupType}</div>
            <div class="info-row"><span class="info-label">Group Name:</span> ${data.group_name}</div>
            <div class="info-row"><span class="info-label">Contact:</span> ${data.contact_name}</div>
            <div class="info-row"><span class="info-label">Email:</span> ${data.contact_email}</div>
            <div class="info-row"><span class="info-label">Phone:</span> ${data.contact_phone}</div>
            <div class="info-row"><span class="info-label">Group Size:</span> ${data.group_size} people</div>

            <h3 style="color: #1A1A1A; font-size: 16px; margin-top: 20px;">Event Plan</h3>
            <div class="info-row"><span class="info-label">Food Plan:</span> ${data.food_plan === 'bring' ? 'Bring food' : data.food_plan === 'cater' ? 'Cater/deliver food' : 'Request guidance'}</div>
            ${data.food_details ? `<div class="info-row"><span class="info-label">Food Details:</span> ${data.food_details}</div>` : ''}
            <div class="info-row"><span class="info-label">Activity:</span> ${data.activity_plan}</div>
            ${data.activity_details ? `<div class="info-row"><span class="info-label">Activity Details:</span> ${data.activity_details}</div>` : ''}
            ${data.property_notes ? `<div class="info-row"><span class="info-label">Property Notes:</span> ${data.property_notes}</div>` : ''}

            <p style="margin-top: 30px;">If you have any questions, please don't hesitate to reach out to us at <a href="mailto:jsnook@supportworkshousing.org" style="color: #9B1B5D;">jsnook@supportworkshousing.org</a>.</p>

            <p>Thank you for making a difference in our community!</p>

            <p style="margin-top: 20px;"><strong>SupportWorks Housing Team</strong></p>
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

const getMissionAdvancementEmail = (data, confirmationToken, appUrl) => {
  const locationInfo = `${data.location_name} - ${data.location_address}`;
  const timeInfo = `${data.time_slot_day}, ${data.time_slot_time}`;
  const groupType = data.is_individual ? 'Individual' : 'Group/Organization';

  const approveUrl = `${appUrl}/api/approve-connection-night?token=${confirmationToken}`;
  const denyUrl = `${appUrl}/api/deny-connection-night?token=${confirmationToken}`;

  return {
    subject: `New Connection Night Request - ${data.group_name}`,
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
            <h1>New Connection Night Request</h1>
          </div>
          <div class="content">
            <div class="alert-box">
              <strong>Action Required:</strong> Please review and approve or deny this Connection Night request.
            </div>

            <h2 style="color: #9B1B5D;">Request Details</h2>

            <h3 style="color: #1A1A1A; font-size: 16px;">Location & Time</h3>
            <div class="info-row"><span class="info-label">Location:</span> ${locationInfo}</div>
            <div class="info-row"><span class="info-label">Time Slot:</span> ${timeInfo}</div>
            ${data.alternate_date_time ? `<div class="info-row"><span class="info-label">Alternate Time:</span> ${data.alternate_date_time}</div>` : ''}

            <h3 style="color: #1A1A1A; font-size: 16px; margin-top: 20px;">Group Information</h3>
            <div class="info-row"><span class="info-label">Type:</span> ${groupType}</div>
            <div class="info-row"><span class="info-label">Group Name:</span> ${data.group_name}</div>
            <div class="info-row"><span class="info-label">Contact Name:</span> ${data.contact_name}</div>
            <div class="info-row"><span class="info-label">Contact Email:</span> <a href="mailto:${data.contact_email}" style="color: #9B1B5D;">${data.contact_email}</a></div>
            <div class="info-row"><span class="info-label">Contact Phone:</span> <a href="tel:${data.contact_phone}" style="color: #9B1B5D;">${data.contact_phone}</a></div>
            <div class="info-row"><span class="info-label">Group Size:</span> ${data.group_size} people</div>

            <h3 style="color: #1A1A1A; font-size: 16px; margin-top: 20px;">Event Plan</h3>
            <div class="info-row"><span class="info-label">Food Plan:</span> ${data.food_plan === 'bring' ? 'Bring food' : data.food_plan === 'cater' ? 'Cater/deliver food' : 'Request guidance'}</div>
            ${data.food_details ? `<div class="info-row"><span class="info-label">Food Details:</span> ${data.food_details}</div>` : ''}
            <div class="info-row"><span class="info-label">Activity:</span> ${data.activity_plan}</div>
            ${data.activity_details ? `<div class="info-row"><span class="info-label">Activity Details:</span> ${data.activity_details}</div>` : ''}
            ${data.property_notes ? `<div class="info-row"><span class="info-label">Property Notes:</span> ${data.property_notes}</div>` : ''}

            <div class="actions">
              <a href="${approveUrl}" class="button button-approve">✓ Approve Request</a>
              <a href="${denyUrl}" class="button button-deny">✗ Deny Request</a>
            </div>

            <p style="text-align: center; color: #6B7280; font-size: 14px; margin-top: 20px;">
              Click the button above to approve or deny this request. The volunteer will be notified automatically.
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

            <p style="margin-top: 30px;">If you have any questions or need to make changes, please contact us at <a href="mailto:jsnook@supportworkshousing.org" style="color: #9B1B5D;">jsnook@supportworkshousing.org</a>.</p>

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

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;
    const appUrl = process.env.APP_URL || 'https://supportworkshousing.org';

    const requestData = req.body;

    // Build data object for email templates
    const emailData = {
      id: Date.now().toString(),
      location_id: requestData.location.id,
      location_name: requestData.location.name,
      location_address: requestData.location.address,
      time_slot_id: requestData.timeSlot.id,
      time_slot_day: requestData.timeSlot.day,
      time_slot_time: requestData.timeSlot.time,
      is_individual: requestData.group.isIndividual,
      group_name: requestData.group.name,
      group_size: requestData.group.size,
      contact_name: requestData.contact.name,
      contact_email: requestData.contact.email,
      contact_phone: requestData.contact.phone,
      food_plan: requestData.event.foodPlan,
      activity_plan: requestData.event.activityPlan,
      confirmation_token: `stub-${Date.now()}`,
    };

    let insertedData = emailData;

    // If Supabase is configured, save to database
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: dbData, error: insertError } = await supabase
        .from('connection_nights')
        .insert([
          {
            location_id: requestData.location.id,
            location_name: requestData.location.name,
            location_address: requestData.location.address,
            time_slot_id: requestData.timeSlot.id,
            time_slot_day: requestData.timeSlot.day,
            time_slot_time: requestData.timeSlot.time,
            alternate_date_time: requestData.alternateDateTime,
            is_individual: requestData.group.isIndividual,
            group_name: requestData.group.name,
            group_size: requestData.group.size,
            contact_name: requestData.contact.name,
            contact_email: requestData.contact.email,
            contact_phone: requestData.contact.phone,
            food_plan: requestData.event.foodPlan,
            food_details: requestData.event.foodDetails,
            activity_plan: requestData.event.activityPlan,
            activity_details: requestData.event.activityDetails,
            property_notes: requestData.event.propertyNotes,
            mission_advancement_email: 'jsnook@supportworkshousing.org',
            property_manager_email: requestData.recipients?.propertyManager,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (!insertError && dbData) {
        insertedData = dbData;
      }
    }

    // Send emails using Resend
    if (resendApiKey) {
      try {
        // Send volunteer receipt email
        const volunteerEmail = getVolunteerReceiptEmail(insertedData);
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'SupportWorks Housing <noreply@supportworkshousing.org>',
            to: [insertedData.contact_email],
            subject: volunteerEmail.subject,
            html: volunteerEmail.html,
          }),
        });

        // Send mission advancement email to jsnook@supportworkshousing.org
        const missionEmail = getMissionAdvancementEmail(insertedData, insertedData.confirmation_token, appUrl);
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'SupportWorks Housing <noreply@supportworkshousing.org>',
            to: ['jsnook@supportworkshousing.org'],
            subject: missionEmail.subject,
            html: missionEmail.html,
          }),
        });

        console.log('Emails sent successfully to volunteer and jsnook@supportworkshousing.org');
      } catch (emailError) {
        console.error('Email send error:', emailError);
        // Don't fail the request if email fails
      }
    } else {
      console.log('No RESEND_API_KEY configured - emails not sent');
      console.log('Would send to: jsnook@supportworkshousing.org');
      console.log('Request data:', JSON.stringify(insertedData, null, 2));
    }

    return res.status(200).json({
      success: true,
      id: insertedData.id,
      message: 'Connection Night request submitted successfully',
    });

  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
}

// Export email template functions for use in other endpoints
export { getApprovalEmail };
