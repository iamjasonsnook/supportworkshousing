// Cleaning for the public volunteer forms (supply drives and Community
// Connections). The leading underscore keeps this file from becoming a
// Vercel function (the plan allows 12).
//
// Everything a visitor sends ends up in emails from SupportWorks, so: one
// valid email address only, length limits on free text, and the drop-off
// location's name and address come from this list, never from the form.

export { isOneEmail } from './_email.js';

// Keep in step with the locations offered in src/components/GetInvolved.jsx.
export const LOCATIONS = {
  'clay-house': { name: 'New Clay House', address: '707 N Harrison St, Richmond, VA 23220' },
};

export const clip = (value, max) => String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max);
