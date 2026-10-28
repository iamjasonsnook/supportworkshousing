// Bloomerang helpers for server functions. The leading underscore keeps this
// file from becoming a Vercel function (the plan allows 12).

const BASE = 'https://api.bloomerang.co/v2';
// Bloomerang fund 13317 = Unrestricted Fund, as used for website donations.
export const UNRESTRICTED_FUND_ID = 13317;

const headers = key => ({ 'X-API-KEY': key, 'Content-Type': 'application/json', Accept: 'application/json' });

async function call(key, method, path, body) {
  const res = await fetch(BASE + path, { method, headers: headers(key), body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new Error(`Bloomerang ${method} ${path.split('?')[0]} failed (${res.status})`);
  return data;
}

// The constituent with this exact email; else the single constituent with
// this exact first and last name; else a new constituent. Unlike the card
// webhook, an ambiguous name never falls back to "the first match": attaching
// a pledge to the wrong person is worse than a duplicate record.
export async function findOrCreateConstituent(key, { firstName, lastName, email }) {
  const lower = String(email || '').toLowerCase();
  if (lower) {
    const found = await call(key, 'GET', `/constituents/search?search=${encodeURIComponent(email)}&take=10`);
    for (const c of found?.Results || []) {
      if (c.PrimaryEmail?.Value?.toLowerCase() === lower) return { id: c.Id, matched: 'email' };
    }
  }
  if (firstName && lastName) {
    const found = await call(key, 'GET', `/constituents/search?search=${encodeURIComponent(`${firstName} ${lastName}`)}&take=20`);
    const exact = (found?.Results || []).filter(c =>
      (c.FirstName || '').toLowerCase() === firstName.toLowerCase() && (c.LastName || '').toLowerCase() === lastName.toLowerCase());
    if (exact.length === 1) return { id: exact[0].Id, matched: 'name' };
  }
  const created = await call(key, 'POST', '/constituent', {
    Type: 'Individual', Status: 'Active', FirstName: firstName, LastName: lastName || '',
    PrimaryEmail: { Type: 'Home', Value: email, IsPrimary: true },
  });
  return { id: created.Id, matched: 'created' };
}

// A one-time pledge, due on dueDate: method None, one Pledge designation and
// a single installment. The API rejects frequency "Once" (pledges created in
// Bloomerang's own screens can have it), so this uses "Yearly" with only one
// installment, which never falls due again. The gift is later recorded as a
// PledgePayment against it.
export async function createPledge(key, { accountId, amount, dueDate, note, fundId = UNRESTRICTED_FUND_ID }) {
  const today = new Date().toISOString().slice(0, 10);
  const txn = await call(key, 'POST', '/transaction', {
    AccountId: accountId, Date: today, Amount: amount, Method: 'None',
    Designations: [{
      Type: 'Pledge', Amount: amount, FundId: fundId, Note: note,
      PledgeFrequency: 'Yearly',
      PledgeInstallments: [{ Date: dueDate, Amount: amount }],
    }],
  });
  return { transactionId: txn?.Id ?? null };
}
