import { describe, it, expect, vi } from 'vitest';
import { loginLocked, recordLogin, LIMITS } from '../api/_loginGuard.js';

// A stand-in for supabase-js that answers counts from a list of attempts.
function fakeDb(attempts) {
  const inserted = [];
  const from = () => {
    const f = { ip: null, failsOnly: false, since: null };
    const q = {
      select: () => q, eq: (col, v) => { if (col === 'ip') f.ip = v; if (col === 'succeeded') f.failsOnly = v === false; return q; },
      gte: (col, v) => { f.since = v; return q; },
      then: resolve => resolve({ count: attempts.filter(a => (!f.ip || a.ip === f.ip) && (!f.failsOnly || !a.succeeded) && a.at >= f.since).length, error: null }),
      insert: row => { inserted.push(row); return Promise.resolve({ error: null }); },
      delete: () => ({ lt: async () => ({ error: null }) }),
    };
    return q;
  };
  return { from, inserted };
}
const now = Date.parse('2026-11-06T20:00:00Z');
const ago = min => new Date(now - min * 60_000).toISOString();
const fails = (n, ip, min = 1) => Array.from({ length: n }, () => ({ ip, succeeded: false, at: ago(min) }));

describe('admin login lockout', () => {
  it('locks one address after 5 failures in 15 minutes', async () => {
    expect(await loginLocked(fakeDb(fails(4, '1.1.1.1')), '1.1.1.1', now)).toEqual({ locked: false });
    expect(await loginLocked(fakeDb(fails(5, '1.1.1.1')), '1.1.1.1', now)).toEqual({ locked: true, scope: 'ip' });
    expect(await loginLocked(fakeDb(fails(5, '1.1.1.1')), '2.2.2.2', now)).toEqual({ locked: false });
  });
  it('forgets failures older than 15 minutes', async () => {
    expect(await loginLocked(fakeDb(fails(9, '1.1.1.1', LIMITS.minutes + 1)), '1.1.1.1', now)).toEqual({ locked: false });
  });
  it('locks everyone after 50 failures spread across many addresses', async () => {
    const spread = Array.from({ length: 50 }, (_, i) => ({ ip: `10.0.0.${i}`, succeeded: false, at: ago(2) }));
    expect(await loginLocked(fakeDb(spread), '9.9.9.9', now)).toEqual({ locked: true, scope: 'everyone' });
  });
  it('records each attempt', async () => {
    const db = fakeDb([]);
    await recordLogin(db, '1.1.1.1', false, now);
    expect(db.inserted[0]).toEqual({ ip: '1.1.1.1', succeeded: false });
  });
});

describe('the login route', () => {
  it('refuses a locked address without even checking the password', async () => {
    vi.resetModules();
    vi.doMock('../api/_loginGuard.js', async orig => ({ ...(await orig()), loginLocked: vi.fn(async () => ({ locked: true, scope: 'ip' })), recordLogin: vi.fn(async () => {}) }));
    Object.assign(process.env, { ADMIN_PASSWORD: 'right', ADMIN_TOKEN_SECRET: 's' });
    const { default: handler } = await import('../api/admin/[...path].js');
    const res = { statusCode: 200, status(c) { this.statusCode = c; return this; }, setHeader() { return this; }, json(b) { this.body = b; return this; }, end() { return this; } };
    await handler({ method: 'POST', url: '/api/admin/login', body: { password: 'right' }, headers: { 'x-forwarded-for': '1.1.1.1' } }, res);
    expect(res.statusCode).toBe(429);
    expect(res.body.token).toBeUndefined();
    delete process.env.ADMIN_PASSWORD;
  });
});
