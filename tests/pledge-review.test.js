import { describe, it, expect, vi } from 'vitest';

vi.mock('../api/_bloomerang.js', async orig => ({ ...(await orig()), createPledge: vi.fn(async () => ({ transactionId: 5151 })) }));
const { createPledge } = await import('../api/_bloomerang.js');
const { pledgeCandidates, readPledgeForm, approvePledge, pledgeReviewPage, pledgeNote } = await import('../api/_pledgeReview.js');
const { signReview, verifyReview } = await import('../api/_checkIntake.js');

function fakeFetch(routes) {
  const calls = [];
  const fn = async (url, init = {}) => {
    calls.push({ url, method: init.method || 'GET', body: init.body ? JSON.parse(init.body) : null });
    const hit = routes.find(([m, r]) => url.includes(m) && (!r.method || r.method === (init.method || 'GET')));
    const data = hit ? hit[1].data : { Results: [] };
    return { ok: true, status: 200, text: async () => JSON.stringify(data) };
  };
  fn.calls = calls;
  return fn;
}
const pledge = { name: 'Ada Lovelace', email: 'ada@example.org', approxValue: 5000, transferDate: '2026-11-20' };
const ada = { Id: 1, FullName: 'Ada Lovelace', FirstName: 'Ada', LastName: 'Lovelace', PrimaryEmail: { Value: 'ADA@example.org' } };
const other = { Id: 2, FullName: 'Ada Lovelace', FirstName: 'Ada', LastName: 'Lovelace', PrimaryEmail: { Value: 'other@example.org' } };

describe('stock pledge review', () => {
  it('a pledge link and a check link can never stand in for each other', () => {
    const t = signReview({ kind: 'pledge', pledge }, 's', Date.now(), 'pledge');
    expect(verifyReview(t, 's', Date.now(), 'pledge')).toMatchObject({ kind: 'pledge' });
    expect(verifyReview(t, 's', Date.now(), 'check')).toBe(null);
    expect(verifyReview(signReview({ x: 1 }, 's'), 's', Date.now(), 'pledge')).toBe(null);
  });

  it('offers records with the same email or exact name, saying why', async () => {
    const f = fakeFetch([['search=ada%40example.org', { data: { Results: [ada] } }], ['search=Ada%20Lovelace', { data: { Results: [ada, other] } }]]);
    const c = await pledgeCandidates({ bloomerangKey: 'k', pledge, fetchImpl: f });
    expect(c).toEqual([{ id: 1, name: 'Ada Lovelace', email: 'ADA@example.org', why: ['same email', 'same name'] }, { id: 2, name: 'Ada Lovelace', email: 'other@example.org', why: ['same name'] }]);
    expect(f.calls.every(x => x.method === 'GET')).toBe(true);
  });

  it('only accepts a record that was offered, or a new one with a name', () => {
    const candidates = [{ id: 1 }];
    expect(readPledgeForm({ account: '1' }, { candidates }).errors).toEqual([]);
    expect(readPledgeForm({ account: '999' }, { candidates }).errors).toHaveLength(1);
    expect(readPledgeForm({ account: 'new', first_name: 'Ada' }, { candidates }).errors).toHaveLength(1);
  });

  it('logs the pledge on the chosen record with its reference', async () => {
    createPledge.mockClear();
    const r = await approvePledge({ bloomerangKey: 'k', payload: { pledge, ref: 'SP-1', candidates: [{ id: 1, name: 'Ada Lovelace' }] }, form: { account: '1' }, fetchImpl: fakeFetch([]) });
    expect(r).toMatchObject({ accountId: 1, created: false, transactionId: 5151 });
    expect(createPledge).toHaveBeenCalledWith('k', { accountId: 1, amount: 5000, dueDate: '2026-11-20', note: pledgeNote(pledge, 'SP-1') });
  });

  it('refuses to log the same pledge twice', async () => {
    createPledge.mockClear();
    const already = { Results: [{ Id: 9, TransactionNumber: 99, Designations: [{ Note: pledgeNote(pledge, 'SP-1') }] }] };
    const f = fakeFetch([['/transactions?take=50&orderBy=CreatedDate', { data: already }]]);
    const r = await approvePledge({ bloomerangKey: 'k', payload: { pledge, ref: 'SP-1', candidates: [] }, form: { account: 'new', first_name: 'Ada', last_name: 'Lovelace' }, fetchImpl: f });
    expect(r.refused).toEqual({ id: 9, number: 99 });
    expect(createPledge).not.toHaveBeenCalled();
    expect(f.calls.some(c => c.method === 'POST')).toBe(false);
  });

  it('escapes what the donor typed on the review page', () => {
    const html = pledgeReviewPage('tok', { pledge: { ...pledge, name: '<script>x</script> Smith' }, candidates: [] });
    expect(html).not.toContain('<script>x');
  });
});

describe('bot check', () => {
  it('is off until the secret is set, then refuses a missing or failed check', async () => {
    const { verifyHuman } = await import('../api/_turnstile.js');
    expect(await verifyHuman(undefined, '1.1.1.1')).toEqual({ ok: true, skipped: true });
    process.env.TURNSTILE_SECRET_KEY = 'ts';
    try {
      expect((await verifyHuman('', '1.1.1.1')).ok).toBe(false);
      expect((await verifyHuman('t', '1.1.1.1', async () => ({ json: async () => ({ success: false }) }))).ok).toBe(false);
      expect((await verifyHuman('t', '1.1.1.1', async () => ({ json: async () => ({ success: true }) }))).ok).toBe(true);
    } finally { delete process.env.TURNSTILE_SECRET_KEY; }
  });
});
