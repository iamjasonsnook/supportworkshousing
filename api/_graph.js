// Microsoft Graph access to the donation checks mailbox. The website signs in
// as an app registration (MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET) that
// IT has limited to this one mailbox. The leading underscore keeps this file
// from becoming a Vercel function (the plan allows 12).
//
// Microsoft calls /api/admin/check-intake/notify when mail arrives; that
// notification registration lasts under three days, so the daily sweep renews
// it and also picks up anything still sitting in the Inbox.

const GRAPH = 'https://graph.microsoft.com/v1.0';
export const MAILBOX = process.env.CHECK_INTAKE_MAILBOX || 'donationchecks@supportworkshousing.org';
export const PROCESSED = 'Processed';
export const NEEDS_ATTENTION = 'Needs attention';

export const graphConfigured = () => !!(process.env.MS_TENANT_ID && process.env.MS_CLIENT_ID && process.env.MS_CLIENT_SECRET);

let cached = null;
export async function graphToken(fetchImpl = fetch) {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const res = await fetchImpl(`https://login.microsoftonline.com/${process.env.MS_TENANT_ID}/oauth2/v2.0/token`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: process.env.MS_CLIENT_ID, client_secret: process.env.MS_CLIENT_SECRET, scope: 'https://graph.microsoft.com/.default', grant_type: 'client_credentials' }),
  });
  if (!res.ok) throw new Error(`Microsoft sign-in failed (${res.status})`);
  const d = await res.json();
  cached = { token: d.access_token, exp: Date.now() + d.expires_in * 1000 };
  return cached.token;
}

export async function graph(path, init = {}, fetchImpl = fetch) {
  const res = await fetchImpl(path.startsWith('http') ? path : GRAPH + path, {
    // Immutable IDs survive moving a message between folders, so a review
    // link can still find its scan after the message is filed in Processed.
    ...init, headers: { Authorization: `Bearer ${await graphToken(fetchImpl)}`, 'Content-Type': 'application/json', Prefer: 'IdType="ImmutableId"', ...(init.headers || {}) },
  });
  if (res.status === 204) return null;
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) { const e = new Error(`Microsoft Graph ${init.method || 'GET'} ${path.split('?')[0]} failed (${res.status})`); e.status = res.status; throw e; }
  return data;
}

const box = () => `/users/${encodeURIComponent(MAILBOX)}`;
const INBOX_RESOURCE = () => `users/${MAILBOX}/mailFolders('Inbox')/messages`;

// Create the new-mail notification, or extend the one that exists.
export async function ensureSubscription({ notifyUrl, clientState, fetchImpl = fetch }) {
  const exp = new Date(Date.now() + 4000 * 60_000).toISOString(); // Graph allows up to 4230 minutes for mail
  const subs = (await graph('/subscriptions', {}, fetchImpl))?.value || [];
  const mine = subs.find(s => s.notificationUrl === notifyUrl && s.resource?.toLowerCase() === INBOX_RESOURCE().toLowerCase());
  if (mine) {
    await graph(`/subscriptions/${mine.id}`, { method: 'PATCH', body: JSON.stringify({ expirationDateTime: exp }) }, fetchImpl);
    return { renewed: mine.id };
  }
  const s = await graph('/subscriptions', { method: 'POST', body: JSON.stringify({ changeType: 'created', notificationUrl: notifyUrl, resource: INBOX_RESOURCE(), expirationDateTime: exp, clientState }) }, fetchImpl);
  return { created: s.id };
}

export async function inboxMessageIds(fetchImpl = fetch) {
  const d = await graph(`${box()}/mailFolders/inbox/messages?$select=id&$top=25&$orderby=receivedDateTime asc`, {}, fetchImpl);
  return (d?.value || []).map(m => m.id);
}

const folderIds = {};
async function folderId(name, fetchImpl) {
  if (folderIds[name]) return folderIds[name];
  const found = await graph(`${box()}/mailFolders?$filter=displayName eq '${name.replace(/'/g, "''")}'`, {}, fetchImpl);
  folderIds[name] = found?.value?.[0]?.id || (await graph(`${box()}/mailFolders`, { method: 'POST', body: JSON.stringify({ displayName: name }) }, fetchImpl)).id;
  return folderIds[name];
}

// Moving a message out of the Inbox is how it is claimed: a second
// notification for the same message finds it gone and stops. Returns the
// message's new id, or null if it was already moved.
export async function moveMessage(id, folder, fetchImpl = fetch) {
  try {
    const m = await graph(`${box()}/messages/${id}/move`, { method: 'POST', body: JSON.stringify({ destinationId: await folderId(folder, fetchImpl) }) }, fetchImpl);
    return m.id;
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}

export async function getMessage(id, fetchImpl = fetch) {
  const m = await graph(`${box()}/messages/${id}?$select=id,subject,from,receivedDateTime,internetMessageHeaders`, {}, fetchImpl);
  const atts = await graph(`${box()}/messages/${id}/attachments`, {}, fetchImpl);
  return {
    id: m.id, subject: m.subject || '', from: m.from?.emailAddress?.address || '', received: m.receivedDateTime,
    headers: m.internetMessageHeaders || [],
    // Photos pasted into the body arrive as inline attachments; small inline
    // images are signature logos and are skipped.
    attachments: (atts?.value || []).filter(a => a['@odata.type'] === '#microsoft.graph.fileAttachment' && (!a.isInline || (/^image\//i.test(a.contentType || '') && a.size > 50_000)))
      .map(a => ({ id: a.id, name: a.name, mediaType: (a.contentType || '').toLowerCase(), base64: a.contentBytes, size: a.size })),
  };
}

// One attachment's bytes, for showing the scan on the review page.
export async function getAttachment(messageId, attachmentId, fetchImpl = fetch) {
  const a = await graph(`${box()}/messages/${messageId}/attachments/${attachmentId}`, {}, fetchImpl);
  return { name: a.name, mediaType: (a.contentType || 'application/octet-stream').toLowerCase(), bytes: Buffer.from(a.contentBytes || '', 'base64') };
}
