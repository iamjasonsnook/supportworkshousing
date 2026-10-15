import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../_email.js', () => ({ sendEmail: vi.fn(async () => ({})) }));
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }));
const { sendEmail } = await import('../_email.js');
const { default: handler, everyOrgDonationEmail } = await import('./[...path].js');

const TOKEN = 'a'.repeat(64);
function call(url, body) {
  const res = { statusCode: 200, body: null, setHeader() {}, status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; }, end() { return this; } };
  return handler({ method: 'POST', url, headers: {}, body }, res).then(() => res);
}
const donation = {
  chargeId: 'ch_1', firstName: 'Jane', lastName: 'Doe', email: 'jane@example.org',
  toNonprofit: { slug: 'supportworks-housing', name: 'SupportWorks Housing' },
  amount: '1000.00', netAmount: '970.07', currency: 'USD', frequency: 'One-time',
  paymentMethod: 'stocks', donationDate: '2026-10-15T15:00:00Z', privateNote: '<script>x</script>',
};

describe('Every.org webhook', () => {
  beforeEach(() => { sendEmail.mockClear(); process.env.EVERYORG_WEBHOOK_TOKEN = TOKEN; });

  it('emails staff and accounting for a donation with the right token', async () => {
    const res = await call(`/api/admin/everyorg-webhook?token=${TOKEN}`, donation);
    expect(res.statusCode).toBe(200);
    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(sendEmail.mock.calls[0][0].subject).toBe('Every.org donation: $1,000.00 in stock from Jane Doe');
  });

  it('rejects a wrong or missing token and sends nothing', async () => {
    expect((await call('/api/admin/everyorg-webhook?token=nope', donation)).statusCode).toBe(401);
    expect((await call('/api/admin/everyorg-webhook', donation)).statusCode).toBe(401);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('refuses to run when no token is configured', async () => {
    delete process.env.EVERYORG_WEBHOOK_TOKEN;
    expect((await call(`/api/admin/everyorg-webhook?token=${TOKEN}`, donation)).statusCode).toBe(503);
  });

  it('ignores donations to another nonprofit and malformed bodies', async () => {
    const other = await call(`/api/admin/everyorg-webhook?token=${TOKEN}`, { ...donation, toNonprofit: { slug: 'someone-else' } });
    expect(other.body).toEqual({ ignored: 'different nonprofit' });
    expect((await call(`/api/admin/everyorg-webhook?token=${TOKEN}`, { hello: 1 })).statusCode).toBe(400);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('asks Every.org to retry if email fails', async () => {
    sendEmail.mockRejectedValueOnce(new Error('down'));
    expect((await call(`/api/admin/everyorg-webhook?token=${TOKEN}`, donation)).statusCode).toBe(500);
  });

  it('handles anonymous donors and escapes donor text', () => {
    const { subject, html } = everyOrgDonationEmail({ ...donation, firstName: undefined, lastName: undefined, email: undefined, paymentMethod: 'card' });
    expect(subject).toBe('Every.org donation: $1,000.00 from Anonymous (name not shared)');
    expect(html).toContain('Not shared');
    expect(html).not.toContain('<script>x</script>');
  });
});
