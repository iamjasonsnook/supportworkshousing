import { describe, it, expect, vi } from 'vitest';
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }));
const { donorDetails, invoiceSubscriptionId, invoicePaymentIntentId, bloomerangGiftAlreadyLogged, pickAmongNameMatches, sameNameEmail } = await import('../api/stripe-webhook.js');

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

describe('repeat deliveries from Stripe', () => {
  const sb = row => ({ from: () => { const q = { select: () => q, eq: () => q, not: () => q, maybeSingle: async () => ({ data: row }) }; return q; } });
  it('knows a payment already has a Bloomerang gift, so it is not logged twice', async () => {
    expect(await bloomerangGiftAlreadyLogged(sb({ bloomerang_transaction_id: 44008449 }), 'pi_1')).toBe(44008449);
    expect(await bloomerangGiftAlreadyLogged(sb(null), 'pi_1')).toBe(null);
    expect(await bloomerangGiftAlreadyLogged(null, 'pi_1')).toBe(null);
  });
});

describe('donors who share a name', () => {
  const people = { 1: { PrimaryEmail: { Value: 'other@x.org' }, PrimaryPhone: { Number: '804-555-0000' } }, 2: { PrimaryEmail: { Value: 'grace@x.org' } } };
  const getDetail = async id => people[id];
  const matches = [{ Id: 1, FirstName: 'Grace', LastName: 'Smith' }, { Id: 2, FirstName: 'Grace', LastName: 'Smith' }];
  it('picks the record whose email or phone agrees', async () => {
    expect(await pickAmongNameMatches(matches, { email: 'GRACE@x.org' }, getDetail)).toEqual({ id: 2, by: 'email' });
    expect(await pickAmongNameMatches(matches, { phone: '(804) 555-0000' }, getDetail)).toEqual({ id: 1, by: 'phone' });
  });
  it('never guesses: no agreement means no pick', async () => {
    expect(await pickAmongNameMatches(matches, { email: 'new@x.org', phone: '804-555-9999' }, getDetail)).toBe(null);
  });
  it('tells staff which records to check, safely', () => {
    const { subject, html } = sameNameEmail({ donorName: 'Grace <b>Smith</b>', amount: 50, paymentIntentId: 'pi_1', newAccountId: 99, matches });
    expect(subject).toContain('new record created');
    expect(html).toContain('Grace &lt;b&gt;Smith&lt;/b&gt;');
    expect(html).toContain('(ID 1)');
    expect(html).toContain('(ID 2)');
  });
});
