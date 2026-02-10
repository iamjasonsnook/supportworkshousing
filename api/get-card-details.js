// Vercel Serverless Function for retrieving card details after payment
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
    const { paymentMethodId } = req.body;
    if (!paymentMethodId) {
      return res.status(400).json({ error: 'paymentMethodId is required' });
    }

    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);

    return res.status(200).json({
      last4: pm.card?.last4 || null,
      brand: pm.card?.brand || null,
    });
  } catch (error) {
    console.error('Get card details error:', error);
    return res.status(500).json({ error: 'Failed to retrieve card details' });
  }
}
