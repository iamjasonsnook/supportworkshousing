// Stock pledges from the public form are reviewed by staff before anything
// is written to Bloomerang: the form is open to anyone, so a pledge must
// never land on an existing donor's record just because someone typed their
// email. The staff email links to a review page (signed link, like the check
// intake); approving creates the pledge on the record staff chose. The
// leading underscore keeps this file from becoming a Vercel function.

import crypto from 'crypto';
import { createPledge } from './_bloomerang.js';
import { page } from './_checkIntake.js';

const BLOOMERANG = 'https://api.bloomerang.co/v2';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const usd = v => Number(v).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const longDate = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' }) : ''; };

async function bloom(key, path, init = {}, fetchImpl = fetch) {
  const res = await fetchImpl(BLOOMERANG + path, { ...init, headers: { 'X-API-KEY': key, 'Content-Type': 'application/json', Accept: 'application/json' } });
  const text = await res.text();
  let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new Error(`Bloomerang ${init.method || 'GET'} ${path.split('?')[0]} failed (${res.status})`);
  return data;
}

// A reference that rides in the pledge note, so the same review link
// approved twice is caught.
export const newPledgeRef = () => `SP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
export const pledgeNote = (d, ref) => `Stock pledge via website: approximately ${usd(d.approxValue)}, transfer expected ${d.transferDate} to Merrill Lynch (DTC 8862). Ref ${ref}.`;

// Records that might be this donor: exact email first, then exact name.
export async function pledgeCandidates({ bloomerangKey: key, pledge, fetchImpl = fetch }) {
  const [first, ...rest] = pledge.name.trim().split(/\s+/);
  const last = rest.join(' ');
  const seen = new Map();
  const add = (c, why) => { const prev = seen.get(c.Id); seen.set(c.Id, { id: c.Id, name: c.FullName, email: c.PrimaryEmail?.Value || '', why: prev ? [...prev.why, why] : [why] }); };
  const byEmail = await bloom(key, `/constituents/search?search=${encodeURIComponent(pledge.email)}&take=10`, {}, fetchImpl);
  for (const c of byEmail?.Results || []) if (c.PrimaryEmail?.Value?.toLowerCase() === pledge.email.toLowerCase()) add(c, 'same email');
  if (first && last) {
    const byName = await bloom(key, `/constituents/search?search=${encodeURIComponent(`${first} ${last}`)}&take=20`, {}, fetchImpl);
    for (const c of byName?.Results || []) if ((c.FirstName || '').toLowerCase() === first.toLowerCase() && (c.LastName || '').toLowerCase() === last.toLowerCase()) add(c, 'same name');
  }
  return [...seen.values()].slice(0, 6);
}

export function pledgeReviewPage(token, p, errors = []) {
  const d = p.pledge, [first, ...rest] = d.name.trim().split(/\s+/);
  const opts = p.candidates.map(c => `<label class="opt"><input type="radio" name="account" value="${esc(c.id)}"><span><b>${esc(c.name)}</b> (ID ${esc(c.id)})<br><span class="muted">${esc(c.email || 'No email on file')}. Match: ${esc(c.why.join(', '))}.</span></span></label>`).join('');
  return page('Review Stock Pledge', `
${errors.length ? `<div class="warn bad"><b>Fix this first:</b> ${errors.map(esc).join(' ')}</div>` : ''}
<p class="muted">Submitted through the website's stock gift form. Anyone can use that form, so check this is a real pledge before logging it. Nothing is in Bloomerang yet.</p>
<h2>Pledge</h2>
<table role="presentation" style="border-collapse:collapse">
<tr><td style="padding:4px 18px 4px 0;color:#76666F">Approximate value</td><td>${esc(usd(d.approxValue))}</td></tr>
<tr><td style="padding:4px 18px 4px 0;color:#76666F">Expected transfer</td><td>${esc(longDate(d.transferDate))}</td></tr>
<tr><td style="padding:4px 18px 4px 0;color:#76666F">Name</td><td>${esc(d.name)}</td></tr>
<tr><td style="padding:4px 18px 4px 0;color:#76666F">Email</td><td>${esc(d.email)}</td></tr></table>
<form method="post">
<input type="hidden" name="t" value="${esc(token)}">
<h2>Donor</h2>
${opts || '<p class="muted">No Bloomerang record has this email or exact name.</p>'}
<label class="opt"><input type="radio" name="account" value="new"${opts ? '' : ' checked'}><span><b>Create a new constituent</b><br><span class="muted">With the name and email below.</span></span></label>
<div class="grid"><div><label for="first_name">First name</label><input id="first_name" name="first_name" value="${esc(first)}"></div><div><label for="last_name">Last name</label><input id="last_name" name="last_name" value="${esc(rest.join(' '))}"></div></div>
<button type="submit">Log pledge in Bloomerang</button>
<p class="muted">Not a real pledge? Close this page. Nothing is logged unless you approve.</p>
</form>`);
}

export function readPledgeForm(body, payload) { // payload: { candidates }
  const account = String(body.account ?? '').trim();
  const form = { account, first_name: String(body.first_name ?? '').trim().slice(0, 60), last_name: String(body.last_name ?? '').trim().slice(0, 60) };
  const errors = [];
  if (account !== 'new' && !payload.candidates.some(c => String(c.id) === account)) errors.push('Choose a donor or "Create a new constituent".');
  if (account === 'new' && !(form.first_name && form.last_name)) errors.push('A new constituent needs a first and last name.');
  return { form, errors };
}

// Logs the pledge on the chosen record, once. Refuses if this pledge's
// reference is already in Bloomerang (the link was approved before).
export async function approvePledge({ bloomerangKey: key, payload, form, fetchImpl = fetch }) {
  const d = payload.pledge;
  const hasRef = list => (list || []).find(t => (t.Designations || []).some(g => String(g.Note || '').includes(`Ref ${payload.ref}`)));
  // Already logged (the link approved before)? Look at the newest gifts first.
  const recent = await bloom(key, '/transactions?take=50&orderBy=CreatedDate&orderDirection=Desc', {}, fetchImpl);
  const already = hasRef(recent?.Results);
  if (already) return { refused: { id: already.Id, number: already.TransactionNumber } };
  let accountId, accountName, created = false;
  if (form.account === 'new') {
    const c = await bloom(key, '/constituent', { method: 'POST', body: JSON.stringify({ Type: 'Individual', Status: 'Active', FirstName: form.first_name, LastName: form.last_name, PrimaryEmail: { Type: 'Home', Value: d.email, IsPrimary: true } }) }, fetchImpl);
    accountId = c.Id; accountName = c.FullName || `${form.first_name} ${form.last_name}`; created = true;
  } else {
    const chosen = payload.candidates.find(c => String(c.id) === form.account);
    accountId = chosen.id; accountName = chosen.name;
    const theirs = await bloom(key, `/transactions?accountId=${accountId}&take=50&orderBy=Date&orderDirection=Desc`, {}, fetchImpl);
    const dup = hasRef(theirs?.Results);
    if (dup) return { refused: { id: dup.Id, number: dup.TransactionNumber } };
  }
  const { transactionId } = await createPledge(key, { accountId, amount: d.approxValue, dueDate: d.transferDate, note: pledgeNote(d, payload.ref) });
  return { accountId, accountName, created, transactionId };
}
