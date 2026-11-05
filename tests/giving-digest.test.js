import { describe, it, expect } from 'vitest';
import { weekWindow, nyParts, digestGifts, givingDigestEmail, DIGEST_RECIPIENTS } from '../api/_givingDigest.js';

const charge = (o = {}) => ({
  status: 'succeeded', refunded: false, amount: 5000, created: Date.parse('2026-11-03T15:00:00Z') / 1000,
  metadata: { donor_name: 'Ada Lovelace', donor_email: 'ada@example.org', donation_type: 'one-time' },
  billing_details: {}, balance_transaction: { fee: 140 }, description: 'Thank you for your donation', ...o,
});

describe('weekWindow', () => {
  it('covers last Friday through Thursday, New York time', () => {
    const { start, end } = weekWindow(new Date('2026-11-06T14:05:00Z')); // Fri Nov 6, 9:05am EST
    expect(start.toISOString()).toBe('2026-10-30T04:00:00.000Z'); // Fri Oct 30 midnight EDT
    expect(end.toISOString()).toBe('2026-11-06T05:00:00.000Z'); // Fri Nov 6 midnight EST
  });

  it('runs in the 9 o\'clock hour in New York from the matching UTC slot, summer and winter', () => {
    expect(nyParts(new Date('2026-11-06T14:20:00Z')).hour).toBe(9); // winter: 14:00 UTC slot
    expect(nyParts(new Date('2026-11-06T13:20:00Z')).hour).toBe(8);
    expect(nyParts(new Date('2026-07-10T13:20:00Z')).hour).toBe(9); // summer: 13:00 UTC slot
    expect(nyParts(new Date('2026-07-10T14:20:00Z')).hour).toBe(10);
  });
});

describe('digestGifts', () => {
  it('reads one-time, monthly and fee-covered gifts', () => {
    const { gifts, tests } = digestGifts([
      charge(),
      charge({ amount: 3098, metadata: {}, description: 'Subscription creation', customer: { name: 'Margaret E' } }),
      charge({ amount: 102280 }),
      charge({ status: 'failed' }),
      charge({ refunded: true }),
    ]);
    expect(tests).toBe(0);
    expect(gifts.map(g => [g.amount, g.monthly, g.covered])).toEqual([[50, false, false], [30.98, true, false], [1022.8, false, true]]);
    expect(gifts[1].name).toBe('Margaret E');
    expect(gifts[2].gift).toBe(1000);
  });

  it('sets aside $1 tests from the admin but keeps real $1 gifts', () => {
    const { gifts, tests } = digestGifts([
      charge({ amount: 100, metadata: { donor_name: 'Staff', donor_email: 'Admin@Example.org' } }),
      charge({ amount: 100 }),
    ], { adminEmail: 'admin@example.org' });
    expect(tests).toBe(1);
    expect(gifts).toHaveLength(1);
  });
});

describe('givingDigestEmail', () => {
  const { start, end } = weekWindow(new Date('2026-11-06T14:05:00Z'));
  const last = new Date(end - 1);

  it('totals the week inside the shared layout', () => {
    const { gifts } = digestGifts([charge(), charge({ amount: 25000, metadata: { donor_name: 'Grace <b>Hopper</b>' } })]);
    const { subject, html } = givingDigestEmail({ gifts, start, last });
    expect(subject).toBe('Weekly Giving Digest: $300.00 from 2 gifts');
    expect(html).toContain('October 30 to November 5, 2026');
    expect(html).toContain('logo-white.png');
    expect(html).toContain('Grace &lt;b&gt;Hopper&lt;/b&gt;');
    expect(html).not.toContain('<b>Hopper</b>');
  });

  it('says so when nothing came in', () => {
    const { subject, html } = givingDigestEmail({ gifts: [], start, last });
    expect(subject).toBe('Weekly Giving Digest: no online gifts this week');
    expect(html).toContain('No gifts came in');
  });

  it('goes to the three people asked for', () => {
    expect(DIGEST_RECIPIENTS).toEqual(['jsnook@supportworkshousing.org', 'abogdanovic@supportworkshousing.org', 'jeffrey@themonumentgroup.net']);
  });
});
