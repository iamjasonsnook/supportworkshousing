// Vercel Serverless Function for Stripe webhook events
// This is the authoritative confirmation that a payment succeeded.
// Configure in Stripe Dashboard > Developers > Webhooks
// Events to listen for: payment_intent.succeeded
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { findOrCreatePerson } from './_people.js';

// Vercel config: disable body parsing so we can verify the raw signature
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'jsnook@supportworkshousing.org';

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
            to: [ADMIN_EMAIL],
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
        const thankYouResp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'SupportWorks Housing <donations@supportworkshousing.org>',
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
        <a href="mailto:${ADMIN_EMAIL}" style="color: #10B981;">${ADMIN_EMAIL}</a>.
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
        if (!thankYouResp.ok) {
          const thankYouResult = await thankYouResp.json();
          console.error('Thank-you email failed:', thankYouResult);
        }
      } catch (emailErr) {
        console.error('Webhook email notification failed:', emailErr.message);
      }
    }

    // ---- Bloomerang CRM ----
    // Record the donation server-side (more reliable than client-side)
    const BLOOMERANG_API_KEY = process.env.BLOOMERANG_API_KEY;
    let bloomerangTransactionId = null;
    if (!BLOOMERANG_API_KEY) {
      console.error('BLOOMERANG_API_KEY not configured');
    } else {
      try {
        const { donor_name, donor_email, donation_type, donor_phone, donor_address, donor_city, donor_state, donor_zip } = paymentIntent.metadata;
        const donorAmount = paymentIntent.amount / 100;
        const nameParts = (donor_name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const bloomerangHeaders = {
          'X-API-KEY': BLOOMERANG_API_KEY,
          'Content-Type': 'application/json',
        };

        // Find existing Bloomerang constituent by email.
        // Strategy: first check our people table for a cached bloomerang_id,
        // then search Bloomerang and verify email matches (their search is fuzzy).
        let accountId = null;

        // 1. Check if we already have a bloomerang_id cached in our people table
        if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
          try {
            const sbCheck = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
            const { data: cached } = await sbCheck
              .from('people')
              .select('bloomerang_id')
              .eq('primary_email', donor_email.toLowerCase().trim())
              .not('bloomerang_id', 'is', null)
              .limit(1)
              .maybeSingle();
            if (cached?.bloomerang_id) {
              accountId = cached.bloomerang_id;
              console.log('Bloomerang: matched via cached bloomerang_id', accountId);
            }
          } catch (e) {
            // Non-critical, fall through to search
          }
        }

        // 2. Search Bloomerang and verify email on each candidate (search is fuzzy)
        if (!accountId) {
          const searchResp = await fetch(
            `https://api.bloomerang.co/v2/constituents?search=${encodeURIComponent(donor_email)}&take=10`,
            { headers: bloomerangHeaders }
          );
          const searchData = await searchResp.json();

          for (const candidate of (searchData.Results || []).slice(0, 10)) {
            try {
              const detailResp = await fetch(
                `https://api.bloomerang.co/v2/constituent/${candidate.Id}`,
                { headers: bloomerangHeaders }
              );
              const detail = await detailResp.json();
              const primaryEmail = (detail.PrimaryEmail?.Value || '').toLowerCase();
              if (primaryEmail === donor_email.toLowerCase()) {
                accountId = candidate.Id;
                console.log('Bloomerang: matched constituent', accountId, 'by email');
                break;
              }
            } catch (lookupErr) {
              // Skip this candidate
            }
          }
        }

        // 3. No match found — create new constituent
        if (!accountId) {
          // Create new constituent with all available info
          const constituentBody = {
            Type: 'Individual',
            Status: 'Active',
            FirstName: firstName,
            LastName: lastName,
            PrimaryEmail: {
              Type: 'Home',
              Value: donor_email,
              IsPrimary: true,
            },
          };

          if (donor_phone) {
            constituentBody.PrimaryPhone = {
              Type: 'Home',
              Number: donor_phone,
              IsPrimary: true,
            };
          }

          if (donor_address) {
            constituentBody.PrimaryAddress = {
              Type: 'Home',
              Street: donor_address,
              City: donor_city || '',
              State: donor_state || '',
              PostalCode: donor_zip || '',
              Country: 'US',
              IsPrimary: true,
            };
          }

          const createResp = await fetch('https://api.bloomerang.co/v2/constituent', {
            method: 'POST',
            headers: bloomerangHeaders,
            body: JSON.stringify(constituentBody),
          });
          const newConstituent = await createResp.json();
          accountId = newConstituent.Id;
        }

        // Look up the "General Fund" ID
        let fundId = null;
        try {
          const fundsResp = await fetch(
            'https://api.bloomerang.co/v2/funds?isActive=true',
            { headers: bloomerangHeaders }
          );
          const fundsData = await fundsResp.json();
          const generalFund = (fundsData.Results || []).find(f => f.Name === 'General Fund');
          if (generalFund) {
            fundId = generalFund.Id;
          } else if (fundsData.Results && fundsData.Results.length > 0) {
            // Fall back to the first active fund
            fundId = fundsData.Results[0].Id;
            console.log('Bloomerang: no "General Fund" found, using', fundsData.Results[0].Name);
          }
        } catch (e) {
          console.error('Bloomerang fund lookup failed:', e.message);
        }

        // Record the transaction
        if (accountId && fundId) {
          const txnResp = await fetch('https://api.bloomerang.co/v2/transaction', {
            method: 'POST',
            headers: bloomerangHeaders,
            body: JSON.stringify({
              AccountId: accountId,
              Date: new Date().toISOString().split('T')[0],
              Amount: donorAmount,
              Method: 'CreditCard',
              Designations: [{
                Type: 'Donation',
                Amount: donorAmount,
                FundId: fundId,
                Note: `Online donation via website • ${donation_type || 'one-time'} • Stripe ${paymentIntent.id}`,
              }],
            }),
          });
          const txnResult = await txnResp.json();
          if (!txnResp.ok) {
            console.error('Bloomerang transaction failed:', txnResult);
          } else {
            bloomerangTransactionId = txnResult.Id || null;
            console.log('Bloomerang: recorded donation for', donor_email, '$' + donorAmount);

            // Cache bloomerang_id on our people record for faster future lookups
            if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
              try {
                const sbCache = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
                await sbCache
                  .from('people')
                  .update({ bloomerang_id: accountId })
                  .eq('primary_email', donor_email.toLowerCase().trim())
                  .is('bloomerang_id', null);
              } catch (e) {
                // Non-critical
              }
            }
          }
        } else if (!accountId) {
          console.error('Bloomerang: no accountId found for', donor_email);
        } else {
          console.error('Bloomerang: no fundId found');
        }
      } catch (bloomerangErr) {
        console.error('Bloomerang integration error:', bloomerangErr.message);
      }
    }

    // ---- Supabase ----
    // Persist donation record for admin dashboard
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        const { donor_name, donor_email, donation_type, donor_phone, donor_address } = paymentIntent.metadata;

        const { error: upsertError } = await supabase
          .from('donations')
          .upsert({
            stripe_payment_intent_id: paymentIntent.id,
            bloomerang_transaction_id: bloomerangTransactionId,
            amount: paymentIntent.amount / 100,
            donation_type: donation_type || 'one-time',
            donor_name: donor_name || 'Anonymous',
            donor_email: donor_email || '',
            donor_phone: donor_phone || null,
            donor_address: donor_address || null,
          }, { onConflict: 'stripe_payment_intent_id' });

        if (upsertError) {
          console.error('Supabase donation upsert failed:', upsertError.message);
        } else {
          console.log('Supabase: recorded donation', paymentIntent.id);
        }

        // Link to person record
        try {
          const person = await findOrCreatePerson(supabase, {
            email: donor_email,
            name: donor_name,
            phone: donor_phone,
            address: donor_address,
            city: paymentIntent.metadata.donor_city,
            state: paymentIntent.metadata.donor_state,
            zip: paymentIntent.metadata.donor_zip,
            role: 'donor',
          });

          if (person) {
            // Set person_id on the donation row
            await supabase
              .from('donations')
              .update({ person_id: person.id })
              .eq('stripe_payment_intent_id', paymentIntent.id);

            // Log interaction
            await supabase.from('interactions').insert({
              person_id: person.id,
              type: 'donation',
              subject: `$${(paymentIntent.amount / 100).toFixed(2)} ${donation_type || 'one-time'} donation`,
              metadata: {
                stripe_payment_intent_id: paymentIntent.id,
                amount: paymentIntent.amount / 100,
                donation_type: donation_type || 'one-time',
              },
              direction: 'inbound',
              created_by: 'stripe-webhook',
            });
          }
        } catch (personErr) {
          console.error('Person linking error:', personErr.message);
        }
      } catch (supabaseErr) {
        console.error('Supabase integration error:', supabaseErr.message);
      }
    }
  }

  // Acknowledge receipt of the event
  return res.status(200).json({ received: true });
}
