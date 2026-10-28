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

// ─── Old Bloomerang recurring gifts ──────────────────────────────────────────
//
// Monthly donors are moving from Bloomerang's own recurring payments to the
// website's Stripe subscriptions. Bloomerang's API cannot cancel a recurring
// card payment (that is done in Bloomerang: open the payment, Cancel Recurring
// Payment), so these helpers only FIND schedules that are still charging, to
// warn staff before a donor is charged twice.

// The constituent with exactly this email, or null. Never creates one.
export async function findConstituentIdByEmail(key, email) {
  const lower = String(email || '').toLowerCase().trim();
  if (!lower) return null;
  const found = await call(key, 'GET', `/constituents/search?search=${encodeURIComponent(lower)}&take=10`);
  const hit = (found?.Results || []).find(c => c.PrimaryEmail?.Value?.toLowerCase() === lower);
  return hit ? hit.Id : null;
}

// A schedule Bloomerang may still charge: Active or Overdue (failing but not
// cancelled), paid by card or bank. Manual records (method None) never charge.
export const isChargingSchedule = t => {
  const g = t.Designations?.[0] || {};
  return g.Type === 'RecurringDonation' && ['Active', 'Overdue'].includes(g.RecurringDonationStatus)
    && ['CreditCard', 'Eft'].includes(t.Method);
};

const scheduleSummary = t => {
  const g = t.Designations[0];
  return { transactionId: t.Id, accountId: t.AccountId, amount: g.Amount, frequency: g.RecurringDonationFrequency,
    status: g.RecurringDonationStatus, method: t.Method, since: (g.RecurringDonationStartDate || '').slice(0, 10) };
};

export async function chargingSchedulesFor(key, accountId) {
  const d = await call(key, 'GET', `/transactions?accountId=${accountId}&type=RecurringDonation&take=50`);
  return (d?.Results || []).filter(isChargingSchedule).map(scheduleSummary);
}

export async function allChargingSchedules(key) {
  const out = [];
  for (let skip = 0; skip < 5000; skip += 50) {
    const d = await call(key, 'GET', `/transactions?type=RecurringDonation&take=50&skip=${skip}`);
    const rows = d?.Results || [];
    out.push(...rows.filter(isChargingSchedule).map(scheduleSummary));
    if (rows.length < 50) break;
  }
  return out;
}

export async function constituentContact(key, accountId) {
  const c = await call(key, 'GET', `/constituent/${accountId}`);
  return { name: [c?.FirstName, c?.LastName].filter(Boolean).join(' '), email: c?.PrimaryEmail?.Value || '' };
}
