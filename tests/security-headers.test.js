import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import crypto from 'node:crypto';

const vercel = JSON.parse(fs.readFileSync(new URL('../vercel.json', import.meta.url)));
const all = vercel.headers.find(h => h.source === '/(.*)').headers;
const header = name => all.find(h => h.key === name)?.value;

describe('security headers (vercel.json)', () => {
  it('sends the standard protections on every page', () => {
    expect(header('X-Frame-Options')).toBe('SAMEORIGIN'); // same-origin: the check review page frames its own scan
    expect(header('X-Content-Type-Options')).toBe('nosniff');
    expect(header('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(header('Permissions-Policy')).toContain('camera=()');
  });

  it('keeps the admin area out of search engines', () => {
    for (const src of ['/admin', '/api/admin/(.*)']) {
      expect(vercel.headers.find(h => h.source === src).headers).toContainEqual({ key: 'X-Robots-Tag', value: 'noindex, nofollow' });
    }
  });

  // The policy allows the one inline script (Google Analytics setup) by its
  // hash. Editing that script changes the hash: update vercel.json with it.
  it('allows every inline script in index.html by its exact hash', () => {
    const csp = header('Content-Security-Policy') || header('Content-Security-Policy-Report-Only');
    const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)].filter(m => !/ld\+json/.test(m[1]));
    expect(inline.length).toBeGreaterThan(0);
    for (const [, , body] of inline) {
      const hash = crypto.createHash('sha256').update(body).digest('base64');
      expect(csp).toContain(`'sha256-${hash}'`);
    }
  });

  it('lets Stripe, Analytics and the bot check load, and nothing frames the site from elsewhere', () => {
    const csp = header('Content-Security-Policy') || header('Content-Security-Policy-Report-Only');
    for (const src of ['https://js.stripe.com', 'https://api.stripe.com', 'https://hooks.stripe.com', 'https://www.googletagmanager.com', 'https://challenges.cloudflare.com', 'https://fonts.googleapis.com', 'https://fonts.gstatic.com']) expect(csp).toContain(src);
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toContain("'unsafe-eval'");
  });
});
