import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../api/_email.js', () => ({ sendEmail: vi.fn(async () => ({})) }));
vi.mock('../api/_rateLimit.js', () => ({ checkRateLimit: vi.fn(() => true) }));
vi.mock('../api/_bloomerang.js', () => ({
  findOrCreateConstituent: vi.fn(async () => ({ id: 777, matched: 'email' })),
  createPledge: vi.fn(async () => ({ transactionId: 4242 })),
}));

const { sendEmail } = await import('../api/_email.js');
const { checkRateLimit } = await import('../api/_rateLimit.js');
const { findOrCreateConstituent, createPledge } = await import('../api/_bloomerang.js');
const { default: handler, cleanStockPledge } = await import('../api/send-donation-notification.js');

function call(body) {
  const res = { statusCode: 200, headers: {}, body: null,
    setHeader(k, v) { this.headers[k] = v; }, status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; }, end() { return this; } };
  return handler({ method: 'POST', headers: { origin: 'https://supportworkshousing.org' }, body, socket: {} }, res).then(() => res);
}

const valid = { kind: 'stock-pledge', name: 'Ada Lovelace', email: 'ada@example.org', approxValue: '$5,000', transferDate: '2026-11-02' };
const to = addr => sendEmail.mock.calls.find(c => c[0].to === addr)?.[0];

describe('stock pledge', () => {
  beforeEach(() => {
    sendEmail.mockClear(); findOrCreateConstituent.mockClear(); createPledge.mockClear();
    checkRateLimit.mockReturnValue(true); process.env.BLOOMERANG_API_KEY = 'bl_test';
  });

  it('emails the donor, jsnook and accounting', async () => {
    const res = await call(valid);
    expect(res.statusCode).toBe(200);
    expect(sendEmail.mock.calls.map(c => c[0].to).sort()).toEqual(
      ['accountsreceivable@supportworkshousing.org', 'ada@example.org', 'jsnook@supportworkshousing.org']);
  });

  it('logs a pledge in Bloomerang for the value, due on the transfer date', async () => {
    await call(valid);
    expect(findOrCreateConstituent).toHaveBeenCalledWith('bl_test', { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.org' });
    expect(createPledge).toHaveBeenCalledWith('bl_test', expect.objectContaining({ accountId: 777, amount: 5000, dueDate: '2026-11-02' }));
    expect(to('jsnook@supportworkshousing.org').html).toContain('Logged in Bloomerang as a pledge of $5,000.00');
  });

  it('still sends every email if Bloomerang fails, and says so to staff', async () => {
    createPledge.mockRejectedValueOnce(new Error('Bloomerang POST /transaction failed (500)'));
    const res = await call(valid);
    expect(res.statusCode).toBe(200);
    expect(sendEmail).toHaveBeenCalledTimes(3);
    expect(to('accountsreceivable@supportworkshousing.org').html).toContain('could NOT be logged in Bloomerang');
  });

  it('gives the donor the value, the date and the transfer instructions', async () => {
    await call(valid);
    const donor = to('ada@example.org');
    expect(donor.html).toContain('Dear Ada,');
    expect(donor.html).toContain('$5,000.00');
    expect(donor.html).toContain('November 2, 2026');
    expect(donor.html).toContain('8862');
    expect(donor.html).toContain('758-02792');
    expect(donor.html).toContain('value of the shares on the day they arrive');
    expect(to('jsnook@supportworkshousing.org').subject).toBe('Stock gift pledged: about $5,000.00 from Ada Lovelace');
  });

  it('escapes what the donor typed', async () => {
    await call({ ...valid, name: 'Ada <b>Bold</b>' });
    expect(to('jsnook@supportworkshousing.org').html).not.toContain('<b>Bold</b>');
  });

  it('rejects a bad value, email, date or name, and does nothing', async () => {
    for (const bad of [{ approxValue: '' }, { approxValue: 'lots' }, { approxValue: '0.5' }, { approxValue: '99999999' },
      { email: 'nope' }, { transferDate: '' }, { name: ' ' }]) {
      expect((await call({ ...valid, ...bad })).statusCode).toBe(400);
    }
    expect(sendEmail).not.toHaveBeenCalled();
    expect(createPledge).not.toHaveBeenCalled();
  });

  it('hides the email service\'s error from the donor', async () => {
    sendEmail.mockRejectedValueOnce(new Error('EmailJS send failed (403): API access in strict mode'));
    const res = await call(valid);
    expect(res.statusCode).toBe(502);
    expect(JSON.stringify(res.body)).not.toContain('EmailJS');
  });

  it('is rate limited', async () => {
    checkRateLimit.mockReturnValue(false);
    expect((await call(valid)).statusCode).toBe(429);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(createPledge).not.toHaveBeenCalled();
  });

  it('reads values written with $ and commas, and trims long input', () => {
    expect(cleanStockPledge({ ...valid, approxValue: ' $12,345.678 ' }).data.approxValue).toBe(12345.68);
    expect(cleanStockPledge({ ...valid, name: 'n'.repeat(500) }).data.name).toHaveLength(120);
  });
});
