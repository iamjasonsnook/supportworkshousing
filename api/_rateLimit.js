// In-memory rate limiter — per IP, per endpoint, per calendar day.
// Provides meaningful protection for low-traffic serverless functions.
// Note: state is per warm Vercel instance; resets on cold start or new day.

const counts = new Map();

function todayKey(ip, endpoint) {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `${ip}|${endpoint}|${date}`;
}

// Remove entries from previous days to prevent unbounded growth
function cleanup() {
  const date = new Date().toISOString().slice(0, 10);
  for (const key of counts.keys()) {
    if (!key.endsWith(`|${date}`)) counts.delete(key);
  }
}

/**
 * Returns true if the request is allowed, false if rate limit exceeded.
 * @param {string} ip  — client IP address
 * @param {string} endpoint — identifier for the endpoint (e.g. 'connection-nights')
 * @param {number} limit — max requests per day (default 7)
 */
export function checkRateLimit(ip, endpoint, limit = 7) {
  cleanup();
  const key = todayKey(ip, endpoint);
  const count = counts.get(key) || 0;
  if (count >= limit) return false;
  counts.set(key, count + 1);
  return true;
}
