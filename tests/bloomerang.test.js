import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findOrCreateConstituent, createPledge, UNRESTRICTED_FUND_ID } from '../api/_bloomerang.js';

// A fake Bloomerang: answers by method and path, and records every call.
let routes; const calls = [];
beforeEach(() => {
  calls.length = 0; routes = {};
  globalThis.fetch = vi.fn(async (url, opts = {}) => {
    const path = url.replace('https://api.bloomerang.co/v2', '');
    const key = `${opts.method || 'GET'} ${path.split('?')[0]}`;
    calls.push({ key, path, body: opts.body ? JSON.parse(opts.body) : null });
    const r = routes[key] ? routes[key](path) : { status: 404, body: {} };
    return { ok: r.status < 300, status: r.status, text: async () => JSON.stringify(r.body) };
  });
});
const person = (Id, FirstName, LastName, email) => ({ Id, FirstName, LastName, PrimaryEmail: email ? { Value: email } : null });

describe('findOrCreateConstituent', () => {
  it('matches by exact email first', async () => {
    routes['GET /constituents/search'] = p => ({ status: 200, body: { Results: decodeURIComponent(p).includes('ada@example.org')
      ? [person(1, 'Ada', 'Other', 'someone@x.org'), person(2, 'Ada', 'Lovelace', 'ADA@example.org')] : [] } });
    expect(await findOrCreateConstituent('k', { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.org' })).toEqual({ id: 2, matched: 'email' });
    expect(calls.some(c => c.key === 'POST /constituent')).toBe(false);
  });

  it('falls back to a unique exact name', async () => {
    routes['GET /constituents/search'] = p => ({ status: 200, body: { Results: decodeURIComponent(p).includes('Ada Lovelace')
      ? [person(5, 'Ada', 'Lovelace', 'old@x.org'), person(6, 'Adam', 'Lovelace', null)] : [] } });
    expect(await findOrCreateConstituent('k', { firstName: 'Ada', lastName: 'Lovelace', email: 'new@x.org' })).toEqual({ id: 5, matched: 'name' });
  });

  it('creates a new constituent rather than guess between two people with the same name', async () => {
    routes['GET /constituents/search'] = p => ({ status: 200, body: { Results: decodeURIComponent(p).includes('Ada Lovelace')
      ? [person(5, 'Ada', 'Lovelace', null), person(8, 'Ada', 'Lovelace', null)] : [] } });
    routes['POST /constituent'] = () => ({ status: 200, body: { Id: 99 } });
    expect(await findOrCreateConstituent('k', { firstName: 'Ada', lastName: 'Lovelace', email: 'new@x.org' })).toEqual({ id: 99, matched: 'created' });
    const created = calls.find(c => c.key === 'POST /constituent').body;
    expect(created).toMatchObject({ Type: 'Individual', FirstName: 'Ada', LastName: 'Lovelace', PrimaryEmail: { Value: 'new@x.org' } });
  });

  it('throws when Bloomerang errors, so the caller can report it', async () => {
    routes['GET /constituents/search'] = () => ({ status: 500, body: {} });
    await expect(findOrCreateConstituent('k', { firstName: 'A', lastName: 'B', email: 'a@b.org' })).rejects.toThrow('failed (500)');
  });
});

describe('createPledge', () => {
  it('writes a single-installment pledge (the API rejects frequency Once)', async () => {
    routes['POST /transaction'] = () => ({ status: 200, body: { Id: 123 } });
    expect(await createPledge('k', { accountId: 7, amount: 5000, dueDate: '2026-11-02', note: 'n' })).toEqual({ transactionId: 123 });
    const body = calls.find(c => c.key === 'POST /transaction').body;
    expect(body).toMatchObject({ AccountId: 7, Amount: 5000, Method: 'None' });
    expect(body.Designations).toEqual([{ Type: 'Pledge', Amount: 5000, FundId: UNRESTRICTED_FUND_ID, Note: 'n',
      PledgeFrequency: 'Yearly', PledgeInstallments: [{ Date: '2026-11-02', Amount: 5000 }] }]);
  });
});
