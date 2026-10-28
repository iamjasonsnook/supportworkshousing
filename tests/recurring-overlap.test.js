import { describe, it, expect, vi } from 'vitest';

vi.mock('../api/_email.js', () => ({ sendEmail: vi.fn(async () => ({})) }));
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }));
vi.mock('../api/_bloomerang.js', async (orig) => ({
  ...(await orig()),
  allChargingSchedules: vi.fn(async () => [
    { accountId: 1, amount: 51.96, frequency: 'Monthly', status: 'Active', method: 'CreditCard', since: '2023-11-15' },
    { accountId: 2, amount: 25, frequency: 'Monthly', status: 'Active', method: 'CreditCard', since: '2022-01-01' },
  ]),
  constituentContact: vi.fn(async (k, id) => (id === 1 ? { name: 'Alyssa M', email: 'Alyssa@Example.org' } : { name: 'Other', email: 'other@example.org' })),
}));
const { isChargingSchedule } = await import('../api/_bloomerang.js');
const { findRecurringOverlaps, overlapEmail } = await import('../api/admin/[...path].js');
const { legacyRecurringHtml } = await import('../api/send-donation-notification.js');

const stripeWith = subs => ({ subscriptions: { list: () => ({ async *[Symbol.asyncIterator]() { yield* subs; } }) } });
const sched = (status, method) => ({ Method: method, Designations: [{ Type: 'RecurringDonation', RecurringDonationStatus: status }] });

describe('which Bloomerang schedules still charge', () => {
  it('counts active or overdue card and bank schedules only', () => {
    expect(isChargingSchedule(sched('Active', 'CreditCard'))).toBe(true);
    expect(isChargingSchedule(sched('Overdue', 'Eft'))).toBe(true);
    expect(isChargingSchedule(sched('Closed', 'CreditCard'))).toBe(false);
    expect(isChargingSchedule(sched('Active', 'None'))).toBe(false);
  });
});

describe('weekly overlap check', () => {
  it('finds donors with both a Stripe subscription and a charging Bloomerang gift, by email', async () => {
    const stripe = stripeWith([{ customer: { email: 'alyssa@example.org' }, metadata: {}, created: 1793000000, items: { data: [{ price: { unit_amount: 5143 } }] } }]);
    const r = await findRecurringOverlaps({ stripe, bloomerangKey: 'k' });
    expect(r.overlaps).toHaveLength(1);
    expect(r.overlaps[0]).toMatchObject({ name: 'Alyssa M', stripe: { amount: 51.43 } });
    const { subject, html } = overlapEmail(r.overlaps);
    expect(subject).toBe('Action needed: 1 donor may be charged twice for monthly giving');
    expect(html).toContain('$51.96 monthly');
    expect(html).toContain('Cancel Recurring Payment');
  });
  it('finds nobody when no one has switched yet', async () => {
    expect((await findRecurringOverlaps({ stripe: stripeWith([]), bloomerangKey: 'k' })).overlaps).toEqual([]);
  });
});

describe('Donation Received flag', () => {
  it('is empty when there is nothing to do', () => {
    expect(legacyRecurringHtml(null)).toBe('');
    expect(legacyRecurringHtml({ checked: true, schedules: [] })).toBe('');
  });
  it('warns when an old gift is still charging', () => {
    const html = legacyRecurringHtml({ checked: true, schedules: [{ amount: 51.96, frequency: 'Monthly', method: 'CreditCard', since: '2023-11-15', status: 'Active' }] });
    expect(html).toContain('Action needed');
    expect(html).toContain('$51.96 monthly by card, since 2023-11-15');
  });
  it('asks staff to check when it could not look', () => {
    expect(legacyRecurringHtml({ checked: false, reason: 'no Bloomerang record has this email' })).toContain('could not confirm');
  });
});
