// Vercel Serverless Function for recording donations in Bloomerang CRM
import { setCorsHeaders } from './_cors.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      paymentIntentId,
      amount,
      donationType,
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      state,
      zip,
    } = req.body;

    // ---- Bloomerang CRM Integration (TBD) ----
    // When the Bloomerang API details are available, uncomment and configure:
    //
    // const BLOOMERANG_API_KEY = process.env.BLOOMERANG_API_KEY;
    // const response = await fetch('https://api.bloomerang.co/v2/transactions', {
    //   method: 'POST',
    //   headers: {
    //     'X-API-KEY': BLOOMERANG_API_KEY,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     AccountId: <looked up or created>,
    //     Date: new Date().toISOString(),
    //     Amount: amount,
    //     Method: 'CreditCard',
    //     Fund: 'General',
    //     // ...additional fields TBD
    //   }),
    // });

    console.log('Donation recorded (Bloomerang integration pending):', {
      paymentIntentId,
      amount,
      donationType,
      donor: `${firstName} ${lastName}`,
      email,
    });

    return res.status(200).json({
      success: true,
      message: 'Donation recorded (Bloomerang integration pending)',
    });
  } catch (error) {
    console.error('Record donation error:', error);
    return res.status(500).json({
      error: 'Failed to record donation',
      details: error.message,
    });
  }
}
