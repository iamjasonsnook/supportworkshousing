// Donation check intake: a check scan emailed to the donation checks mailbox
// is read by Claude, matched to a Bloomerang donor, and sent back as a review
// email. Nothing is written to Bloomerang until someone opens the review link
// and approves it. The leading underscore keeps this file from becoming a
// Vercel function (the plan allows 12); the routes live in
// api/admin/[...path].js and the mailbox side in api/_graph.js.
//
// No database: the review link carries the proposal in a signed token, and an
// approval re-checks Bloomerang for the same check before writing, so a link
// approved twice (or a check already entered by hand) never enters twice.

import crypto from 'crypto';
import { emailLayout } from './_emailLayout.js';
import { UNRESTRICTED_FUND_ID } from './_bloomerang.js';

export const ORG_DOMAIN = 'supportworkshousing.org';
export const REVIEW_DAYS = 14;
const BLOOMERANG = 'https://api.bloomerang.co/v2';
const MODEL = 'claude-sonnet-5';
export const SUPPORTED_TYPES = { 'application/pdf': 'document', 'image/jpeg': 'image', 'image/png': 'image', 'image/gif': 'image', 'image/webp': 'image' };

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const usd = v => Number(v || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const fmtDate = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? `${m[2]}/${m[3]}/${m[1]}` : ''; };

// ─── 1. Reading the scan ─────────────────────────────────────────────────────

const CHECK_FIELDS = {
  is_donation: { type: 'boolean', description: 'False for rent, resident or program payments, refunds, insurance, vendor checks, or anything that is not a charitable gift.' },
  non_donation_reason: { type: 'string', description: 'Why this is not a donation, if is_donation is false.' },
  payer_name: { type: 'string', description: 'The name printed on the check as the account holder or issuing institution.' },
  donor_type: { type: 'string', enum: ['Individual', 'Organization'] },
  first_name: { type: 'string', description: 'Individual donor first name (the person to credit).' },
  last_name: { type: 'string' },
  organization_name: { type: 'string', description: 'Organization donor name, if the donor is an organization.' },
  acknowledge_as: { type: 'string', description: 'How the donor should be named, e.g. "Kevin J. & Julia S. Chase".' },
  vehicle: { type: 'string', enum: ['Personal check', 'Donor-advised fund', 'IRA distribution', 'Foundation', 'Corporate', 'Church', 'Workplace giving', 'Government', 'Other'] },
  street: { type: 'string' }, city: { type: 'string' }, state: { type: 'string' }, postal_code: { type: 'string' },
  check_number: { type: 'string' },
  check_date: { type: 'string', description: 'YYYY-MM-DD' },
  amount: { type: 'number' },
  memo: { type: 'string', description: 'Memo line or designation, e.g. "In honor of", "HomeLink".' },
  payee: { type: 'string', description: 'Who the check is made out to.' },
  notes: { type: 'string', description: 'Anything staff should know: enclosed letter, tribute, DAF advisor named in a letter, payee is the old name, etc.' },
  uncertain_fields: { type: 'array', items: { type: 'string' }, description: 'Field names you could not read with confidence (handwriting, cut off, smudged).' },
};

const EXTRACT_TOOL = {
  name: 'record_checks',
  description: 'Record every check found in the scan.',
  input_schema: {
    type: 'object',
    properties: { checks: { type: 'array', items: { type: 'object', properties: CHECK_FIELDS, required: ['is_donation', 'amount', 'check_number', 'payer_name', 'donor_type', 'vehicle', 'uncertain_fields'] } } },
    required: ['checks'],
  },
};

const EXTRACT_PROMPT = `These are scans of payments received by SupportWorks Housing, a nonprofit in Richmond, Virginia (formerly named Virginia Supportive Housing). A scan may hold one or more checks plus letters, envelopes or remittance stubs.

Record every check with the record_checks tool. Rules:
- Read only what is on the page. Never guess a number, name or date. Leave a field empty if it is not there, and list any field you could not read with confidence in uncertain_fields.
- For donor-advised fund, IRA, brokerage, foundation or workplace-giving checks, payer_name is the institution. Credit the person or family who recommended the gift (from the memo, the stub or an enclosed letter) as the donor when one is named; otherwise credit the institution as an Organization.
- Mark is_donation false for rent, resident or program-fee payments, refunds, insurance, reimbursements or vendor payments.
- Dates as YYYY-MM-DD. Amounts as numbers, using the written-out amount when the numerals are unclear.`;

// files: [{ name, mediaType, base64 }]. Returns { checks: [...] } with the source file name on each.
export async function extractChecks({ apiKey, files, fetchImpl = fetch }) {
  const out = [];
  for (const f of files) {
    const kind = SUPPORTED_TYPES[f.mediaType];
    if (!kind) continue;
    const res = await fetchImpl('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: MODEL, max_tokens: 4096,
        tools: [EXTRACT_TOOL], tool_choice: { type: 'tool', name: 'record_checks' },
        messages: [{ role: 'user', content: [
          { type: kind, source: { type: 'base64', media_type: f.mediaType, data: f.base64 } },
          { type: 'text', text: EXTRACT_PROMPT },
        ] }],
      }),
    });
    if (!res.ok) throw new Error(`Claude could not read ${f.name} (${res.status})`);
    const data = await res.json();
    const tool = (data.content || []).find(b => b.type === 'tool_use');
    for (const c of tool?.input?.checks || []) out.push({ ...c, source_file: f.name, ...(f.id ? { source_attachment: f.id } : {}) });
  }
  return { checks: out };
}

// ─── 2. Matching to Bloomerang ───────────────────────────────────────────────

async function bloom(key, path, init = {}, fetchImpl = fetch) {
  const res = await fetchImpl(BLOOMERANG + path, { ...init, headers: { 'X-API-KEY': key, 'Content-Type': 'application/json', Accept: 'application/json' } });
  const text = await res.text();
  let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new Error(`Bloomerang ${init.method || 'GET'} ${path.split('?')[0]} failed (${res.status})`);
  return data;
}

const words = s => String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean);
const STOP = new Set(['the', 'and', 'of', 'inc', 'llc', 'fund', 'foundation', 'church', 'mr', 'mrs', 'ms', 'dr', 'jr', 'sr', 'ii', 'iii']);
const streetKey = s => { const w = words(s); return w.length ? `${w[0]} ${w[1] || ''}`.trim() : ''; };
export const normCheck = s => String(s || '').replace(/\D/g, '').replace(/^0+/, '');

// Bloomerang sometimes stores only the last 4 digits ("*2351").
export function sameCheckNumber(scanned, stored) {
  const a = normCheck(scanned), raw = String(stored || '');
  if (!a || !raw) return false;
  if (/^\*\d{4}$/.test(raw.trim())) return a.endsWith(raw.trim().slice(1));
  return a === normCheck(raw);
}

// Higher is a better match. Address agreement counts most: two Bloomerang
// records often share a name, and the address on the check settles it.
export function scoreCandidate(check, c) {
  let score = 0; const why = [];
  const addr = c.PrimaryAddress || {};
  if (check.donor_type === 'Organization') {
    const want = words(check.organization_name || check.payer_name).filter(w => !STOP.has(w)).join(' ');
    const have = words(c.FullName).filter(w => !STOP.has(w)).join(' ');
    if (want && want === have) { score += 6; why.push('same organization name'); }
    else if (want && (have.includes(want) || want.includes(have))) { score += 3; why.push('similar organization name'); }
  } else {
    const last = words(check.last_name).join(' '), first = words(check.first_name)[0] || '';
    const full = words(c.FullName);
    if (last && (words(c.LastName).join(' ') === last || full.includes(last))) { score += 3; why.push('same last name'); }
    if (first && (words(c.FirstName)[0] === first || full.includes(first))) { score += 2; why.push('same first name'); }
    else if (first && words(c.FirstName)[0]?.[0] === first[0]) { score += 1; why.push('same first initial'); }
  }
  if (check.street && addr.Street && streetKey(check.street) === streetKey(addr.Street)) { score += 4; why.push('same street address'); }
  else if (check.postal_code && addr.PostalCode && String(addr.PostalCode).slice(0, 5) === String(check.postal_code).slice(0, 5)) { score += 1; why.push('same ZIP'); }
  return { score, why };
}

// Bloomerang often holds an empty duplicate beside the record a donor
// actually gives on (two Hofheimer records, two Tousignant records). Among
// name or address matches, the one with giving history wins.
export function withHistory(cands) {
  return cands.map(c => c.lastGift ? { ...c, score: c.score + 2, why: [...c.why, 'has past gifts'] } : c).sort((a, b) => b.score - a.score);
}

// An individual needs the last name plus the first name or the address to be
// offered at all; a shared first initial alone (Galene vs. Gladys) is not enough.
export const plausible = (check, x) => check.donor_type === 'Organization' ? x.score >= 3 : x.score >= 5;

// What to do with a scored list: one clear winner is proposed; a close call
// is left for the reviewer to pick; nothing plausible means a new record.
export function decide(scored) {
  const top = scored[0], next = scored[1];
  if (!top || top.score < 3) return 'new';
  if (top.score >= 5 && (!next || next.score <= top.score - 2)) return 'existing';
  return 'choose';
}

export function findDuplicate(check, transactions) {
  return transactions.find(t => sameCheckNumber(check.check_number, t.CheckNumber) && Math.abs(Number(t.Amount) - Number(check.amount)) < 0.005) || null;
}

// The newest gifts in Bloomerang, any donor. The API returns at most 50 a page.
async function recentTransactions(key, fetchImpl, pages = 4) {
  const out = [];
  for (let i = 0; i < pages; i++) {
    const d = await bloom(key, `/transactions?skip=${i * 50}&take=50&orderBy=Date&orderDirection=Desc`, {}, fetchImpl);
    out.push(...(d?.Results || []));
    if ((d?.Results || []).length < 50) break;
  }
  return out;
}

async function lastGift(key, accountId, fetchImpl) {
  const d = await bloom(key, `/transactions?accountId=${accountId}&take=1&orderBy=Date&orderDirection=Desc`, {}, fetchImpl);
  const t = d?.Results?.[0];
  return t ? { date: t.Date.slice(0, 10), amount: t.Amount, total: d.TotalFiltered ?? null } : null;
}

// Search Bloomerang, score candidates, and look for the same check already entered.
export async function proposeEntry({ bloomerangKey: key, check, fetchImpl = fetch }) {
  const terms = check.donor_type === 'Organization'
    ? [check.organization_name || check.payer_name]
    : [[check.first_name, check.last_name].filter(Boolean).join(' '), check.last_name];
  const seen = new Map();
  for (const term of terms.filter(Boolean)) {
    const d = await bloom(key, `/constituents/search?search=${encodeURIComponent(term)}&take=50`, {}, fetchImpl);
    for (const c of d?.Results || []) if (!seen.has(c.Id)) seen.set(c.Id, c);
  }
  // A person's check is never credited to an organization's record just
  // because its contact person shares the name.
  const pool = [...seen.values()].filter(c => check.donor_type === 'Organization' || c.Type !== 'Organization');
  const scored = pool.map(c => ({ c, ...scoreCandidate(check, c) })).filter(x => plausible(check, x)).sort((a, b) => b.score - a.score).slice(0, 4);
  const found = [];
  for (const { c, score, why } of scored) {
    found.push({ id: c.Id, name: c.FullName, type: c.Type, street: c.PrimaryAddress?.Street || '', city: c.PrimaryAddress?.City || '', score, why, lastGift: await lastGift(key, c.Id, fetchImpl) });
  }
  const candidates = withHistory(found);
  // The same check entered before: on a candidate's record, or anywhere in the newest 200 gifts.
  const recent = await recentTransactions(key, fetchImpl);
  let duplicate = findDuplicate(check, recent);
  for (const cand of candidates) {
    if (duplicate) break;
    const d = await bloom(key, `/transactions?accountId=${cand.id}&take=50&orderBy=Date&orderDirection=Desc`, {}, fetchImpl);
    duplicate = findDuplicate(check, d?.Results || []);
  }
  return {
    decision: decide(candidates),
    candidates,
    duplicate: duplicate ? { id: duplicate.Id, number: duplicate.TransactionNumber, date: duplicate.Date?.slice(0, 10), amount: duplicate.Amount, accountId: duplicate.AccountId } : null,
  };
}

// ─── 3. The review link ──────────────────────────────────────────────────────

const PURPOSE = 'swh-check-intake-v1:';
export function signReview(payload, secret, now = Date.now()) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: now + REVIEW_DAYS * 864e5 })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(PURPOSE + body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyReview(token, secret, now = Date.now()) {
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig) return null;
  const want = crypto.createHmac('sha256', secret).update(PURPOSE + body).digest('base64url');
  if (sig.length !== want.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
  try { const p = JSON.parse(Buffer.from(body, 'base64url').toString()); return p.exp && now <= p.exp ? p : null; } catch { return null; }
}

// Only what the review page needs travels in the link; the scan never does.
export const KEEP = ['is_donation', 'non_donation_reason', 'payer_name', 'donor_type', 'first_name', 'last_name', 'organization_name', 'acknowledge_as', 'vehicle', 'street', 'city', 'state', 'postal_code', 'check_number', 'check_date', 'amount', 'memo', 'notes', 'uncertain_fields', 'source_file'];
export const slim = check => Object.fromEntries(KEEP.filter(k => check[k] !== undefined && check[k] !== '').map(k => [k, check[k]]));

// ─── 4. Emails ───────────────────────────────────────────────────────────────

const row = (label, value, unsure) => value || unsure ? `<tr><td style="padding:7px 10px 7px 0;color:#76666F;font-size:13px;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:7px 0;font-size:14px;color:#22161E">${esc(value) || '<i style="color:#B3202D">not read</i>'}${unsure ? ' <span style="color:#965700;font-weight:600;font-size:12px">check this</span>' : ''}</td></tr>` : '';
const box = (bg, border, html) => `<div style="background:${bg};border-left:4px solid ${border};padding:14px 16px;margin:16px 0;border-radius:4px">${html}</div>`;
const button = (href, label) => `<a href="${esc(href)}" style="display:inline-block;background:#9B1B5D;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 22px;border-radius:8px;font-size:15px">${label}</a>`;

export function checkDetailsTable(c) {
  const u = new Set(c.uncertain_fields || []);
  const name = c.donor_type === 'Organization' ? c.organization_name : [c.first_name, c.last_name].filter(Boolean).join(' ');
  const addr = [c.street, [c.city, c.state].filter(Boolean).join(', '), c.postal_code].filter(Boolean).join(', ');
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%">
${row('Amount', c.amount ? usd(c.amount) : '', u.has('amount'))}${row('Donor', name, u.has('first_name') || u.has('last_name') || u.has('organization_name'))}
${row('Acknowledge as', c.acknowledge_as, u.has('acknowledge_as'))}${row('Check from', c.payer_name, u.has('payer_name'))}${row('Giving vehicle', c.vehicle)}
${row('Address', addr, u.has('street') || u.has('city') || u.has('postal_code'))}${row('Check #', c.check_number, u.has('check_number'))}${row('Check date', fmtDate(c.check_date), u.has('check_date'))}
${row('Memo', c.memo, u.has('memo'))}${row('Notes', c.notes)}${row('Scan', c.source_file)}</table>`;
}

const matchHtml = p => {
  if (p.decision === 'existing') {
    const c = p.candidates[0];
    return `<p style="margin:0 0 4px"><b>Bloomerang match:</b> ${esc(c.name)} (ID ${c.id}), ${esc(c.why.join(', '))}.</p>
<p style="margin:0;color:#76666F;font-size:13px">${c.lastGift ? `Last gift ${usd(c.lastGift.amount)} on ${fmtDate(c.lastGift.date)}.` : 'No gifts on this record yet.'}</p>`;
  }
  if (p.decision === 'choose') return `<p style="margin:0"><b>More than one possible donor in Bloomerang.</b> Pick the right one on the review page: ${p.candidates.map(c => `${esc(c.name)} (ID ${c.id})`).join(', ')}.</p>`;
  return '<p style="margin:0"><b>No matching donor in Bloomerang.</b> Approving will create a new constituent with the name and address above.</p>';
};

export function reviewEmail({ check, proposal, reviewUrl, sender }) {
  const c = check, p = proposal;
  const who = c.donor_type === 'Organization' ? c.organization_name || c.payer_name : [c.first_name, c.last_name].filter(Boolean).join(' ') || c.payer_name;
  const warnings = [];
  if (p.duplicate) warnings.push(box('#FBE7E9', '#B3202D', `<b>This check looks like it is already in Bloomerang</b>: transaction #${p.duplicate.number} (ID ${p.duplicate.id}), ${usd(p.duplicate.amount)} on ${fmtDate(p.duplicate.date)}. Approving will be refused unless that entry is removed.`));
  if (c.is_donation === false) warnings.push(box('#FBF0DE', '#965700', `<b>This may not be a donation.</b> ${esc(c.non_donation_reason || '')} Only approve it if it is a gift.`));
  if ((c.uncertain_fields || []).length) warnings.push(box('#FBF0DE', '#965700', `<b>Check these against the scan:</b> ${esc(c.uncertain_fields.join(', ').replace(/_/g, ' '))}. They were hard to read.`));
  return {
    subject: `Review: ${c.amount ? usd(c.amount) : 'check'} from ${who || 'unknown donor'}${p.duplicate ? ' (possible duplicate)' : ''}`,
    html: emailLayout({
      title: 'Check Ready for Review',
      subtitle: `${c.amount ? usd(c.amount) : ''} from ${esc(who || 'unknown donor')}`,
      body: `<p style="margin:0 0 14px">${esc(sender)} sent this check to the donation checks inbox. Here is what was read from the scan. <b>Nothing has been entered in Bloomerang yet.</b></p>
${warnings.join('')}
${checkDetailsTable(c)}
${box('#FBEFF5', '#9B1B5D', matchHtml(p))}
<p style="margin:22px 0 8px">${button(reviewUrl, 'Review and approve')}</p>
<p style="font-size:13px;color:#76666F;margin:14px 0 0">On the review page you can correct anything, choose the donor, and approve. The gift goes to the Unrestricted Fund. The link works for ${REVIEW_DAYS} days; if you do nothing, nothing is entered.</p>`,
    }),
  };
}

// ack: { sent: true, date } | { sent: false, reason }
export const ackLine = ack => ack?.sent
  ? `The donor was emailed a thank-you and the gift is marked acknowledged in Bloomerang (${fmtDate(ack.date)}).`
  : `<b>The donor has not been thanked yet:</b> ${esc(ack?.reason || 'no thank-you was sent.')}`;

export function enteredEmail({ check, accountId, accountName, created, transaction, approvedAt, ack }) {
  return {
    subject: `Entered in Bloomerang: ${usd(check.amount)} from ${accountName}`,
    html: emailLayout({
      title: 'Gift Entered in Bloomerang',
      subtitle: `${usd(check.amount)} from ${esc(accountName)}`,
      body: `<p style="margin:0 0 14px">This check gift was approved and entered in Bloomerang on ${esc(approvedAt)}.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%">
${row('Donor', `${accountName} (ID ${accountId})${created ? ', new constituent' : ''}`)}${row('Transaction', `#${transaction.number} (ID ${transaction.id})`)}
${row('Amount', usd(check.amount))}${row('Check #', check.check_number)}${row('Check date', fmtDate(check.check_date))}${row('Gift date', fmtDate(check.gift_date))}${row('Fund', 'Unrestricted Fund')}${row('Note', check.note)}</table>
<p style="font-size:14px;margin:18px 0 0">${ackLine(ack)}</p>`,
    }),
  };
}

// The donor's thank-you for a check gift, in the same voice as the online
// thank-you. The tax line depends on how the gift was made: a donor-advised
// fund grant was already deducted when the donor funded the account, so it
// gets no receipt language; an IRA distribution gets QCD wording.
export function checkThankYouEmail({ salutation, amount, checkNumber, checkDate, vehicle }) {
  const longDate = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' }) : ''; };
  const tax = vehicle === 'Donor-advised fund'
    ? 'Thank you for recommending this grant from your donor-advised fund. Because the fund\'s sponsor has already provided your tax receipt, this letter is our thank-you only.'
    : vehicle === 'IRA distribution'
      ? 'SupportWorks Housing is a 501(c)(3) nonprofit organization, EIN 54-1444564. This gift was paid directly from your IRA, and no goods or services were provided in exchange for it. Please keep this email for your records and talk with your tax advisor about reporting it as a qualified charitable distribution.'
      : 'SupportWorks Housing is a 501(c)(3) nonprofit organization, EIN 54-1444564. No goods or services were provided in exchange for this gift. Please keep this email for your tax records.';
  const r = (k, v) => v ? `<tr><td style="padding:4px 18px 4px 0;font-weight:600;color:#1A1A1A">${k}</td><td style="padding:4px 0">${esc(v)}</td></tr>` : '';
  return {
    subject: 'Thank you for your gift to SupportWorks Housing',
    html: emailLayout({
      title: 'Thank You for Your Gift',
      body: `<p>Dear ${esc(salutation || 'friend')},</p>
<p>Thank you for your donation. Your generous gift will help us end homelessness in your community.</p>
<p>For 37 years, SupportWorks Housing has helped older adults, veterans, and people with disabilities across Virginia find a home and keep it. Year over year, 96% or more of our residents and program participants do not return to homelessness. Gifts like yours make that possible.</p>
${box('#FDF2F4', '#9B1B5D', `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${r('Gift', usd(amount))}${r('Check', checkNumber ? `#${checkNumber}` : '')}${r('Check date', longDate(checkDate))}</table>`)}
<p style="font-size:13px;color:#6B7280">${tax}</p>
<p>With gratitude,<br>The SupportWorks Housing team</p>`,
    }),
  };
}

// Who to thank and where: the record's email and the name staff chose for
// letters (Informal name, e.g. "Gene and Jane"), else the first name.
export async function donorContact({ bloomerangKey: key, accountId, fetchImpl = fetch }) {
  const c = await bloom(key, `/constituent/${accountId}`, {}, fetchImpl);
  return { email: c.PrimaryEmail?.Value || '', salutation: c.InformalName || c.FirstName || c.FullName || '', name: c.FullName };
}

// Record the thank-you in Bloomerang: an Acknowledgement interaction on the
// donor, linked from the gift, and the gift's status set to Yes. Bloomerang's
// update replaces a gift's designations wholesale, so this only touches the
// simple gifts the intake creates (one Donation designation, no soft credits,
// custom values or attachments) and rebuilds every field it read.
export async function acknowledgeGift({ bloomerangKey: key, transactionId, subject, note, fetchImpl = fetch, today = new Date().toISOString().slice(0, 10) }) {
  const t = await bloom(key, `/transaction/${transactionId}`, {}, fetchImpl);
  const g = t.Designations || [];
  if (g.length !== 1 || g[0].Type !== 'Donation' || (g[0].SoftCreditIds || []).length || (g[0].CustomValues || []).length || (g[0].AttachmentIds || []).length || (t.AttachmentIds || []).length || g[0].Tribute) {
    throw new Error('This gift has more than one part, a soft credit, a tribute or attachments; mark the acknowledgment in Bloomerang by hand.');
  }
  const i = await bloom(key, '/interaction', { method: 'POST', body: JSON.stringify({ AccountId: t.AccountId, Date: today, Channel: 'Email', Purpose: 'Acknowledgement', Subject: subject, Note: note, IsInbound: false }) }, fetchImpl);
  const d = g[0];
  const updated = await bloom(key, `/transaction/${transactionId}`, { method: 'PUT', body: JSON.stringify({
    AccountId: t.AccountId, Date: t.Date.slice(0, 10), Amount: t.Amount, Method: t.Method,
    ...(t.CheckNumber ? { CheckNumber: t.CheckNumber } : {}), ...(t.CheckDate ? { CheckDate: t.CheckDate.slice(0, 10) } : {}),
    Designations: [{
      Type: 'Donation', Amount: d.Amount, FundId: d.Fund?.Id,
      ...(d.NonDeductibleAmount ? { NonDeductibleAmount: d.NonDeductibleAmount } : {}), ...(d.Note ? { Note: d.Note } : {}),
      ...(d.Campaign?.Id ? { CampaignId: d.Campaign.Id } : {}), ...(d.Appeal?.Id ? { AppealId: d.Appeal.Id } : {}), ...(d.QuickbooksAccount?.Id ? { QuickbooksAccountId: d.QuickbooksAccount.Id } : {}),
      AcknowledgementStatus: 'Yes', AcknowledgementInteractionIds: [...(d.AcknowledgementInteractionIds || []), i.Id],
    }],
  }) }, fetchImpl);
  const after = updated?.Designations?.[0];
  if (after?.AcknowledgementStatus !== 'Yes' || Math.abs(Number(updated.Amount) - Number(t.Amount)) > 0.005 || after?.Fund?.Id !== d.Fund?.Id) {
    throw new Error('Bloomerang did not save the acknowledgment as expected; check the gift by hand.');
  }
  return { interactionId: i.Id, date: today };
}

export function problemEmail({ subject, message }) {
  return { subject, html: emailLayout({ title: 'Donation Check Not Processed', body: `<p style="margin:0">${message}</p>` }) };
}

// ─── 5. Review page and approval ─────────────────────────────────────────────

const page = (title, inner, wide = false) => `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)}</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Montserrat:wght@800&display=swap" rel="stylesheet">
<style>body{margin:0;font:15px/1.55 Inter,-apple-system,"Segoe UI",Roboto,sans-serif;color:#4A4A4A;background:#F6F2F4}
header{background:#9B1B5D;background-image:linear-gradient(120deg,#7D1649,#9B1B5D 60%,#B4246C);color:#fff;padding:26px 20px}
header div,main{max-width:640px;margin:0 auto}header h1{margin:18px 0 0;font:800 26px/1.2 Montserrat,Inter,sans-serif}
main{background:#fff;padding:26px 24px 32px}main.wide,header.wide div{max-width:1080px}
.split{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:28px;align-items:start}.scan{position:sticky;top:16px}.split>div>:first-child{margin-top:0}
.scan iframe,.scan img{width:100%;border:1px solid #E9DEE5;border-radius:8px;background:#F6F2F4;display:block}.scan iframe{height:78vh;min-height:420px}
@media(max-width:900px){.split{grid-template-columns:1fr}.scan{position:static}.scan iframe{height:46vh;min-height:300px}}h2{color:#9B1B5D;font-size:16px;margin:24px 0 8px}
label{display:block;font-size:13px;color:#76666F;margin:12px 0 4px}input,select,textarea{width:100%;box-sizing:border-box;font:inherit;padding:9px 11px;border:1px solid #D5C6CF;border-radius:8px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:0 14px}.opt{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border:1px solid #E9DEE5;border-radius:8px;margin:8px 0}
.opt input{width:auto;margin-top:4px}.muted{color:#76666F;font-size:13px}.warn{background:#FBF0DE;border-left:4px solid #965700;padding:12px 14px;border-radius:4px;margin:14px 0}
.bad{background:#FBE7E9;border-left-color:#B3202D}button{background:#9B1B5D;color:#fff;border:0;border-radius:8px;padding:13px 22px;font:700 15px Inter,sans-serif;cursor:pointer;margin-top:22px}
@media(max-width:560px){.grid{grid-template-columns:1fr}}</style></head>
<body><header${wide ? ' class="wide"' : ''}><div><img src="https://supportworkshousing.org/images/logo-white.png" alt="SupportWorks Housing" height="26"><h1>${esc(title)}</h1></div></header><main${wide ? ' class="wide"' : ''}>${inner}</main></body></html>`;

// scanUrl: where the page can load the scan (the mailbox copy); none means no image.
export function reviewPage(token, p, { scanUrl = null } = {}) {
  const c = p.check, prop = p.proposal;
  const unsure = new Set(c.uncertain_fields || []);
  const f = (name, label, value, type = 'text') => `<div><label for="${name}">${label}${unsure.has(name) ? ' <b style="color:#965700">(check this)</b>' : ''}</label><input id="${name}" name="${name}" type="${type}" value="${esc(value ?? '')}"${type === 'number' ? ' step="0.01" min="0.01"' : ''}></div>`;
  const opts = prop.candidates.map((cand, i) => `<label class="opt"><input type="radio" name="account" value="${cand.id}"${(prop.decision === 'existing' && i === 0) ? ' checked' : ''}><span><b>${esc(cand.name)}</b> (ID ${cand.id})<br><span class="muted">${esc([cand.street, cand.city].filter(Boolean).join(', ') || 'No address on file')}. ${cand.lastGift ? `Last gift ${usd(cand.lastGift.amount)} on ${fmtDate(cand.lastGift.date)}.` : 'No gifts yet.'} Match: ${esc(cand.why.join(', '))}.</span></span></label>`).join('');
  const via = c.vehicle && c.vehicle !== 'Personal check' ? `${c.vehicle}${c.payer_name && c.donor_type !== 'Organization' ? ` via ${c.payer_name}` : ''}` : '';
  const note = [via, c.memo ? `Memo: ${c.memo}` : ''].filter(Boolean).join('. ');
  const scan = scanUrl ? `<div class="scan">${/pdf/.test(p.scan?.type || '') ? `<iframe src="${esc(scanUrl)}#toolbar=0&navpanes=0&view=FitH" title="Check scan"></iframe>` : `<img src="${esc(scanUrl)}" alt="Check scan">`}
<p class="muted"><a href="${esc(scanUrl)}" target="_blank" rel="noopener" style="color:#9B1B5D">Open the scan full size</a></p></div>` : '';
  const form = `
${prop.duplicate ? `<div class="warn bad"><b>Already in Bloomerang?</b> Transaction #${prop.duplicate.number} (ID ${prop.duplicate.id}) has the same check number and amount. Approval will be refused while it exists.</div>` : ''}
${c.is_donation === false ? `<div class="warn"><b>This may not be a donation.</b> ${esc(c.non_donation_reason || '')}</div>` : ''}
<p class="muted">Sent by ${esc(p.sender)}. Scan: ${esc(c.source_file || '')}. Correct anything below, then approve. The gift goes to the <b>Unrestricted Fund</b>.</p>
<form method="post">
<input type="hidden" name="t" value="${esc(token)}">
<h2>Gift</h2>
<div class="grid">${f('amount', 'Amount ($)', c.amount, 'number')}${f('check_number', 'Check #', c.check_number)}${f('check_date', 'Check date', c.check_date, 'date')}${f('gift_date', 'Gift date (date received)', new Date().toISOString().slice(0, 10), 'date')}</div>
<label for="note">Note on the gift</label><textarea id="note" name="note" rows="2">${esc(note)}</textarea>
<h2>Donor</h2>
${opts}
<label class="opt"><input type="radio" name="account" value="new"${prop.decision !== 'existing' ? ' checked' : ''}><span><b>Create a new constituent</b><br><span class="muted">Uses the name and address below.</span></span></label>
<label for="donor_type">Type</label><select id="donor_type" name="donor_type"><option${c.donor_type !== 'Organization' ? ' selected' : ''}>Individual</option><option${c.donor_type === 'Organization' ? ' selected' : ''}>Organization</option></select>
<div class="grid">${f('first_name', 'First name', c.first_name)}${f('last_name', 'Last name', c.last_name)}</div>
${f('organization_name', 'Organization name', c.organization_name)}
${f('street', 'Street', c.street)}<div class="grid">${f('city', 'City', c.city)}${f('state', 'State', c.state)}</div>${f('postal_code', 'ZIP', c.postal_code)}
<h2>Thank-you</h2>
<label class="opt"><input type="checkbox" name="send_thanks" value="1" checked><span><b>Email the donor a thank-you</b> and mark the gift acknowledged in Bloomerang<br><span class="muted">Sent to the email on the donor's Bloomerang record, with you copied. Untick it for anonymous gifts or a donor who should get a letter instead. A new constituent has no email yet, so no email is sent.</span></span></label>
<button type="submit">Approve and enter in Bloomerang</button>
<p class="muted">Not a gift, or not ready? Close this page. Nothing is entered unless you approve.</p>
</form>`;
  return scan ? page('Review Check Gift', `<div class="split">${scan}<div>${form}</div></div>`, true) : page('Review Check Gift', form);
}

export const resultPage = (title, html) => page(title, html);

const clean = s => String(s ?? '').trim();
export function readForm(body) {
  const amount = Math.round(Number(body.amount) * 100) / 100;
  const isoOk = s => /^\d{4}-\d{2}-\d{2}$/.test(clean(s));
  const form = {
    amount, check_number: clean(body.check_number), check_date: clean(body.check_date), gift_date: clean(body.gift_date), note: clean(body.note).slice(0, 500),
    account: clean(body.account), donor_type: clean(body.donor_type) === 'Organization' ? 'Organization' : 'Individual',
    first_name: clean(body.first_name), last_name: clean(body.last_name), organization_name: clean(body.organization_name),
    street: clean(body.street), city: clean(body.city), state: clean(body.state), postal_code: clean(body.postal_code),
    send_thanks: body.send_thanks === '1' || body.send_thanks === 'on' || body.send_thanks === true,
  };
  const errors = [];
  if (!(amount > 0 && amount < 10_000_000)) errors.push('Enter the amount.');
  if (!isoOk(form.gift_date)) errors.push('Enter the gift date.');
  if (form.check_date && !isoOk(form.check_date)) errors.push('The check date is not a date.');
  if (form.account !== 'new' && !/^\d+$/.test(form.account)) errors.push('Choose a donor or "Create a new constituent".');
  if (form.account === 'new' && form.donor_type === 'Individual' && !(form.first_name && form.last_name)) errors.push('A new individual needs a first and last name.');
  if (form.account === 'new' && form.donor_type === 'Organization' && !form.organization_name) errors.push('A new organization needs a name.');
  return { form, errors };
}

// Write the approved gift. Refuses if the same check is already there.
export async function approveEntry({ bloomerangKey: key, payload, form, fetchImpl = fetch }) {
  let accountId, accountName, created = false;
  if (form.account === 'new') {
    const address = form.street ? { PrimaryAddress: { Type: form.donor_type === 'Organization' ? 'Work' : 'Home', Street: form.street, City: form.city, State: form.state, PostalCode: form.postal_code, IsPrimary: true } } : {};
    const body = form.donor_type === 'Organization'
      ? { Type: 'Organization', Status: 'Active', FullName: form.organization_name, ...address }
      : { Type: 'Individual', Status: 'Active', FirstName: form.first_name, LastName: form.last_name, ...address };
    // Re-check before creating, so a second approval cannot make a second record.
    const recent = await recentTransactions(key, fetchImpl);
    const dup = findDuplicate({ check_number: form.check_number, amount: form.amount }, recent);
    if (dup && form.check_number) return { refused: dup };
    const c = await bloom(key, '/constituent', { method: 'POST', body: JSON.stringify(body) }, fetchImpl);
    accountId = c.Id; accountName = c.FullName || body.FullName || `${form.first_name} ${form.last_name}`; created = true;
  } else {
    accountId = Number(form.account);
    if (!payload.proposal.candidates.some(c => c.id === accountId)) throw new Error('That donor was not one of the choices on this review.');
    const [recent, theirs] = await Promise.all([
      recentTransactions(key, fetchImpl),
      bloom(key, `/transactions?accountId=${accountId}&take=50&orderBy=Date&orderDirection=Desc`, {}, fetchImpl),
    ]);
    const dup = form.check_number && findDuplicate({ check_number: form.check_number, amount: form.amount }, [...recent, ...(theirs?.Results || [])]);
    if (dup) return { refused: dup };
    accountName = payload.proposal.candidates.find(c => c.id === accountId).name;
  }
  const txn = await bloom(key, '/transaction', { method: 'POST', body: JSON.stringify({
    AccountId: accountId, Date: form.gift_date, Amount: form.amount, Method: 'Check',
    ...(form.check_number ? { CheckNumber: form.check_number } : {}), ...(form.check_date ? { CheckDate: form.check_date } : {}),
    Designations: [{ Type: 'Donation', Amount: form.amount, FundId: UNRESTRICTED_FUND_ID, AcknowledgementStatus: 'No', ...(form.note ? { Note: form.note } : {}) }],
  }) }, fetchImpl);
  return { accountId, accountName, created, transaction: { id: txn.Id, number: txn.TransactionNumber } };
}

// Mail from inside the organization only. The mailbox itself should also be
// set to accept internal senders only; this is the second lock.
export function senderAllowed({ from, headers = [] }) {
  const addr = String(from || '').toLowerCase().trim();
  if (!addr.endsWith('@' + ORG_DOMAIN)) return false;
  const h = name => headers.filter(x => x.name?.toLowerCase() === name).map(x => String(x.value));
  if (h('x-ms-exchange-organization-authas').some(v => /internal/i.test(v))) return true;
  return h('authentication-results').some(v => /dmarc=pass/i.test(v) && new RegExp(`header\\.from=${ORG_DOMAIN.replace('.', '\\.')}`, 'i').test(v));
}
