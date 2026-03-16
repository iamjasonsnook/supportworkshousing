// Vercel Serverless Function for creating Stripe PaymentIntents
import Stripe from 'stripe';
import { setCorsHeaders } from './_cors.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

  if (!STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured' });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY);

  try {
    const { amount, donationType, email, name, phone, address, city, state, zip } = req.body;

    // Validate required fields
    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    if (!donationType || !['one-time', 'monthly'].includes(donationType)) {
      return res.status(400).json({ error: 'Invalid donation type' });
    }

    // Validate amount: must be a positive number, at least $1, no more than $50,000
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 1) {
      return res.status(400).json({ error: 'Minimum donation is $1.00' });
    }
    if (parsedAmount > 50000) {
      return res.status(400).json({ error: 'For donations over $50,000, please contact us directly' });
    }

    const cents = Math.round(parsedAmount * 100);

    const donorMetadata = {
      donation_type: donationType,
      donor_name: name,
      donor_email: email,
      donor_phone: phone || '',
      donor_address: address || '',
      donor_city: city || '',
      donor_state: state || '',
      donor_zip: zip || '',
    };

    // Monthly donations use Stripe Subscriptions for true recurring billing
    if (donationType === 'monthly') {
      const STRIPE_MONTHLY_PRODUCT_ID = process.env.STRIPE_MONTHLY_PRODUCT_ID;
      if (!STRIPE_MONTHLY_PRODUCT_ID) {
        return res.status(500).json({ error: 'Monthly donation product not configured' });
      }

      // Find or create Stripe Customer by email
      const existingCustomers = await stripe.customers.list({ email, limit: 1 });
      let customerId;
      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email,
          name,
          phone: phone || undefined,
          address: address ? { line1: address, city: city || '', state: state || '', postal_code: zip || '' } : undefined,
          metadata: donorMetadata,
        });
        customerId = customer.id;
      }

      // Create Subscription with incomplete initial payment
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price_data: {
            currency: 'usd',
            product: STRIPE_MONTHLY_PRODUCT_ID,
            unit_amount: cents,
            recurring: { interval: 'month' },
          },
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: donorMetadata,
      });

      return res.status(200).json({
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        subscriptionId: subscription.id,
        paymentIntentId: subscription.latest_invoice.payment_intent.id,
      });
    }

    // One-time donations use PaymentIntent
    const paymentIntentParams = {
      amount: cents,
      currency: 'usd',
      receipt_email: email,
      description: 'Thank you for your donation to SupportWorks Housing!',
      metadata: donorMetadata,
    };

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Stripe error:', error);
    return res.status(500).json({
      error: 'Failed to create payment intent',
      details: error.message,
    });
  }
}
