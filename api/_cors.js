// Shared CORS configuration for all API endpoints
const ALLOWED_ORIGINS = [
  'https://supportworkshousing.org',
  'https://www.supportworkshousing.org',
];

// Allow localhost in development (VERCEL_ENV is set automatically by Vercel)
if (process.env.VERCEL_ENV !== 'production') {
  ALLOWED_ORIGINS.push('http://localhost:5173', 'http://localhost:3000');
}

export function setCorsHeaders(req, res) {
  const origin = req.headers.origin;

  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
