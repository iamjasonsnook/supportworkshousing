// Vercel Serverless Function for sending emails via Resend
import { setCorsHeaders } from './_cors.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL || 'jsnook@supportworkshousing.org';

  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
  }

  try {
    const { type } = req.body;

    let htmlContent, subject, replyTo;

    if (type === 'supply-drive') {
      const { contactName, contactEmail, contactPhone, location, address, dateTime, items, otherItems } = req.body;

      replyTo = contactEmail;
      subject = `Supply Drive Drop-Off: ${contactName} - ${dateTime}`;

      const itemsList = items.map(item => `<li style="padding: 4px 0;">${item}</li>`).join('');

      htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff;">
    <div style="background-color: #9B1B5D; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">Supply Drive Drop-Off</h1>
    </div>
    <div style="padding: 24px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; font-size: 14px; width: 110px;">Contact</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px;">
            <strong>${contactName}</strong><br>
            <a href="mailto:${contactEmail}" style="color: #9B1B5D;">${contactEmail}</a><br>
            ${contactPhone}
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; font-size: 14px;">Date & Time</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px;">${dateTime}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; font-size: 14px;">Location</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px;">${location}<br><span style="color: #666;">${address}</span></td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #666; font-size: 14px; vertical-align: top;">Items</td>
          <td style="padding: 12px 0; font-size: 14px;">
            <ul style="margin: 0; padding-left: 20px;">${itemsList}</ul>
            ${otherItems ? `<p style="margin-top: 8px; color: #666;"><em>Other: ${otherItems}</em></p>` : ''}
          </td>
        </tr>
      </table>
    </div>
    <div style="padding: 16px; text-align: center; background-color: #f9f9f9; border-top: 1px solid #eee;">
      <p style="margin: 0; font-size: 12px; color: #999;">SupportWorks Housing &bull; Supply Drives</p>
    </div>
  </div>
</body>
</html>`;

    } else {
      // Connection Night (default)
      const { groupName, dateTime, location, address, contactName, contactEmail, contactPhone, groupSize, foodPlan, activity } = req.body;

      replyTo = contactEmail;
      subject = `Connection Night Request: ${groupName} - ${dateTime}`;

      htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff;">
    <div style="background-color: #9B1B5D; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">Connection Night Request</h1>
    </div>
    <div style="padding: 24px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; font-size: 14px; width: 110px;">Group</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px; font-weight: 600;">${groupName}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; font-size: 14px;">Date & Time</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px;">${dateTime}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; font-size: 14px;">Location</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px;">${location}<br><span style="color: #666;">${address}</span></td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; font-size: 14px;">Contact</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px;">
            ${contactName}<br>
            <a href="mailto:${contactEmail}" style="color: #9B1B5D;">${contactEmail}</a><br>
            ${contactPhone}
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; font-size: 14px;">Group Size</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px;">${groupSize} people</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; font-size: 14px;">Food Plan</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px;">${foodPlan}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #666; font-size: 14px;">Activity</td>
          <td style="padding: 12px 0; font-size: 14px;">${activity}</td>
        </tr>
      </table>
    </div>
    <div style="padding: 16px; text-align: center; background-color: #f9f9f9; border-top: 1px solid #eee;">
      <p style="margin: 0; font-size: 12px; color: #999;">SupportWorks Housing &bull; Connection Nights</p>
    </div>
  </div>
</body>
</html>`;
    }

    // Build receipt email for the submitter
    let receiptHtml, receiptSubject;

    if (type === 'supply-drive') {
      const { contactName, contactEmail, contactPhone, location, address, dateTime, items, otherItems } = req.body;
      const itemsList = items.map(item => `<li style="padding: 4px 0;">${item}</li>`).join('');

      receiptSubject = 'Thank You for Your Supply Drive Donation!';
      receiptHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff;">
    <div style="background-color: #9B1B5D; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">Thank You!</h1>
    </div>
    <div style="padding: 24px;">
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #333; line-height: 1.6;">
        Dear ${contactName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #333; line-height: 1.6;">
        Thank you for scheduling a supply drop-off! We've received your submission. Someone from our team will be in contact soon to confirm details and coordinate your drop-off.
      </p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; font-size: 14px; width: 110px;">Date & Time</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px;">${dateTime}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; font-size: 14px;">Location</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px;">${location}<br><span style="color: #666;">${address}</span></td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #666; font-size: 14px; vertical-align: top;">Items</td>
          <td style="padding: 12px 0; font-size: 14px;">
            <ul style="margin: 0; padding-left: 20px;">${itemsList}</ul>
            ${otherItems ? `<p style="margin-top: 8px; color: #666;"><em>Other: ${otherItems}</em></p>` : ''}
          </td>
        </tr>
      </table>
      <p style="margin: 16px 0 0 0; font-size: 14px; color: #333; line-height: 1.6;">
        If you have any questions, please contact us at
        <a href="mailto:jsnook@supportworkshousing.org" style="color: #9B1B5D;">jsnook@supportworkshousing.org</a>.
      </p>
    </div>
    <div style="padding: 20px 24px; background-color: #9B1B5D; color: #ffffff;">
      <p style="margin: 0 0 12px 0; font-size: 13px; line-height: 1.5; text-align: center;">
        SupportWorks Housing provides stable, affordable housing combined with comprehensive support services to help Virginians rebuild their lives and achieve lasting independence.
      </p>
      <p style="margin: 0; font-size: 12px; text-align: center; opacity: 0.8;">
        SupportWorks Housing &bull; <a href="https://supportworkshousing.org" style="color: #ffffff;">supportworkshousing.org</a>
      </p>
    </div>
  </div>
</body>
</html>`;
    } else {
      // Connection Night receipt
      const { groupName, dateTime, location, address, contactName, contactEmail, contactPhone, groupSize, foodPlan, activity } = req.body;

      receiptSubject = 'Thank You for Your Connection Night Request!';
      receiptHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff;">
    <div style="background-color: #9B1B5D; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">Thank You!</h1>
    </div>
    <div style="padding: 24px;">
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #333; line-height: 1.6;">
        Dear ${contactName},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #333; line-height: 1.6;">
        Thank you for your interest in hosting a Connection Night! We've received your request. Someone from our team will be in contact soon to confirm details and next steps.
      </p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; font-size: 14px; width: 110px;">Group</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px; font-weight: 600;">${groupName}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; font-size: 14px;">Date & Time</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px;">${dateTime}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; font-size: 14px;">Location</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px;">${location}<br><span style="color: #666;">${address}</span></td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; font-size: 14px;">Group Size</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px;">${groupSize} people</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; font-size: 14px;">Food Plan</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px;">${foodPlan}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #666; font-size: 14px;">Activity</td>
          <td style="padding: 12px 0; font-size: 14px;">${activity}</td>
        </tr>
      </table>
      <p style="margin: 16px 0 0 0; font-size: 14px; color: #333; line-height: 1.6;">
        If you have any questions, please contact us at
        <a href="mailto:jsnook@supportworkshousing.org" style="color: #9B1B5D;">jsnook@supportworkshousing.org</a>.
      </p>
    </div>
    <div style="padding: 20px 24px; background-color: #9B1B5D; color: #ffffff;">
      <p style="margin: 0 0 12px 0; font-size: 13px; line-height: 1.5; text-align: center;">
        SupportWorks Housing provides stable, affordable housing combined with comprehensive support services to help Virginians rebuild their lives and achieve lasting independence.
      </p>
      <p style="margin: 0; font-size: 12px; text-align: center; opacity: 0.8;">
        SupportWorks Housing &bull; <a href="https://supportworkshousing.org" style="color: #ffffff;">supportworkshousing.org</a>
      </p>
    </div>
  </div>
</body>
</html>`;
    }

    // Send admin notification via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SupportWorks Housing <noreply@supportworkshousing.org>',
        to: RECIPIENT_EMAIL,
        reply_to: replyTo,
        subject: subject,
        html: htmlContent,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend admin email error:', result);
      return res.status(500).json({ error: result.message || 'Failed to send email' });
    }

    // Send receipt email to submitter (non-blocking — don't fail if this errors)
    const { contactEmail } = req.body;
    if (contactEmail) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'SupportWorks Housing <noreply@supportworkshousing.org>',
            to: [contactEmail],
            subject: receiptSubject,
            html: receiptHtml,
          }),
        });
      } catch (receiptErr) {
        console.error('Receipt email failed (non-blocking):', receiptErr);
      }
    }

    return res.status(200).json({ success: true, id: result.id });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
