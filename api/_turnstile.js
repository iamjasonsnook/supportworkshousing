// Cloudflare Turnstile: a bot check on the public donate and stock pledge
// forms (card testing, junk pledges). The leading underscore keeps this file
// from becoming a Vercel function (the plan allows 12).
//
// Off until TURNSTILE_SECRET_KEY is set in Vercel (and the browser has
// VITE_TURNSTILE_SITE_KEY); from then on a missing or failed check is refused.

export const turnstileOn = () => !!process.env.TURNSTILE_SECRET_KEY;

export async function verifyHuman(token, ip, fetchImpl = fetch) {
  if (!turnstileOn()) return { ok: true, skipped: true };
  if (!token || typeof token !== 'string' || token.length > 2048) return { ok: false };
  try {
    const res = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY, response: token, ...(ip && ip !== 'unknown' ? { remoteip: ip } : {}) }),
    });
    const d = await res.json();
    return { ok: !!d.success };
  } catch (e) {
    // Cloudflare unreachable: let the person through rather than lose a gift;
    // the other limits (rate limit, review step, Stripe Radar) still apply.
    console.error('Turnstile check failed to run:', e.message);
    return { ok: true, unchecked: true };
  }
}
