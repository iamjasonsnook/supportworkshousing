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
    const { amount, donationType, email, name } = req.body;

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

    const paymentIntentParams = {
      amount: cents,
      currency: 'usd',
      receipt_email: email,
      metadata: {
        donation_type: donationType,
        donor_name: name,
        donor_email: email,
      },
    };

    // For monthly donations, save the card for future charges
    if (donationType === 'monthly') {
      paymentIntentParams.setup_future_usage = 'off_session';
      paymentIntentParams.metadata.recurring = 'monthly';
    }

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
