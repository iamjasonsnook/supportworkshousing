// Vercel Serverless Function for Stripe webhook events
// This is the authoritative confirmation that a payment succeeded.
// Configure in Stripe Dashboard > Developers > Webhooks
// Events to listen for: payment_intent.succeeded, invoice.payment_succeeded,
// invoice.payment_failed, customer.subscription.created,
// customer.subscription.updated, customer.subscription.deleted
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

    console.log('Payment confirmed via webhook:', paymentIntent.id, '$' + paymentIntent.amount / 100);

    // Supabase config — declared early so Bloomerang cache check can use it
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

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
    // Admin notification is sent client-side by Donate.jsx via EmailJS.
    // Stripe's built-in receipt_email handles donor receipt automatically.

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
        if (SUPABASE_URL && SUPABASE_SERVICE_KEY && donor_email) {
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
              console.log('Bloomerang: matched via cached bloomerang_id');
            }
          } catch (e) {
            // Non-critical, fall through to search
          }
        }

        // 2. Search Bloomerang using /constituents/search endpoint.
        // Strategy: search by email first (most precise), then by name.
        // Cross-check multiple fields to pick the best match.
        if (!accountId && donor_email) {
          try {
            // Search by email — most precise match
            const emailSearchResp = await fetch(
              `https://api.bloomerang.co/v2/constituents/search?search=${encodeURIComponent(donor_email)}&take=10`,
              { headers: bloomerangHeaders }
            );
            const emailSearchData = await emailSearchResp.json();
            const emailResults = emailSearchData.Results || [];

            // Look for exact email match in results
            for (const c of emailResults) {
              if (c.PrimaryEmail?.Value?.toLowerCase() === donor_email.toLowerCase()) {
                accountId = c.Id;
                console.log('Bloomerang: matched constituent by email search');
                break;
              }
            }

            // If no exact email match from list data, fetch details to check
            if (!accountId && emailResults.length > 0 && emailResults.length <= 5) {
              for (const c of emailResults) {
                const detail = await fetch(
                  `https://api.bloomerang.co/v2/constituent/${c.Id}`,
                  { headers: bloomerangHeaders }
                ).then(r => r.json());
                if (detail.PrimaryEmail?.Value?.toLowerCase() === donor_email.toLowerCase()) {
                  accountId = detail.Id;
                  console.log('Bloomerang: matched constituent by email (detail check)');
                  break;
                }
              }
            }
          } catch (emailSearchErr) {
            console.error('Bloomerang email search error:', emailSearchErr.message);
          }
        }

        // 3. If email search failed, try name search with multi-field verification
        if (!accountId && firstName && lastName) {
          try {
            const nameSearchResp = await fetch(
              `https://api.bloomerang.co/v2/constituents/search?search=${encodeURIComponent(firstName + ' ' + lastName)}&take=20`,
              { headers: bloomerangHeaders }
            );
            const nameSearchData = await nameSearchResp.json();
            const nameResults = nameSearchData.Results || [];

            // Filter to exact name matches
            const exactMatches = nameResults.filter(c =>
              (c.FirstName || '').toLowerCase() === firstName.toLowerCase() &&
              (c.LastName || '').toLowerCase() === lastName.toLowerCase()
            );

            if (exactMatches.length === 1) {
              accountId = exactMatches[0].Id;
              console.log('Bloomerang: matched constituent by name (unique)');
            } else if (exactMatches.length > 1) {
              // Multiple name matches — cross-check with email and phone
              console.log(`Bloomerang: ${exactMatches.length} name matches, verifying with email/phone`);
              for (const candidate of exactMatches) {
                const detail = await fetch(
                  `https://api.bloomerang.co/v2/constituent/${candidate.Id}`,
                  { headers: bloomerangHeaders }
                ).then(r => r.json());

                // Check email match
                if (detail.PrimaryEmail?.Value?.toLowerCase() === donor_email?.toLowerCase()) {
                  accountId = candidate.Id;
                  console.log('Bloomerang: matched constituent by name + email');
                  break;
                }
                // Check phone match
                if (donor_phone) {
                  const cPhone = (detail.PrimaryPhone?.Number || '').replace(/\D/g, '');
                  const dPhone = donor_phone.replace(/\D/g, '');
                  if (cPhone && dPhone && cPhone === dPhone) {
                    accountId = candidate.Id;
                    console.log('Bloomerang: matched constituent by name + phone');
                    break;
                  }
                }
              }
              // Fallback to first exact name match
              if (!accountId) {
                accountId = exactMatches[0].Id;
                console.log('Bloomerang: using first name match (multiple found)');
              }
            }
          } catch (nameSearchErr) {
            console.error('Bloomerang name search error:', nameSearchErr.message);
          }
        }

        // 4. No match found — create new constituent
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
        // Bloomerang fund ID 13317 = Unrestricted Fund (general giving)
        const fundId = 13317;

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
            console.log('Bloomerang: recorded donation $' + donorAmount);

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
          console.error('Bloomerang: no accountId found');
        } else {
          console.error('Bloomerang: no fundId found');
        }
      } catch (bloomerangErr) {
        console.error('Bloomerang integration error:', bloomerangErr.message);
      }
    }

    // ---- Supabase ----
    // Persist donation record for admin dashboard
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

  // ---- Subscription events for monthly donations ----

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object;
    // Only handle subscription invoices (not one-off invoices)
    if (invoice.subscription && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        const metadata = invoice.subscription_details?.metadata || invoice.metadata || {};
        const donorName = metadata.donor_name || 'Anonymous';
        const donorEmail = metadata.donor_email || invoice.customer_email || '';
        const amount = invoice.amount_paid / 100;

        // Upsert donation record
        await supabase.from('donations').upsert({
          stripe_payment_intent_id: invoice.payment_intent,
          amount,
          donation_type: 'monthly',
          donor_name: donorName,
          donor_email: donorEmail,
          donor_phone: metadata.donor_phone || null,
          donor_address: metadata.donor_address || null,
        }, { onConflict: 'stripe_payment_intent_id' });

        // Link to recurring_donation
        const { data: recurring } = await supabase
          .from('recurring_donations')
          .select('id, person_id')
          .eq('stripe_subscription_id', invoice.subscription)
          .maybeSingle();

        if (recurring) {
          await supabase.from('donations')
            .update({ recurring_donation_id: recurring.id, person_id: recurring.person_id })
            .eq('stripe_payment_intent_id', invoice.payment_intent);

          // Log interaction
          if (recurring.person_id) {
            await supabase.from('interactions').insert({
              person_id: recurring.person_id,
              type: 'donation',
              subject: `$${amount.toFixed(2)} monthly donation (recurring)`,
              metadata: { stripe_payment_intent_id: invoice.payment_intent, amount, donation_type: 'monthly' },
              direction: 'inbound',
              created_by: 'stripe-webhook',
            });
          }
        } else {
          // Try person linking by email
          const person = await findOrCreatePerson(supabase, {
            email: donorEmail, name: donorName,
            phone: metadata.donor_phone, role: 'donor',
          });
          if (person) {
            await supabase.from('donations')
              .update({ person_id: person.id })
              .eq('stripe_payment_intent_id', invoice.payment_intent);
          }
        }

        console.log('Subscription invoice recorded:', invoice.id);
      } catch (err) {
        console.error('invoice.payment_succeeded error:', err.message);
      }
    }
  }

  if (event.type === 'customer.subscription.created') {
    const subscription = event.data.object;
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        const metadata = subscription.metadata || {};
        const amount = subscription.items?.data?.[0]?.price?.unit_amount
          ? subscription.items.data[0].price.unit_amount / 100
          : 0;

        // Find person by email
        const donorEmail = metadata.donor_email || '';
        let personId = null;
        if (donorEmail) {
          const person = await findOrCreatePerson(supabase, {
            email: donorEmail,
            name: metadata.donor_name,
            phone: metadata.donor_phone,
            role: 'donor',
          });
          if (person) {
            personId = person.id;
            // Store stripe_customer_id on person
            await supabase.from('people')
              .update({ stripe_customer_id: subscription.customer })
              .eq('id', person.id);
          }
        }

        await supabase.from('recurring_donations').insert({
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer,
          person_id: personId,
          amount,
          frequency: 'monthly',
          status: 'active',
        });

        console.log('Recurring donation created:', subscription.id);
      } catch (err) {
        console.error('customer.subscription.created error:', err.message);
      }
    }
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object;
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        const statusMap = {
          active: 'active',
          past_due: 'past_due',
          canceled: 'cancelled',
          incomplete: 'incomplete',
          incomplete_expired: 'cancelled',
          trialing: 'active',
          unpaid: 'past_due',
          paused: 'paused',
        };
        await supabase.from('recurring_donations')
          .update({ status: statusMap[subscription.status] || subscription.status })
          .eq('stripe_subscription_id', subscription.id);

        console.log('Recurring donation updated:', subscription.id, subscription.status);
      } catch (err) {
        console.error('customer.subscription.updated error:', err.message);
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        await supabase.from('recurring_donations')
          .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subscription.id);

        console.log('Recurring donation cancelled:', subscription.id);
      } catch (err) {
        console.error('customer.subscription.deleted error:', err.message);
      }
    }
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object;
    if (invoice.subscription && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        await supabase.from('recurring_donations')
          .update({ status: 'past_due' })
          .eq('stripe_subscription_id', invoice.subscription);

        console.log('Recurring donation past_due:', invoice.subscription);
      } catch (err) {
        console.error('invoice.payment_failed error:', err.message);
      }
    }
  }

  // Acknowledge receipt of the event
  return res.status(200).json({ received: true });
}
