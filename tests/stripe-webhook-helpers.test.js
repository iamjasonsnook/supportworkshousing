import { describe, it, expect, vi } from 'vitest';
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }));
const { donorDetails, invoiceSubscriptionId, invoicePaymentIntentId } = await import('../api/stripe-webhook.js');

const stripeWith = ({ customer, payments }) => ({
  customers: { retrieve: vi.fn(async () => customer) },
  invoicePayments: { list: vi.fn(async () => ({ data: payments || [] })) },
});

describe('donorDetails', () => {
  it('uses the payment\'s own details for one-time gifts', async () => {
    const md = { donor_email: 'a@x.org', donor_name: 'A B', donation_type: 'one-time' };
    expect(await donorDetails(stripeWith({}), { metadata: md, customer: 'cus_1' })).toBe(md);
  });
  it('falls back to the Stripe customer for monthly charges, marked monthly', async () => {
    const s = stripeWith({ customer: { email: 'm@x.org', name: 'Mon Thly', metadata: { donor_phone: '555' } } });
    expect(await donorDetails(s, { metadata: {}, customer: 'cus_2' })).toMatchObject({ donor_email: 'm@x.org', donor_name: 'Mon Thly', donor_phone: '555', donation_type: 'monthly' });
  });
  it('returns what it has when there is no customer', async () => {
    expect(await donorDetails(stripeWith({}), { metadata: {} })).toEqual({});
  });
});

describe('invoice fields across Stripe API versions', () => {
  it('reads the subscription from old and new locations', () => {
    expect(invoiceSubscriptionId({ subscription: 'sub_old' })).toBe('sub_old');
    expect(invoiceSubscriptionId({ parent: { subscription_details: { subscription: 'sub_new' } } })).toBe('sub_new');
    expect(invoiceSubscriptionId({})).toBeNull();
  });
  it('reads the payment from the old field or the invoice\'s payments', async () => {
    expect(await invoicePaymentIntentId(stripeWith({}), { payment_intent: 'pi_old' })).toBe('pi_old');
    expect(await invoicePaymentIntentId(stripeWith({ payments: [{ payment: { payment_intent: 'pi_new' } }] }), { id: 'in_1' })).toBe('pi_new');
    expect(await invoicePaymentIntentId(stripeWith({ payments: [] }), { id: 'in_2' })).toBeNull();
  });
});
