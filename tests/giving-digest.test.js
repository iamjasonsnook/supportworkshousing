import { describe, it, expect } from 'vitest';
import { weekWindow, nyParts, digestGifts, givingDigestEmail, checkGifts, loadCheckGifts, DIGEST_RECIPIENTS } from '../api/_givingDigest.js';

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
    expect(subject).toBe('Weekly Giving Digest: no gifts this week');
    expect(html).toContain('No gifts came in');
  });

  it('goes to the three people asked for', () => {
    expect(DIGEST_RECIPIENTS).toEqual(['jsnook@supportworkshousing.org', 'abogdanovic@supportworkshousing.org', 'jeffrey@themonumentgroup.net']);
  });
});

describe('check gifts from Bloomerang', () => {
  const { start, end } = weekWindow(new Date('2026-11-13T14:05:00Z')); // Fri Nov 6 to Thu Nov 12
  const tx = (o) => ({ Method: 'Check', Amount: 50, AccountId: 24042, CheckNumber: '12301', Date: '2026-11-06T00:00:00', IsRefunded: 'false', ...o });

  it('takes only checks dated inside the week, never card gifts (those come from Stripe)', () => {
    const got = checkGifts([
      tx(), tx({ Date: '2026-11-12T00:00:00', Amount: 100 }), tx({ Date: '2026-11-13T00:00:00' }), tx({ Date: '2026-11-05T00:00:00' }),
      tx({ Method: 'CreditCard' }), tx({ IsRefunded: 'true' }),
    ], { 24042: 'Eugene and Jane Smith' }, { start, end });
    expect(got.map(g => g.amount)).toEqual([50, 100]);
    expect(got[0]).toMatchObject({ name: 'Eugene and Jane Smith', channel: 'check', checkNumber: '12301', fee: 0 });
  });

  it('labels each gift online or check, and totals both', () => {
    const online = digestGifts([charge({ amount: 10000 }), charge({ amount: 3098, metadata: {}, description: 'Subscription creation', customer: { name: 'Margaret E' } })]).gifts;
    const checks = checkGifts([tx()], { 24042: 'Eugene and Jane Smith' }, { start, end });
    const { subject, html } = givingDigestEmail({ gifts: [...online, ...checks], start, last: new Date(end - 1) });
    expect(subject).toBe('Weekly Giving Digest: $180.98 from 3 gifts');
    expect(html).toContain('Online, one-time');
    expect(html).toContain('Online, monthly');
    expect(html).toContain('Check #12301');
    expect(html).toContain('$131 online, $50 by check');
    expect(html).toContain('2 online, 1 by check');
    expect(html).toContain('1 check gift totaling $50.00 (Eugene and Jane Smith)');
  });

  it('says when checks could not be loaded', () => {
    const { html } = givingDigestEmail({ gifts: digestGifts([charge()]).gifts, start, last: new Date(end - 1), checksUnavailable: true });
    expect(html).toContain('check gifts, because Bloomerang could not be reached this week');
  });

  it('pages back through Bloomerang until it passes the start of the week', async () => {
    const pages = [Array.from({ length: 50 }, () => tx({ Method: 'CreditCard', Date: '2026-11-10T00:00:00' })), [tx(), tx({ Date: '2026-10-30T00:00:00' })]];
    const calls = [];
    const fetchImpl = async url => { calls.push(url); const body = url.includes('/constituent/') ? { FullName: 'Eugene and Jane Smith' } : { Results: pages[calls.filter(u => u.includes('/transactions')).length - 1] || [] }; return { ok: true, json: async () => body }; };
    const got = await loadCheckGifts({ bloomerangKey: 'k', start, end, fetchImpl });
    expect(got).toHaveLength(1);
    expect(calls.filter(u => u.includes('/transactions'))).toHaveLength(2);
  });
});
