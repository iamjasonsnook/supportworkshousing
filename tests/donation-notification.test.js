import { describe, it, expect, vi, beforeEach } from 'vitest';

const retrieve = vi.fn();
vi.mock('stripe', () => ({ default: class { constructor() { this.paymentIntents = { retrieve }; } } }));
vi.mock('../api/_email.js', () => ({ sendEmail: vi.fn(async () => ({})) }));
vi.mock('../api/_rateLimit.js', () => ({ checkRateLimit: vi.fn(() => true) }));
const { sendEmail } = await import('../api/_email.js');
const { default: handler } = await import('../api/send-donation-notification.js');

function call(body) {
  const res = { statusCode: 200, body: null, setHeader() {}, status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; }, end() { return this; } };
  return handler({ method: 'POST', headers: {}, body, socket: {} }, res).then(() => res);
}
const now = Math.floor(Date.now() / 1000);
const realPayment = {
  status: 'succeeded', created: now - 30, amount_received: 5000,
  metadata: { donor_email: 'donor@example.org', donor_name: 'Ada Lovelace', donation_type: 'one-time' },
  payment_method: { card: { brand: 'visa', last4: '4242' } },
};
const request = { amount: '50', donationType: 'one-time', firstName: 'Ada', lastName: 'Lovelace',
  email: 'donor@example.org', transactionId: 'pi_real123', cardBrand: 'Visa', cardLast4: '4242' };

describe('card donation notifications', () => {
  beforeEach(() => { sendEmail.mockClear(); retrieve.mockReset(); process.env.STRIPE_SECRET_KEY = 'sk_test_x'; });

  it('a real payment sends the staff, accounting and donor emails', async () => {
    retrieve.mockResolvedValue(realPayment);
    const res = await call(request);
    expect(res.statusCode).toBe(200);
    expect(sendEmail.mock.calls.map(c => c[0].to).sort()).toEqual(
      ['accountsreceivable@supportworkshousing.org', 'donor@example.org', 'jsnook@supportworkshousing.org']);
  });

  it('a payment Stripe does not know sends nothing at all', async () => {
    retrieve.mockRejectedValue(Object.assign(new Error('No such payment_intent'), { statusCode: 404 }));
    const res = await call({ ...request, transactionId: 'pi_fake999' });
    expect(res.statusCode).toBe(400);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('an inflated amount or an unpaid intent sends nothing', async () => {
    retrieve.mockResolvedValue(realPayment);
    expect((await call({ ...request, amount: '5000' })).statusCode).toBe(400);
    retrieve.mockResolvedValue({ ...realPayment, status: 'requires_payment_method' });
    expect((await call(request)).statusCode).toBe(400);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('uses Stripe for the amount and donor email, and escapes request text', async () => {
    retrieve.mockResolvedValue(realPayment);
    await call({ ...request, email: 'someone-else@example.org', firstName: '<img src=x>' });
    const staff = sendEmail.mock.calls.find(c => c[0].to === 'jsnook@supportworkshousing.org')[0];
    expect(staff.html).toContain('donor@example.org');
    expect(staff.html).not.toContain('someone-else@example.org');
    expect(staff.html).not.toContain('<img src=x>');
    expect(sendEmail.mock.calls.some(c => c[0].to === 'someone-else@example.org')).toBe(false);
  });

  it('refuses to send when Stripe is not configured', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    expect((await call(request)).statusCode).toBe(500);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
