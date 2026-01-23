// =============================================================================
// EMAIL SERVICE
// =============================================================================
// This module handles sending emails via EmailJS (client-side) or Resend (server-side).
// For production, consider using a serverless function with Resend for better security.
//
// EmailJS Setup (Client-side - Free tier):
// 1. Sign up at https://www.emailjs.com/
// 2. Create an email service (Gmail, Outlook, etc.)
// 3. Create email templates (see templates below)
// 4. Get your Public Key, Service ID, and Template IDs
// 5. Add to .env:
//    VITE_EMAILJS_PUBLIC_KEY=your_public_key
//    VITE_EMAILJS_SERVICE_ID=your_service_id
//    VITE_EMAILJS_VOLUNTEER_TEMPLATE_ID=volunteer_template_id
//    VITE_EMAILJS_ADMIN_TEMPLATE_ID=admin_template_id
//    VITE_EMAILJS_STATUS_TEMPLATE_ID=status_template_id
//
// Install EmailJS: npm install @emailjs/browser
// =============================================================================

import emailjs from '@emailjs/browser';

const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_VOLUNTEER_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_VOLUNTEER_TEMPLATE_ID;
const EMAILJS_ADMIN_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_ADMIN_TEMPLATE_ID;
const EMAILJS_STATUS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_STATUS_TEMPLATE_ID;

const ADMIN_EMAIL = 'jsnook@supportworkshousing.org';
const SITE_URL = window.location.origin;

// Initialize EmailJS
if (EMAILJS_PUBLIC_KEY) {
  emailjs.init(EMAILJS_PUBLIC_KEY);
}

// =============================================================================
// VOLUNTEER CONFIRMATION EMAIL
// =============================================================================
// Template for volunteer's confirmation email
// Subject: Connection Nights Request Received - SupportWorks Housing
//
// Template variables:
// - volunteer_name
// - volunteer_email
// - phone
// - preferred_date
// - group_size
// - organization
// - notes
// =============================================================================
export async function sendVolunteerConfirmationEmail(formData) {
  if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_VOLUNTEER_TEMPLATE_ID) {
    console.warn('EmailJS not configured. Skipping volunteer confirmation email.');
    return;
  }

  const templateParams = {
    volunteer_name: formData.name,
    volunteer_email: formData.email,
    phone: formData.phone,
    preferred_date: new Date(formData.preferredDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    group_size: formData.groupSize,
    organization: formData.organization || 'N/A',
    notes: formData.notes || 'No additional notes provided'
  };

  try {
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_VOLUNTEER_TEMPLATE_ID,
      templateParams
    );
  } catch (error) {
    console.error('Error sending volunteer confirmation email:', error);
  }
}

// =============================================================================
// ADMIN NOTIFICATION EMAIL
// =============================================================================
// Template for admin notification with approval links
// Subject: New Connection Nights Request - Action Required
//
// Template variables:
// - admin_email
// - volunteer_name
// - volunteer_email
// - phone
// - preferred_date
// - group_size
// - organization
// - notes
// - approve_link
// - deny_link
// =============================================================================
export async function sendAdminNotificationEmail(formData, requestId) {
  if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_ADMIN_TEMPLATE_ID) {
    console.warn('EmailJS not configured. Skipping admin notification email.');
    return;
  }

  const approveLink = `${SITE_URL}/confirm?id=${requestId}&action=approve`;
  const denyLink = `${SITE_URL}/confirm?id=${requestId}&action=deny`;

  const templateParams = {
    admin_email: ADMIN_EMAIL,
    volunteer_name: formData.name,
    volunteer_email: formData.email,
    phone: formData.phone,
    preferred_date: new Date(formData.preferredDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    group_size: formData.groupSize,
    organization: formData.organization || 'N/A',
    notes: formData.notes || 'No additional notes provided',
    approve_link: approveLink,
    deny_link: denyLink
  };

  try {
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_ADMIN_TEMPLATE_ID,
      templateParams
    );
  } catch (error) {
    console.error('Error sending admin notification email:', error);
  }
}

// =============================================================================
// STATUS UPDATE EMAIL
// =============================================================================
// Template for status update email to volunteer (with admin CC'd)
// Subject: Connection Nights Request [APPROVED/DENIED] - SupportWorks Housing
//
// Template variables:
// - volunteer_name
// - volunteer_email
// - admin_email (CC)
// - status (approved/denied)
// - phone
// - preferred_date
// - group_size
// - organization
// =============================================================================
export async function sendStatusUpdateEmail(request, status) {
  if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_STATUS_TEMPLATE_ID) {
    console.warn('EmailJS not configured. Skipping status update email.');
    return;
  }

  const templateParams = {
    volunteer_name: request.name,
    volunteer_email: request.email,
    admin_email: ADMIN_EMAIL,
    status: status.toUpperCase(),
    status_message: status === 'approved'
      ? 'Great news! Your Connection Nights request has been approved.'
      : 'We apologize, but we are unable to accommodate your Connection Nights request at this time.',
    phone: request.phone,
    preferred_date: new Date(request.preferred_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    group_size: request.group_size,
    organization: request.organization || 'N/A',
    next_steps: status === 'approved'
      ? 'Someone from our team will contact you within 24-48 hours to finalize the details and coordinate logistics for your Connection Night.'
      : 'If you have any questions or would like to discuss alternative dates, please contact us at jsnook@supportworkshousing.org.'
  };

  try {
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_STATUS_TEMPLATE_ID,
      templateParams
    );
  } catch (error) {
    console.error('Error sending status update email:', error);
  }
}

// =============================================================================
// EMAIL TEMPLATES FOR EMAILJS
// =============================================================================
// Copy these templates into your EmailJS dashboard:
//
// Template 1: VOLUNTEER_CONFIRMATION
// Subject: Connection Nights Request Received - SupportWorks Housing
// Body:
/*
Hi {{volunteer_name}},

Thank you for your interest in hosting a Connection Night with SupportWorks Housing!

We've received your request with the following details:

Contact Information:
- Name: {{volunteer_name}}
- Email: {{volunteer_email}}
- Phone: {{phone}}
- Organization: {{organization}}

Event Details:
- Preferred Date: {{preferred_date}}
- Group Size: {{group_size}} people
- Additional Notes: {{notes}}

What's Next?
Someone from SupportWorks Housing will review your request and be in touch soon to confirm the details and coordinate your Connection Night experience.

If you have any immediate questions, please don't hesitate to reach out to us at jsnook@supportworkshousing.org.

Thank you for your commitment to making a difference in our community!

Warmly,
The SupportWorks Housing Team
*/
//
// Template 2: ADMIN_NOTIFICATION
// Subject: New Connection Nights Request - Action Required
// Body:
/*
New Connection Nights Request

A new Connection Nights volunteer request has been submitted and requires your review.

Volunteer Information:
- Name: {{volunteer_name}}
- Email: {{volunteer_email}}
- Phone: {{phone}}
- Organization: {{organization}}

Event Details:
- Preferred Date: {{preferred_date}}
- Group Size: {{group_size}} people
- Additional Notes: {{notes}}

Action Required:
Please review this request and take action:

APPROVE REQUEST: {{approve_link}}
DENY REQUEST: {{deny_link}}

The volunteer will automatically receive a confirmation email based on your decision.

---
SupportWorks Housing - Connection Nights Management
*/
//
// Template 3: STATUS_UPDATE
// Subject: Connection Nights Request {{status}} - SupportWorks Housing
// Body:
/*
Hi {{volunteer_name}},

{{status_message}}

Your Request Details:
- Preferred Date: {{preferred_date}}
- Group Size: {{group_size}} people
- Organization: {{organization}}
- Phone: {{phone}}

{{next_steps}}

Thank you for your interest in supporting our mission!

Best regards,
The SupportWorks Housing Team

---
This email was sent to {{volunteer_email}}
A copy has been sent to {{admin_email}}
*/
// =============================================================================
