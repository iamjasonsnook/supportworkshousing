// API endpoint to create a new Connection Night request
// Compatible with Vercel serverless functions

import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors.js';
import { findOrCreatePerson } from './_people.js';
import { sendEmail } from './_email.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'jsnook@supportworkshousing.org';

// Email templates
const getVolunteerReceiptEmail = (data) => {
  const locationInfo = `${data.location_name} - ${data.location_address}`;
  const timeInfo = `${data.time_slot_day}, ${data.time_slot_time}`;
  const groupType = data.is_individual ? 'Individual' : 'Group/Organization';

  return {
    subject: 'Community Connections Request Received - SupportWorks Housing',
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
            <img src="https://supportworkshousing.vercel.app/images/logo-white.png" alt="SupportWorks Housing" style="display: block; margin: 0 auto 12px; height: 40px; width: auto;" />
            <h1>Thank You for Signing Up!</h1>
          </div>
          <div class="content">
            <p>Dear ${data.contact_name},</p>

            <p>Thank you for your interest in hosting a Community Connection at SupportWorks Housing! We've received your request and a SupportWorks team member will be in touch to confirm.</p>

            <div class="info-box">
              <p style="margin-top: 0;"><strong>What happens next?</strong></p>
              <ol style="margin: 10px 0; padding-left: 20px;">
                <li>A SupportWorks team member will review your request and confirm</li>
                <li>Once approved, you'll receive a confirmation email</li>
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
            <div class="info-row"><span class="info-label">Activity:</span> ${data.activity_plan ? data.activity_plan.charAt(0).toUpperCase() + data.activity_plan.slice(1) : ''}</div>
            ${data.activity_details ? `<div class="info-row"><span class="info-label">Activity Details:</span> ${data.activity_details}</div>` : ''}
            ${data.property_notes ? `<div class="info-row"><span class="info-label">Property Notes:</span> ${data.property_notes}</div>` : ''}

            <p style="margin-top: 30px;">If you have any questions, please don't hesitate to reach out to us at <a href="mailto:${ADMIN_EMAIL}" style="color: #9B1B5D;">${ADMIN_EMAIL}</a>.</p>

            <p>Thank you for making a difference in our community!</p>

            <p style="margin-top: 20px;"><strong>SupportWorks Housing Team</strong></p>
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

const getMissionAdvancementEmail = (data, confirmationToken, appUrl) => {
  const timeInfo = `${data.time_slot_day}, ${data.time_slot_time}`;
  const groupType = data.is_individual ? 'Individual' : 'Group/Organization';
  const portalUrl = 'https://supportworkshousing.vercel.app/admin';

  return {
    subject: `New Community Connections Request - ${data.group_name}`,
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
          .alert-box { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .info-row { margin: 10px 0; }
          .info-label { font-weight: 600; color: #1A1A1A; display: inline-block; min-width: 140px; vertical-align: top; }
          .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://supportworkshousing.vercel.app/images/logo-white.png" alt="SupportWorks Housing" style="display: block; margin: 0 auto 12px; height: 40px; width: auto;" />
            <h1>New Community Connections Request</h1>
          </div>
          <div class="content">
            <div class="alert-box">
              <strong>Action Required:</strong> A new Community Connections request needs your review. <a href="${portalUrl}" style="color: #9B1B5D;">Log in to the admin portal</a> to approve or deny.
            </div>

            <h2 style="color: #9B1B5D;">Request Details</h2>

            <h3 style="color: #1A1A1A; font-size: 16px;">Location & Time</h3>
            <div class="info-row"><span class="info-label">Location:</span> ${data.location_name}</div>
            <div class="info-row"><span class="info-label">Address:</span> ${data.location_address}</div>
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
            <div class="info-row"><span class="info-label">Activity:</span> ${data.activity_plan ? data.activity_plan.charAt(0).toUpperCase() + data.activity_plan.slice(1) : ''}</div>
            ${data.activity_details ? `<div class="info-row"><span class="info-label">Activity Details:</span> ${data.activity_details}</div>` : ''}
            ${data.property_notes ? `<div class="info-row"><span class="info-label">Property Notes:</span> ${data.property_notes}</div>` : ''}
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

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
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
            mission_advancement_email: ADMIN_EMAIL,
            property_manager_email: requestData.recipients?.propertyManager || ADMIN_EMAIL,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (!insertError && dbData) {
        insertedData = dbData;

        // Link to person record
        try {
          const person = await findOrCreatePerson(supabase, {
            email: requestData.contact.email,
            name: requestData.contact.name,
            phone: requestData.contact.phone,
            organization: requestData.group.isIndividual ? null : requestData.group.name,
            role: 'volunteer',
          });

          if (person) {
            await supabase
              .from('connection_nights')
              .update({ person_id: person.id })
              .eq('id', dbData.id);

            await supabase.from('interactions').insert({
              person_id: person.id,
              type: 'form_submission',
              subject: `Connection Night request: ${requestData.group.name}`,
              metadata: {
                connection_night_id: dbData.id,
                location: requestData.location.name,
                date: requestData.timeSlot.day,
              },
              direction: 'inbound',
              created_by: 'connection-nights',
            });
          }
        } catch (personErr) {
          console.error('Person linking error:', personErr.message);
        }
      }
    }

    // Send emails via EmailJS
    try {
      // Send volunteer receipt email
      const volunteerEmail = getVolunteerReceiptEmail(insertedData);
      await sendEmail({
        to: insertedData.contact_email,
        subject: volunteerEmail.subject,
        html: volunteerEmail.html,
      });

      // Send mission advancement email to admin
      const missionEmail = getMissionAdvancementEmail(insertedData, insertedData.confirmation_token, appUrl);
      await sendEmail({
        to: ADMIN_EMAIL,
        subject: missionEmail.subject,
        html: missionEmail.html,
        replyTo: insertedData.contact_email,
      });

      console.log('Emails sent successfully to volunteer and admin');
    } catch (emailError) {
      console.error('Email send error:', emailError);
      // Don't fail the request if email fails
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
