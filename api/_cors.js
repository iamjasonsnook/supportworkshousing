// Shared CORS configuration for all API endpoints
const ALLOWED_ORIGINS = [
  'https://iamjasonsnook.github.io',
  'https://supportworkshousing.vercel.app',
  'https://supportworkshousing.org',
  'https://www.supportworkshousing.org',
];

// Allow localhost in development
if (process.env.NODE_ENV !== 'production') {
  ALLOWED_ORIGINS.push('http://localhost:5173', 'http://localhost:3000');
}

export function setCorsHeaders(req, res) {
  const origin = req.headers.origin;

  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
