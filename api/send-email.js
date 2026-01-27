// Vercel Serverless Function for sending emails via Resend
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL || 'jsnook@supportworkshousing.org';

  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
  }

  try {
    const {
      groupName,
      dateTime,
      location,
      contactName,
      contactEmail,
      contactPhone,
      groupSize,
      foodPlan,
      activity,
    } = req.body;

    // Build branded HTML email
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background-color: #9B1B5D; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">Connection Night Request</h1>
    </div>

    <!-- Content -->
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
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px;">${location}</td>
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

      <!-- Action Buttons -->
      <div style="margin-top: 28px; text-align: center;">
        <a href="mailto:${contactEmail}?subject=${encodeURIComponent(`Approved: Connection Night - ${dateTime}`)}&body=${encodeURIComponent(`Hi ${contactName},\n\nGreat news! Your Connection Night request has been approved.\n\nDetails:\n- Date & Time: ${dateTime}\n- Location: ${location}\n\nWe look forward to seeing you!\n\nBest,\nSupportWorks Housing`)}"
           style="display: inline-block; background-color: #22c55e; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin-right: 12px;">
          Approve
        </a>
        <a href="mailto:${contactEmail}?subject=${encodeURIComponent(`Update: Connection Night Request - ${dateTime}`)}&body=${encodeURIComponent(`Hi ${contactName},\n\nThank you for your interest in hosting a Connection Night. Unfortunately, we are unable to accommodate your request for ${dateTime}.\n\nPlease feel free to submit another request for a different date.\n\nBest,\nSupportWorks Housing`)}"
           style="display: inline-block; background-color: #ef4444; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
          Deny
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding: 16px; text-align: center; background-color: #f9f9f9; border-top: 1px solid #eee;">
      <p style="margin: 0; font-size: 12px; color: #999;">
        SupportWorks Housing &bull; ${new Date().toLocaleDateString()}
      </p>
    </div>
  </div>
</body>
</html>`;

    // Send via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SupportWorks Housing <onboarding@resend.dev>',
        to: RECIPIENT_EMAIL,
        reply_to: contactEmail,
        subject: `Connection Night Request: ${groupName} - ${dateTime}`,
        html: htmlContent,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend error:', result);
      return res.status(500).json({ error: result.message || 'Failed to send email' });
    }

    return res.status(200).json({ success: true, id: result.id });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
