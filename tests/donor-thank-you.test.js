import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../api/_email.js', () => ({ sendEmail: vi.fn(async () => ({})) }));
vi.mock('../api/_rateLimit.js', () => ({ checkRateLimit: vi.fn(() => true) }));
const { verifiedDonation, donorThankYouEmail } = await import('../api/send-donation-notification.js');

const now = Math.floor(Date.now() / 1000);
const fakeStripe = pi => ({ paymentIntents: { retrieve: vi.fn(async () => pi) } });
const onetime = {
  status: 'succeeded', created: now - 60, amount_received: 5000, receipt_email: 'donor@example.org',
  metadata: { donor_email: 'donor@example.org', donor_name: 'Ada Lovelace', donation_type: 'one-time' },
  payment_method: { card: { brand: 'visa', last4: '4242' } },
};

describe('verifiedDonation', () => {
  it('trusts Stripe for who to thank', async () => {
    const d = await verifiedDonation(fakeStripe(onetime), 'pi_123', '50');
    expect(d).toMatchObject({ email: 'donor@example.org', firstName: 'Ada', amount: 50, monthly: false, cardBrand: 'Visa', cardLast4: '4242' });
  });

  it('finds a monthly donor through the Stripe customer', async () => {
    const monthly = { ...onetime, metadata: {}, receipt_email: null, customer: { email: 'm@example.org', name: 'Grace Hopper', metadata: { donation_type: 'monthly' } } };
    expect(await verifiedDonation(fakeStripe(monthly), 'pi_456', 50)).toMatchObject({ email: 'm@example.org', firstName: 'Grace', monthly: true });
  });

  it('refuses anything Stripe does not back up', async () => {
    expect(await verifiedDonation(fakeStripe(onetime), 'not-an-id', 50)).toBeNull();
    expect(await verifiedDonation(fakeStripe({ ...onetime, status: 'requires_payment_method' }), 'pi_1', 50)).toBeNull();
    expect(await verifiedDonation(fakeStripe(onetime), 'pi_1', 5000)).toBeNull();
    expect(await verifiedDonation(fakeStripe({ ...onetime, created: now - 3 * 86400 }), 'pi_1', 50)).toBeNull();
  });
});

describe('donorThankYouEmail', () => {
  it('thanks, states the gift and carries the tax acknowledgment', () => {
    const { subject, html } = donorThankYouEmail({ email: 'x', firstName: 'Ada', amount: 50, monthly: true, date: new Date('2026-10-28T14:00:00Z'), cardBrand: 'Visa', cardLast4: '4242' });
    expect(subject).toBe('Thank you for your gift to SupportWorks Housing');
    expect(html).toContain('Dear Ada,');
    expect(html).toContain('Your generous gift will help us end homelessness in your community.');
    expect(html).toContain('$50.00 per month');
    expect(html).toContain('Visa ending in 4242');
    expect(html).toContain('EIN 54-1444564');
    expect(html).toContain('No goods or services were provided');
    expect(html).not.toContain('—');
  });

  it('escapes the name Stripe holds', () => {
    const { html } = donorThankYouEmail({ firstName: '<b>x</b>', amount: 5, monthly: false, date: new Date() });
    expect(html).not.toContain('<b>x</b>');
  });
});
