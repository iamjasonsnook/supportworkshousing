// Weekly giving digest: every website gift (Stripe) from the past seven days,
// emailed Friday mornings. The leading underscore keeps this file from
// becoming a Vercel function (the plan allows 12); the route lives in
// api/admin/[...path].js.

import { emailLayout } from './_emailLayout.js';

export const DIGEST_RECIPIENTS = [
  'jsnook@supportworkshousing.org',
  'abogdanovic@supportworkshousing.org',
  'jeffrey@themonumentgroup.net',
];

const TZ = 'America/New_York';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const usd = v => v.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const usd0 = v => Math.round(v).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
const day = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: TZ });
const longDay = (d, year) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', ...(year ? { year: 'numeric' } : {}), timeZone: TZ });
const firstName = n => n.split(' ')[0];

// The date and hour in New York for an instant.
export function nyParts(date) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
    .formatToParts(date).filter(x => x.type !== 'literal').map(x => [x.type, Number(x.value)]));
  return p;
}

// The instant of midnight in New York on a calendar date, across DST.
function nyMidnight(y, m, d) {
  let t = Date.UTC(y, m - 1, d);
  for (let i = 0; i < 2; i++) {
    const p = nyParts(new Date(t));
    t -= Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - Date.UTC(y, m - 1, d);
  }
  return new Date(t);
}

// The seven whole New York days before the day of `now`: run on a Friday,
// that is last Friday through Thursday, so weeks never overlap or leave gaps.
export function weekWindow(now = new Date()) {
  const p = nyParts(now);
  const end = nyMidnight(p.year, p.month, p.day);
  const s = new Date(Date.UTC(p.year, p.month - 1, p.day - 7));
  const start = nyMidnight(s.getUTCFullYear(), s.getUTCMonth() + 1, s.getUTCDate());
  return { start, end, last: new Date(end.getTime() - 1) };
}

// Stripe charges (with customer and balance_transaction expanded) to gifts.
// Staff test gifts ($1 or less from the admin's own email) are counted apart.
export function digestGifts(charges, { adminEmail = '' } = {}) {
  const ok = charges.filter(c => c.status === 'succeeded' && !c.refunded).sort((a, b) => a.created - b.created);
  const email = c => (c.metadata?.donor_email || c.billing_details?.email || c.receipt_email || '').toLowerCase();
  const isTest = c => c.amount <= 100 && adminEmail && email(c) === adminEmail.toLowerCase();
  const gifts = ok.filter(c => !isTest(c)).map(c => {
    const cu = c.customer && typeof c.customer === 'object' ? c.customer : {};
    const name = c.metadata?.donor_name || c.billing_details?.name || cu.name || 'Name not given';
    const monthly = !!c.invoice || /^Subscription/.test(c.description || '') || c.metadata?.donation_type === 'monthly';
    const amount = c.amount / 100;
    const fee = typeof c.balance_transaction === 'object' && c.balance_transaction ? c.balance_transaction.fee / 100 : 0;
    // A covered fee shows as a round gift grossed up: (gift + 0.30) / (1 - 0.022).
    const base = Math.round((amount * (1 - 0.022) - 0.30) * 100) / 100;
    const covered = !monthly && amount % 1 !== 0 && Math.abs(base - Math.round(base)) < 0.02 && Math.round(base) % 5 === 0;
    return { date: new Date(c.created * 1000), name, amount, fee, monthly, covered, gift: covered ? Math.round(base) : amount, channel: 'online' };
  });
  return { gifts, tests: ok.length - gifts.length };
}

// Check gifts come from Bloomerang (method Check, dated within the week, New
// York dates). Online gifts are also logged in Bloomerang, but as card gifts,
// so taking only checks here never counts a gift twice.
const nyDate = d => { const p = nyParts(d); return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`; };
export function checkGifts(transactions, names, { start, end }) {
  const from = nyDate(start), to = nyDate(end);
  return transactions
    .filter(t => t.Method === 'Check' && String(t.IsRefunded) !== 'true' && t.Date.slice(0, 10) >= from && t.Date.slice(0, 10) < to)
    // Noon UTC keeps the gift on its own date in New York.
    .map(t => ({ date: new Date(`${t.Date.slice(0, 10)}T17:00:00Z`), name: names[t.AccountId] || 'Name not found', amount: Number(t.Amount), fee: 0, monthly: false, covered: false, gift: Number(t.Amount), channel: 'check', checkNumber: t.CheckNumber || '' }));
}

export async function loadCheckGifts({ bloomerangKey: key, start, end, fetchImpl = fetch }) {
  const get = async p => { const r = await fetchImpl('https://api.bloomerang.co/v2' + p, { headers: { 'X-API-KEY': key, Accept: 'application/json' } }); if (!r.ok) throw new Error(`Bloomerang ${p.split('?')[0]} failed (${r.status})`); return r.json(); };
  const from = nyDate(start), txs = [];
  for (let skip = 0; skip < 1000; skip += 50) {
    const page = (await get(`/transactions?skip=${skip}&take=50&orderBy=Date&orderDirection=Desc`))?.Results || [];
    txs.push(...page);
    if (page.length < 50 || page.at(-1).Date.slice(0, 10) < from) break;
  }
  const names = {};
  for (const id of [...new Set(txs.filter(t => t.Method === 'Check').map(t => t.AccountId))]) names[id] = (await get(`/constituent/${id}`)).FullName;
  return checkGifts(txs, names, { start, end });
}

export function givingDigestEmail({ gifts: all, tests = 0, start, last, checksUnavailable = false }) {
  const gifts = [...all].sort((a, b) => a.date - b.date);
  const range = `${longDay(start)} to ${longDay(last, true)}`;
  const gross = gifts.reduce((s, g) => s + g.amount, 0), fees = gifts.reduce((s, g) => s + g.fee, 0);
  const donors = new Set(gifts.map(g => g.name.toLowerCase())).size;
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  const excluded = [tests ? `${plural(tests, 'staff test gift')} of $1` : '', checksUnavailable ? 'check gifts, because Bloomerang could not be reached this week' : '', 'monthly gifts still charged through Bloomerang', 'gifts entered in Bloomerang by bank transfer, cash or stock'].filter(Boolean).join('; ');
  const online = gifts.filter(g => g.channel !== 'check'), checks = gifts.filter(g => g.channel === 'check');
  const sum = list => list.reduce((s, g) => s + g.amount, 0);

  if (!gifts.length) {
    return {
      subject: 'Weekly Giving Digest: no gifts this week',
      html: emailLayout({ title: 'Weekly Giving Digest', subtitle: range, body: `<p style="margin:0">No gifts came in online or by check between ${range}.</p>
<p style="font-size:13px;color:#76666F;margin:20px 0 0">Not included: ${excluded}.</p>` }),
    };
  }

  const largest = gifts.reduce((a, g) => g.amount > a.amount ? g : a);
  const covered = gifts.filter(g => g.covered), monthly = gifts.filter(g => g.monthly);
  const notes = [];
  if (covered.length) notes.push(`${plural(covered.length, 'donor')} chose to cover the card fee (${covered.map(g => `${esc(firstName(g.name))} on a ${usd(g.gift)} gift`).join(', ')}), so ${covered.length === 1 ? 'the full gift' : 'their full gifts'} arrived with nothing deducted.`);
  if (monthly.length) notes.push(`${plural(monthly.length, 'monthly gift')} through the website (${monthly.map(g => esc(firstName(g.name))).join(', ')}).`);
  if (checks.length) notes.push(`${plural(checks.length, 'check gift')} totaling ${usd(sum(checks))} (${checks.map(g => esc(g.name)).join(', ')}).`);
  notes.push(`Largest gift: ${usd(largest.amount)} from ${esc(largest.name)} on ${day(largest.date)}.`);

  const tile = (label, value, sub) => `<td width="33%" style="padding:6px;vertical-align:top"><div style="background:#FBEFF5;border-radius:8px;padding:16px 12px;text-align:center">
<div style="font-size:12px;color:#76666F;text-transform:uppercase;letter-spacing:.06em;font-weight:600">${label}</div>
<div style="font-size:26px;font-weight:700;color:#9B1B5D;line-height:1.3">${value}</div><div style="font-size:12px;color:#76666F">${sub}</div></div></td>`;
  const th = (t, r) => `<th style="text-align:${r ? 'right' : 'left'};font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#76666F;padding:8px 6px;border-bottom:2px solid #E9DEE5">${t}</th>`;
  const td = (t, r, extra = '') => `<td style="text-align:${r ? 'right' : 'left'};padding:9px 6px;border-bottom:1px solid #F0E7EC;font-size:14px;${extra}">${t}</td>`;
  const type = g => g.channel === 'check' ? `Check${g.checkNumber ? ` #${esc(g.checkNumber)}` : ''}` : g.monthly ? 'Online, monthly' : g.covered ? 'Online, one-time (fees covered)' : 'Online, one-time';

  const body = `<p style="margin:0 0 4px">Gifts received in the past week, <b>${range}</b>: online gifts through the website and check gifts entered in Bloomerang.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:14px -6px 18px;width:calc(100% + 12px);border-collapse:collapse"><tr>
${tile('Raised', usd0(gross), `${usd0(sum(online))} online, ${usd0(sum(checks))} by check`)}${tile('Gifts', gifts.length, `${online.length} online, ${checks.length} by check`)}${tile('Average gift', usd0(gross / gifts.length), `${usd(fees)} in online card fees`)}
</tr></table>
<h3 style="color:#9B1B5D;font-size:16px;margin:8px 0 6px">Highlights</h3>
<ul style="margin:0 0 18px;padding-left:20px">${notes.map(n => `<li style="margin-bottom:6px">${n}</li>`).join('')}</ul>
<h3 style="color:#9B1B5D;font-size:16px;margin:8px 0 6px">Every gift</h3>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><thead><tr>${th('Date')}${th('Donor')}${th('Type')}${th('Amount', true)}</tr></thead>
<tbody>${gifts.map(g => `<tr>${td(day(g.date), false, 'white-space:nowrap')}${td(esc(g.name), false, 'font-weight:600;color:#22161E')}${td(type(g), false, 'color:#76666F;font-size:13px')}${td(usd(g.amount), true, 'white-space:nowrap')}</tr>`).join('')}
<tr>${td('<b>Total</b>', false, 'border-bottom:0')}${td('', false, 'border-bottom:0')}${td(plural(gifts.length, 'gift'), false, 'border-bottom:0;color:#76666F;font-size:13px')}${td(`<b>${usd(gross)}</b>`, true, 'border-bottom:0')}</tr></tbody></table>
<p style="font-size:13px;color:#76666F;margin:20px 0 0">Not included: ${excluded}.</p>`;

  return {
    subject: `Weekly Giving Digest: ${usd(gross)} from ${plural(gifts.length, 'gift')}`,
    html: emailLayout({ title: 'Weekly Giving Digest', subtitle: range, body }),
  };
}
