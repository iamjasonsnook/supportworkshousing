import { setCorsHeaders } from './_cors.js';
import { sendEmail } from './_email.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'jsnook@supportworkshousing.org';
const ACCOUNTING_EMAIL = 'accountsreceivable@supportworkshousing.org';

const getAdminNotificationEmail = (data) => {
  const donationTypeText = data.donationType === 'monthly' ? 'Monthly' : 'One-time';
  const addressLine = data.address ? `${data.address}, ${data.city}, ${data.state} ${data.zip}` : null;

  return {
    subject: `Donation Received: $${data.amount} from ${data.firstName} ${data.lastName}`,
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
          .alert-box { background-color: #FDF2F4; border-left: 4px solid #9B1B5D; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .info-row { margin: 10px 0; }
          .info-label { font-weight: 600; color: #1A1A1A; display: inline-block; min-width: 140px; vertical-align: top; }
          .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://supportworkshousing.org/images/logo-white.png" alt="SupportWorks Housing" style="display: block; margin: 0 auto 12px; height: 40px; width: auto;" />
            <h1>Donation Received</h1>
          </div>
          <div class="content">
            <div class="alert-box">
              A new donation has been processed through Stripe on the SupportWorks Housing website.
            </div>

            <h2 style="color: #9B1B5D; margin-top: 30px;">Donation Details</h2>
            <div class="info-row"><span class="info-label">Amount:</span> <strong>$${data.amount}</strong> (${donationTypeText})</div>
            <div class="info-row"><span class="info-label">Card:</span> •••• •••• •••• ${data.cardLast4} (${data.cardBrand})</div>
            <div class="info-row"><span class="info-label">Transaction ID:</span> ${data.transactionId}</div>

            <h2 style="color: #9B1B5D; margin-top: 30px;">Donor Information</h2>
            <div class="info-row"><span class="info-label">Name:</span> ${data.firstName} ${data.lastName}</div>
            <div class="info-row"><span class="info-label">Email:</span> <a href="mailto:${data.email}" style="color: #9B1B5D;">${data.email}</a></div>
            ${data.phone ? `<div class="info-row"><span class="info-label">Phone:</span> ${data.phone}</div>` : ''}
            ${addressLine ? `<div class="info-row"><span class="info-label">Address:</span> ${addressLine}</div>` : ''}
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

const getAccountingNotificationEmail = (data) => {
  const donationTypeText = data.donationType === 'monthly' ? 'Monthly' : 'One-time';
  const grossAmount = Number(data.amount);
  const stripeFee = (grossAmount * 0.022) + 0.30;
  const expectedPayout = (grossAmount - stripeFee).toFixed(2);

  return {
    subject: `Donation Payout: $${expectedPayout} expected from $${data.amount} donation`,
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
          .info-row { margin: 10px 0; }
          .info-label { font-weight: 600; color: #1A1A1A; display: inline-block; min-width: 160px; vertical-align: top; }
          .payout-box { background-color: #F0FDF4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://supportworkshousing.org/images/logo-white.png" alt="SupportWorks Housing" style="display: block; margin: 0 auto 12px; height: 40px; width: auto;" />
            <h1>Donation Payout Notification</h1>
          </div>
          <div class="content">
            <p>A new donation has been processed. Below are the details and expected payout to the operating account.</p>

            <h2 style="color: #9B1B5D; margin-top: 30px;">Payout Summary</h2>
            <div class="info-row"><span class="info-label">Donor:</span> ${data.firstName} ${data.lastName}</div>
            <div class="info-row"><span class="info-label">Donation Amount:</span> <strong>$${data.amount}</strong> (${donationTypeText})</div>
            <div class="info-row"><span class="info-label">Stripe Fee:</span> −$${stripeFee.toFixed(2)} (2.2% + $0.30)</div>

            <div class="payout-box">
              <span class="info-label">Expected Payout:</span> <strong style="color: #16a34a; font-size: 18px;">$${expectedPayout}</strong>
            </div>
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

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const data = req.body;

    // Basic validation — must have required fields from a real payment
    if (!data.transactionId || !data.amount || !data.firstName || !data.email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const adminEmail = getAdminNotificationEmail(data);
    const accountingEmail = getAccountingNotificationEmail(data);

    await Promise.all([
      sendEmail({ to: ADMIN_EMAIL, subject: adminEmail.subject, html: adminEmail.html, replyTo: data.email }),
      sendEmail({ to: ACCOUNTING_EMAIL, subject: accountingEmail.subject, html: accountingEmail.html, replyTo: ADMIN_EMAIL }),
    ]);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Donation notification error:', error);
    return res.status(500).json({ error: error.message });
  }
}
