import { describe, it, expect, vi } from 'vitest';
import {
  sameCheckNumber, scoreCandidate, decide, withHistory, plausible, findDuplicate, signReview, verifyReview, senderAllowed,
  readForm, approveEntry, proposeEntry, extractChecks, reviewEmail, reviewPage, slim, REVIEW_DAYS,
} from '../api/_checkIntake.js';

// A fake Bloomerang/Claude: routes by URL, records every call.
function fakeFetch(routes) {
  const calls = [];
  const fn = vi.fn(async (url, init = {}) => {
    let body = null; try { body = init.body ? JSON.parse(init.body) : null; } catch { body = String(init.body); }
    calls.push({ url, method: init.method || 'GET', body });
    for (const [match, reply] of routes) {
      if (url.includes(match) && (!reply.method || reply.method === (init.method || 'GET'))) {
        const data = typeof reply.data === 'function' ? reply.data(url, init) : reply.data;
        return { ok: reply.status ? reply.status < 400 : true, status: reply.status || 200, text: async () => JSON.stringify(data), json: async () => data };
      }
    }
    return { ok: true, status: 200, text: async () => '{"Results":[]}', json: async () => ({ Results: [] }) };
  });
  fn.calls = calls;
  return fn;
}

const hofheimer = { donor_type: 'Individual', first_name: 'Karen', last_name: 'Hofheimer', street: '1205 Graydon Ave', postal_code: '23507', check_number: '0006831083', amount: 2000, payer_name: 'DAFgiving360', vehicle: 'Donor-advised fund', is_donation: true, uncertain_fields: [] };

describe('check numbers', () => {
  it('ignores leading zeros and matches Bloomerang\'s last-4 form', () => {
    expect(sameCheckNumber('0005702362', '5702362')).toBe(true);
    expect(sameCheckNumber('918182351', '*2351')).toBe(true);
    expect(sameCheckNumber('918182351', '*2352')).toBe(false);
    expect(sameCheckNumber('', '123')).toBe(false);
  });

  it('a duplicate needs the same check number and amount', () => {
    const txs = [{ Id: 1, CheckNumber: '*1083', Amount: 2000 }, { Id: 2, CheckNumber: '6831083', Amount: 200 }];
    expect(findDuplicate(hofheimer, txs).Id).toBe(1);
    expect(findDuplicate({ ...hofheimer, amount: 50 }, txs)).toBe(null);
  });
});

describe('donor matching', () => {
  const couple = { Id: 23573, FullName: 'W. Barry and Karen Hofheimer', FirstName: 'W. Barry', LastName: 'Hofheimer', PrimaryAddress: { Street: '1205 Graydon Avenue', PostalCode: '23507' } };
  const other = { Id: 23572, FullName: 'Karen Hofheimer', FirstName: 'Karen', LastName: 'Hofheimer', PrimaryAddress: {} };

  it('the address settles which of two same-name records', () => {
    const scored = [couple, other].map(c => ({ c, ...scoreCandidate(hofheimer, c) })).sort((a, b) => b.score - a.score);
    expect(scored[0].c.Id).toBe(23573);
    expect(scored[0].why).toContain('same street address');
    expect(decide(scored)).toBe('existing');
  });

  it('the record with giving history beats an empty duplicate', () => {
    const ranked = withHistory([{ id: 1, score: 9, why: [] }, { id: 2, score: 9, why: [], lastGift: { amount: 2000 } }]);
    expect(ranked[0].id).toBe(2);
    expect(decide(ranked)).toBe('existing');
  });

  it('a shared first initial alone is not a match for a person', () => {
    const gladys = scoreCandidate({ donor_type: 'Individual', first_name: 'Galene', last_name: 'Williams' }, { FullName: 'Gladys Williams', FirstName: 'Gladys', LastName: 'Williams', PrimaryAddress: {} });
    expect(plausible({ donor_type: 'Individual' }, gladys)).toBe(false);
  });

  it('two equally good records go to the reviewer', () => {
    expect(decide([{ score: 5 }, { score: 5 }])).toBe('choose');
    expect(decide([{ score: 2 }])).toBe('new');
    expect(decide([])).toBe('new');
  });

  it('organizations match on name, ignoring words like Church and Foundation', () => {
    const r = scoreCandidate({ donor_type: 'Organization', organization_name: 'TowneBank Foundation' }, { FullName: 'TowneBank Foundation', PrimaryAddress: {} });
    expect(r.score).toBeGreaterThanOrEqual(6);
  });

  it('proposes the right record and spots a check already entered', async () => {
    const f = fakeFetch([
      ['/constituents/search', { data: { Results: [couple, other] } }],
      ['accountId=23573&take=1', { data: { Results: [{ Date: '2025-06-27T00:00:00', Amount: 2000 }], TotalFiltered: 28 } }],
      ['/transactions?skip=0&take=50', { data: { Results: [{ Id: 9, TransactionNumber: 99, CheckNumber: '6831083', Amount: 2000, Date: '2026-08-04', AccountId: 23573 }] } }],
    ]);
    const p = await proposeEntry({ bloomerangKey: 'k', check: hofheimer, fetchImpl: f });
    expect(p.decision).toBe('existing');
    expect(p.candidates[0]).toMatchObject({ id: 23573, lastGift: { amount: 2000 } });
    expect(p.duplicate).toMatchObject({ id: 9, number: 99 });
    expect(f.calls.every(c => c.method === 'GET')).toBe(true); // proposing never writes
  });
});

describe('review links', () => {
  const payload = { v: 1, sender: 'staff@supportworkshousing.org', check: slim(hofheimer), proposal: { decision: 'new', candidates: [], duplicate: null } };

  it('round-trip, and refuse tampering or old links', () => {
    const t = signReview(payload, 'secret', 1_000);
    expect(verifyReview(t, 'secret', 2_000)).toMatchObject({ sender: 'staff@supportworkshousing.org' });
    expect(verifyReview(t, 'other', 2_000)).toBe(null);
    const [body, sig] = t.split('.');
    const forged = Buffer.from(JSON.stringify({ ...payload, check: { ...payload.check, amount: 9 }, exp: 9e15 })).toString('base64url');
    expect(verifyReview(`${forged}.${sig}`, 'secret', 2_000)).toBe(null);
    expect(verifyReview(t, 'secret', 1_000 + REVIEW_DAYS * 864e5 + 1)).toBe(null);
    expect(body.length).toBeGreaterThan(10);
  });

  it('never carry the scan itself', () => {
    expect(slim({ ...hofheimer, base64: 'xxx', source_file: 'a.pdf' })).not.toHaveProperty('base64');
  });
});

describe('who can send', () => {
  const internal = [{ name: 'X-MS-Exchange-Organization-AuthAs', value: 'Internal' }];
  it('only mail Microsoft confirms came from inside the organization', () => {
    expect(senderAllowed({ from: 'staff@supportworkshousing.org', headers: internal })).toBe(true);
    expect(senderAllowed({ from: 'staff@supportworkshousing.org', headers: [{ name: 'Authentication-Results', value: 'spf=pass; dmarc=pass action=none header.from=supportworkshousing.org' }] })).toBe(true);
    expect(senderAllowed({ from: 'staff@supportworkshousing.org', headers: [] })).toBe(false); // spoofed, no proof
    expect(senderAllowed({ from: 'someone@gmail.com', headers: internal })).toBe(false);
    expect(senderAllowed({ from: 'x@supportworkshousing.org.evil.com', headers: internal })).toBe(false);
  });
});

describe('the review form', () => {
  const base = { amount: '2000', gift_date: '2026-11-06', check_number: '0006831083', check_date: '2026-07-27', account: '23573' };
  it('accepts a complete form and explains what is missing', () => {
    expect(readForm(base).errors).toEqual([]);
    expect(readForm({ ...base, amount: '' }).errors).toContain('Enter the amount.');
    expect(readForm({ ...base, account: 'new', donor_type: 'Individual', first_name: 'Ada' }).errors).toContain('A new individual needs a first and last name.');
    expect(readForm({ ...base, account: 'nope' }).errors.length).toBe(1);
  });
});

describe('approving', () => {
  const payload = { sender: 's@supportworkshousing.org', check: slim(hofheimer), proposal: { decision: 'existing', candidates: [{ id: 23573, name: 'W. Barry and Karen Hofheimer' }], duplicate: null } };
  const form = readForm({ amount: '2000', gift_date: '2026-11-06', check_number: '0006831083', check_date: '2026-07-27', account: '23573', note: 'Donor-advised fund. via DAFgiving360' }).form;

  it('enters a check gift to the Unrestricted Fund on the chosen record', async () => {
    const f = fakeFetch([['/transaction', { method: 'POST', data: { Id: 501, TransactionNumber: 13001 } }]]);
    const r = await approveEntry({ bloomerangKey: 'k', payload, form, fetchImpl: f });
    expect(r).toMatchObject({ accountId: 23573, created: false, transaction: { id: 501, number: 13001 } });
    const post = f.calls.find(c => c.method === 'POST');
    expect(post.body).toMatchObject({ AccountId: 23573, Amount: 2000, Method: 'Check', CheckNumber: '0006831083', CheckDate: '2026-07-27', Date: '2026-11-06',
      Designations: [{ Type: 'Donation', Amount: 2000, FundId: 13317, AcknowledgementStatus: 'No', Note: 'Donor-advised fund. via DAFgiving360' }] });
  });

  it('refuses when the same check is already in Bloomerang, writing nothing', async () => {
    const f = fakeFetch([['accountId=23573', { data: { Results: [{ Id: 7, TransactionNumber: 70, CheckNumber: '*1083', Amount: 2000 }] } }]]);
    const r = await approveEntry({ bloomerangKey: 'k', payload, form, fetchImpl: f });
    expect(r.refused.Id).toBe(7);
    expect(f.calls.some(c => c.method === 'POST')).toBe(false);
  });

  it('will not write to a record that was not offered', async () => {
    await expect(approveEntry({ bloomerangKey: 'k', payload, form: { ...form, account: '999' }, fetchImpl: fakeFetch([]) })).rejects.toThrow('not one of the choices');
  });

  it('creates a new constituent with the address, then the gift', async () => {
    const f = fakeFetch([
      ['/constituent', { method: 'POST', data: { Id: 777, FullName: 'Ada Lovelace' } }],
      ['/transaction', { method: 'POST', data: { Id: 502, TransactionNumber: 13002 } }],
    ]);
    const newForm = readForm({ amount: '50', gift_date: '2026-11-06', check_number: '101', account: 'new', donor_type: 'Individual', first_name: 'Ada', last_name: 'Lovelace', street: '1 Main St', city: 'Richmond', state: 'VA', postal_code: '23220' }).form;
    const r = await approveEntry({ bloomerangKey: 'k', payload: { ...payload, proposal: { decision: 'new', candidates: [] } }, form: newForm, fetchImpl: f });
    expect(r).toMatchObject({ accountId: 777, created: true });
    const posts = f.calls.filter(c => c.method === 'POST');
    expect(posts[0].body).toMatchObject({ Type: 'Individual', FirstName: 'Ada', LastName: 'Lovelace', PrimaryAddress: { Street: '1 Main St', City: 'Richmond', State: 'VA', PostalCode: '23220' } });
    expect(posts[1].body.AccountId).toBe(777);
  });
});

describe('reading the scan', () => {
  it('sends PDFs as documents, forces the tool, and skips unsupported files', async () => {
    const f = fakeFetch([['api.anthropic.com', { method: 'POST', data: { content: [{ type: 'tool_use', name: 'record_checks', input: { checks: [{ ...hofheimer }] } }] } }]]);
    const r = await extractChecks({ apiKey: 'k', fetchImpl: f, files: [{ name: 'a.pdf', mediaType: 'application/pdf', base64: 'AAA' }, { name: 'b.heic', mediaType: 'image/heic', base64: 'BBB' }] });
    expect(f.calls).toHaveLength(1);
    expect(f.calls[0].body.messages[0].content[0]).toMatchObject({ type: 'document', source: { media_type: 'application/pdf' } });
    expect(f.calls[0].body.tool_choice).toEqual({ type: 'tool', name: 'record_checks' });
    expect(r.checks[0]).toMatchObject({ amount: 2000, source_file: 'a.pdf' });
  });
});

describe('what staff see', () => {
  const proposal = { decision: 'existing', candidates: [{ id: 23573, name: 'W. Barry and Karen Hofheimer', why: ['same last name'], lastGift: { amount: 2000, date: '2025-06-27' } }], duplicate: { id: 9, number: 99, amount: 2000, date: '2026-08-04' } };

  it('the email warns about duplicates and doubtful fields, inside the brand layout', () => {
    const { subject, html } = reviewEmail({ check: { ...hofheimer, uncertain_fields: ['check_date'] }, proposal, sender: 'staff@supportworkshousing.org', reviewUrl: 'https://x/review?t=abc' });
    expect(subject).toBe('Review: $2,000.00 from Karen Hofheimer (possible duplicate)');
    expect(html).toContain('already in Bloomerang');
    expect(html).toContain('check date');
    expect(html).toContain('href="https://x/review?t=abc"');
    expect(html).toContain('logo-white.png');
  });

  it('the review page escapes what was read from the scan', () => {
    const html = reviewPage('tok', { sender: 's', check: { ...hofheimer, first_name: '<script>x</script>' }, proposal });
    expect(html).not.toContain('<script>x');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('name="t" value="tok"');
  });
});

describe('the routes', () => {
  const run = async (handler, { method = 'GET', url, body, headers = {} }) => {
    const res = { statusCode: 200, headers: {}, body: null,
      status(c) { this.statusCode = c; return this; }, setHeader(k, v) { this.headers[k.toLowerCase()] = v; return this; },
      send(b) { this.body = b; return this; }, json(b) { this.body = b; return this; }, end() { return this; } };
    await handler({ method, url, body, headers: { origin: 'https://supportworkshousing.org', ...headers }, query: {} }, res);
    return res;
  };

  it('echo Microsoft\'s validation token, show the review page, and approve through it', async () => {
    vi.resetModules();
    vi.doMock('../api/_email.js', () => ({ sendEmail: vi.fn(async () => ({})) }));
    process.env.ADMIN_TOKEN_SECRET = 'test-secret'; process.env.BLOOMERANG_API_KEY = 'k';
    const { default: handler } = await import('../api/admin/[...path].js');
    const { sendEmail } = await import('../api/_email.js');

    const v = await run(handler, { method: 'POST', url: '/api/admin/check-intake/notify?validationToken=abc%20123' });
    expect(v.statusCode).toBe(200);
    expect(v.body).toBe('abc 123');

    const payload = { v: 1, sender: 'staff@supportworkshousing.org', check: slim(hofheimer), proposal: { decision: 'existing', candidates: [{ id: 23573, name: 'W. Barry and Karen Hofheimer', why: ['same street address'], lastGift: null }], duplicate: null } };
    const t = signReview(payload, 'test-secret');
    const page = await run(handler, { url: `/api/admin/check-intake/review?t=${t}` });
    expect(page.statusCode).toBe(200);
    expect(page.body).toContain('Approve and enter in Bloomerang');

    const bad = await run(handler, { method: 'POST', url: '/api/admin/check-intake/review', body: { t, amount: '', gift_date: '2026-11-06', account: '23573' } });
    expect(bad.statusCode).toBe(400);
    expect(bad.body).toContain('Enter the amount.');

    const realFetch = globalThis.fetch;
    globalThis.fetch = fakeFetch([['/transaction', { method: 'POST', data: { Id: 601, TransactionNumber: 14001 } }]]);
    try {
      const ok = await run(handler, { method: 'POST', url: '/api/admin/check-intake/review', body: { t, amount: '2000', gift_date: '2026-11-06', check_number: '0006831083', account: '23573' } });
      expect(ok.statusCode).toBe(200);
      expect(ok.body).toContain('transaction #14001');
      expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'staff@supportworkshousing.org, jsnook@supportworkshousing.org', subject: 'Entered in Bloomerang: $2,000.00 from W. Barry and Karen Hofheimer' }));
    } finally { globalThis.fetch = realFetch; }

    const expired = await run(handler, { url: '/api/admin/check-intake/review?t=nonsense' });
    expect(expired.statusCode).toBe(400);
    expect(expired.body).toContain('expired or is not valid');
  });

  it('serve the check image only with a valid review link, never cached', async () => {
    vi.resetModules();
    vi.doMock('../api/_email.js', () => ({ sendEmail: vi.fn(async () => ({})) }));
    Object.assign(process.env, { ADMIN_TOKEN_SECRET: 'test-secret', MS_TENANT_ID: 't', MS_CLIENT_ID: 'c', MS_CLIENT_SECRET: 's' });
    const { default: handler } = await import('../api/admin/[...path].js');
    const realFetch = globalThis.fetch;
    const pdf = Buffer.from('%PDF-1.4 fake').toString('base64');
    globalThis.fetch = fakeFetch([
      ['login.microsoftonline.com', { method: 'POST', data: { access_token: 'tok', expires_in: 3600 } }],
      ['/messages/MSG1/attachments/ATT1', { data: { name: 'check.pdf', contentType: 'application/pdf', contentBytes: pdf } }],
    ]);
    try {
      const withScan = signReview({ v: 1, sender: 's', check: slim(hofheimer), proposal: { decision: 'new', candidates: [] }, scan: { m: 'MSG1', a: 'ATT1', type: 'application/pdf' } }, 'test-secret');
      const r = await run(handler, { url: `/api/admin/check-intake/scan?t=${withScan}` });
      expect(r.statusCode).toBe(200);
      expect(r.headers['content-type']).toBe('application/pdf');
      expect(r.headers['cache-control']).toBe('private, no-store');
      expect(Buffer.from(r.body).toString()).toBe('%PDF-1.4 fake');
      expect(globalThis.fetch.calls.find(c => c.url.includes('/attachments/'))).toBeTruthy();

      const page = await run(handler, { url: `/api/admin/check-intake/review?t=${withScan}` });
      expect(page.body).toContain('<iframe src="/api/admin/check-intake/scan?t=');
      expect(page.body).toContain('The check');

      expect((await run(handler, { url: '/api/admin/check-intake/scan?t=forged.sig' })).statusCode).toBe(400);
      const noScan = signReview({ v: 1, sender: 's', check: slim(hofheimer), proposal: { decision: 'new', candidates: [] } }, 'test-secret');
      expect((await run(handler, { url: `/api/admin/check-intake/scan?t=${noScan}` })).statusCode).toBe(404);
      expect((await run(handler, { url: `/api/admin/check-intake/review?t=${noScan}` })).body).not.toContain('The check');
    } finally {
      globalThis.fetch = realFetch;
      for (const k of ['MS_TENANT_ID', 'MS_CLIENT_ID', 'MS_CLIENT_SECRET']) delete process.env[k];
    }
  });
});
