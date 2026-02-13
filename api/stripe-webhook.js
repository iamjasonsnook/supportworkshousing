// Vercel Serverless Function for Stripe webhook events
// This is the authoritative confirmation that a payment succeeded.
// Configure in Stripe Dashboard > Developers > Webhooks
// Events to listen for: payment_intent.succeeded
import Stripe from 'stripe';

// Vercel config: disable body parsing so we can verify the raw signature
export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  // Webhooks are server-to-server, no CORS needed
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    console.error('Stripe webhook keys not configured');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY);

  // Verify the webhook signature
  const rawBody = await getRawBody(req);
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;

    console.log('Payment confirmed via webhook:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      email: paymentIntent.receipt_email,
      metadata: paymentIntent.metadata,
    });

    // Retrieve card details from the payment method
    let cardLast4 = '••••';
    let cardBrand = 'Card';
    try {
      const pm = await stripe.paymentMethods.retrieve(paymentIntent.payment_method);
      if (pm?.card) {
        cardLast4 = pm.card.last4;
        cardBrand = pm.card.brand.charAt(0).toUpperCase() + pm.card.brand.slice(1);
      }
    } catch (e) {
      // Non-critical
    }

    // ---- Email notification ----
    // Send via Resend (server-side, more reliable than client-side EmailJS)
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (RESEND_API_KEY) {
      try {
        const { donor_name, donor_email, donation_type } = paymentIntent.metadata;
        const amount = (paymentIntent.amount / 100).toFixed(2);
        const typeText = donation_type === 'monthly' ? 'Monthly' : 'One-time';

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'SupportWorks Housing <donations@supportworkshousing.org>',
            to: ['jsnook@supportworkshousing.org'],
            reply_to: donor_email,
            subject: `Donation Confirmed: $${amount} from ${donor_name}`,
            html: `
              <h2>Donation Confirmed via Stripe</h2>
              <p><strong>Amount:</strong> $${amount} (${typeText})</p>
              <p><strong>Card:</strong> •••• •••• •••• ${cardLast4} (${cardBrand})</p>
              <p><strong>Donor:</strong> ${donor_name}</p>
              <p><strong>Email:</strong> ${donor_email}</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
              <p style="font-size: 12px; color: #6B7280;">🔒 Processed securely by Stripe • Transaction ID: ${paymentIntent.id}</p>
            `,
          }),
        });
        // Send donor thank-you / receipt email
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'SupportWorks Housing <noreply@supportworkshousing.org>',
            to: [donor_email],
            subject: `Thank You for Your ${typeText} Donation!`,
            html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff;">
    <div style="background-color: #10B981; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">Thank You for Your Generosity!</h1>
    </div>
    <div style="padding: 24px;">
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #333; line-height: 1.6;">
        Dear ${donor_name},
      </p>
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #333; line-height: 1.6;">
        Thank you for your ${typeText.toLowerCase()} donation of <strong>$${amount}</strong> to SupportWorks Housing. Your generosity helps us create stable communities and provide comprehensive support services to Virginians rebuilding their lives.
      </p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; font-size: 14px; width: 110px;">Amount</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px;"><strong>$${amount}</strong> (${typeText})</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666; font-size: 14px;">Card</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px;">&bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; ${cardLast4} (${cardBrand})</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #666; font-size: 14px;">Transaction</td>
          <td style="padding: 12px 0; font-size: 14px; font-size: 12px; color: #999;">${paymentIntent.id}</td>
        </tr>
      </table>
      <p style="margin: 16px 0 0 0; font-size: 14px; color: #333; line-height: 1.6;">
        If you have any questions about your donation, please contact us at
        <a href="mailto:jsnook@supportworkshousing.org" style="color: #10B981;">jsnook@supportworkshousing.org</a>.
      </p>
    </div>
    <div style="padding: 20px 24px; background-color: #10B981; color: #ffffff;">
      <p style="margin: 0 0 12px 0; font-size: 13px; line-height: 1.5; text-align: center;">
        SupportWorks Housing provides stable, affordable housing combined with comprehensive support services to help Virginians rebuild their lives and achieve lasting independence.
      </p>
      <p style="margin: 0; font-size: 12px; text-align: center; opacity: 0.8;">
        SupportWorks Housing &bull; <a href="https://supportworkshousing.org" style="color: #ffffff;">supportworkshousing.org</a>
      </p>
    </div>
  </div>
</body>
</html>`,
          }),
        });
      } catch (emailErr) {
        console.error('Webhook email notification failed:', emailErr);
        // Don't fail the webhook response for email errors
      }
    }

    // ---- Bloomerang CRM (TBD) ----
    // When ready, record the donation here instead of from the client.
    // This is more reliable since it only fires on verified payments.
  }

  // Acknowledge receipt of the event
  return res.status(200).json({ received: true });
}
