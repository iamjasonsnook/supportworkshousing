import { describe, it, expect, vi, beforeEach } from 'vitest';

// Real address checks, fake sending.
vi.mock('../api/_email.js', async orig => ({ ...(await orig()), sendEmail: vi.fn(async () => ({})) }));
vi.mock('../api/_rateLimit.js', () => ({ checkRateLimit: vi.fn(() => true) }));
vi.mock('../api/_people.js', () => ({ findOrCreatePerson: vi.fn(async () => null) }));

// A Supabase stand-in that records inserts and answers selects with `row`.
const db = { row: null, inserts: [], updates: [] };
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => {
    const chain = table => {
      const q = {
        select: () => q, eq: () => q, order: () => q,
        single: async () => ({ data: db.row ?? { id: 'new-id', ...db.inserts.at(-1)?.[0] }, error: null }),
        insert: rows => { db.inserts.push(rows); return q; },
        update: vals => { db.updates.push({ table, vals }); return { eq: async () => ({ error: null }) }; },
      };
      return q;
    };
    return { from: chain };
  },
}));

const { parseRecipients, isOneEmail } = await vi.importActual('../api/_email.js');
const { sendEmail } = await import('../api/_email.js');

const run = async (handler, { method = 'POST', url = '/', body, headers = {} }) => {
  const res = { statusCode: 200, headers: {}, body: null,
    status(c) { this.statusCode = c; return this; }, setHeader(k, v) { this.headers[k] = v; return this; },
    json(b) { this.body = b; return this; }, send(b) { this.body = b; return this; }, end() { return this; } };
  await handler({ method, url, body, headers: { origin: 'https://supportworkshousing.org', ...headers }, socket: {} }, res);
  return res;
};
const sentTo = addr => sendEmail.mock.calls.map(c => c[0]).filter(e => e.to === addr);
const ATTACK = '<a href="https://evil.example/pay">Update your payment</a>';

beforeEach(() => { sendEmail.mockClear(); db.row = null; db.inserts = []; db.updates = []; });

describe('who the website will email', () => {
  it('one plain address, or a list only of staff, or a list the code asks for', () => {
    expect(parseRecipients('donor@example.org')).toEqual(['donor@example.org']);
    expect(parseRecipients('jsnook@supportworkshousing.org, abogdanovic@supportworkshousing.org')).toHaveLength(2);
    expect(() => parseRecipients('a@x.com, b@y.com')).toThrow('more than one recipient');
    expect(parseRecipients('a@supportworkshousing.org, jeffrey@themonumentgroup.net', { multipleRecipients: true })).toHaveLength(2);
    for (const bad of ['a@x.com; b@y.com', 'a@x.com\r\nBcc: c@z.com', 'not an email', '"x"@y.com', '', 'a@b']) {
      expect(() => parseRecipients(bad)).toThrow();
    }
    expect(isOneEmail("o'brien@example.org")).toBe(true);
  });

  it('refuses a list before anything is sent, and keeps subjects to one line', async () => {
    const { sendEmail: real } = await vi.importActual('../api/_email.js');
    const realFetch = globalThis.fetch;
    const calls = [];
    globalThis.fetch = async (u, init) => { calls.push(JSON.parse(init.body)); return { ok: true }; };
    try {
      await expect(real({ to: 'a@x.com, b@y.com', subject: 's', html: 'h' })).rejects.toThrow();
      expect(calls).toHaveLength(0);
      await real({ to: 'a@x.com', subject: 'Hello\r\nBcc: evil@x.com', html: 'h', replyTo: 'bad, address' });
      expect(calls[0].template_params).toMatchObject({ to_email: 'a@x.com', email_subject: 'Hello Bcc: evil@x.com', reply_to: '' });
    } finally { globalThis.fetch = realFetch; }
  });
});

describe('supply drive form', () => {
  const good = { location_id: 'clay-house', location_name: 'X', location_address: ATTACK, drop_off_date: 'Tuesday, November 10', drop_off_time: '9:00 AM - 5:00 PM', contact_name: 'Ada <b>L</b>', contact_email: 'ada@example.org', contact_phone: '804-555-1234', selected_items: ['Dish soap'] };
  it('turns away a list of addresses or an unknown location, sending nothing', async () => {
    const { default: handler } = await import('../api/supply-drives.js');
    expect((await run(handler, { body: { ...good, contact_email: 'a@x.com, b@y.com, c@z.com' } })).statusCode).toBe(400);
    expect((await run(handler, { body: { ...good, location_id: 'somewhere-else' } })).statusCode).toBe(400);
    expect(sendEmail).not.toHaveBeenCalled();
  });
  it('uses its own location list and escapes what the visitor typed', async () => {
    const { default: handler } = await import('../api/supply-drives.js');
    const r = await run(handler, { body: good });
    expect(r.statusCode).toBe(200);
    const receipt = sentTo('ada@example.org')[0];
    expect(receipt.html).toContain('707 N Harrison St, Richmond, VA 23220');
    expect(receipt.html).not.toContain('evil.example');
    expect(receipt.html).toContain('Ada &lt;b&gt;L&lt;/b&gt;');
  });
});

describe('Community Connections form', () => {
  const good = { location: { id: 'clay-house', name: 'Fake', address: ATTACK }, timeSlot: { id: 's1', day: 'Thursday, November 19', time: '6:00 PM - 8:00 PM' },
    group: { name: 'Test Group', size: 8 }, contact: { name: 'Ada', email: 'ada@example.org', phone: '804-555-1234' }, event: { foodPlan: 'bring', activityPlan: 'bingo', propertyNotes: ATTACK },
    recipients: { propertyManager: 'attacker@evil.example' } };
  it('turns away a list of addresses, sending nothing', async () => {
    const { default: handler } = await import('../api/connection-nights.js');
    expect((await run(handler, { body: { ...good, contact: { ...good.contact, email: 'a@x.com,b@y.com' } } })).statusCode).toBe(400);
    expect(sendEmail).not.toHaveBeenCalled();
  });
  it('never lets the form choose who approves, and stores the real location', async () => {
    process.env.SUPABASE_URL = 'https://db.example'; process.env.SUPABASE_SERVICE_KEY = 'k';
    try {
      const { default: handler } = await import('../api/connection-nights.js');
      const r = await run(handler, { body: good });
      expect(r.statusCode).toBe(200);
      const row = db.inserts[0][0];
      expect(row.property_manager_email).not.toBe('attacker@evil.example');
      expect(row.location_address).toBe('707 N Harrison St, Richmond, VA 23220');
      expect(sendEmail.mock.calls.every(c => !c[0].html.includes('evil.example">'))).toBe(true);
    } finally { delete process.env.SUPABASE_URL; delete process.env.SUPABASE_SERVICE_KEY; }
  });
});

describe('approving from the admin portal', () => {
  it('escapes everything the requester typed in the confirmation email', async () => {
    Object.assign(process.env, { ADMIN_PASSWORD: 'pw', ADMIN_TOKEN_SECRET: 'test-secret', SUPABASE_URL: 'https://db.example', SUPABASE_SERVICE_KEY: 'k' });
    try {
      const { default: handler } = await import('../api/admin/[...path].js');
      const login = await run(handler, { url: '/api/admin/login', body: { password: 'pw' } });
      const auth = { authorization: `Bearer ${login.body.token}` };
      db.row = { id: 'e1', contact_email: 'vol@example.org', contact_name: `Ada ${ATTACK}`, location_name: 'New Clay House', location_address: ATTACK, time_slot_day: 'Thu', time_slot_time: '6pm', group_size: 8 };
      expect((await run(handler, { url: '/api/admin/events/e1/approve', headers: auth })).statusCode).toBe(200);
      db.row = { id: 'd1', contact_email: 'vol@example.org', contact_name: 'Ada', location_name: 'New Clay House', location_address: ATTACK, drop_off_date: 'Tue', drop_off_time: '9am', selected_items: [ATTACK] };
      expect((await run(handler, { url: '/api/admin/supply-drives/d1/approve', headers: auth })).statusCode).toBe(200);
      const emails = sentTo('vol@example.org');
      expect(emails).toHaveLength(2);
      for (const e of emails) {
        expect(e.html).not.toContain('<a href="https://evil.example');
        expect(e.html).toContain('&lt;a href=&quot;https://evil.example/pay&quot;&gt;');
      }
    } finally { for (const k of ['ADMIN_PASSWORD', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY']) delete process.env[k]; }
  });
});
