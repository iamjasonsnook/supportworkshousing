import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../api/_email.js', () => ({ sendEmail: vi.fn(async () => ({})) }));
vi.mock('../api/_rateLimit.js', () => ({ checkRateLimit: vi.fn(() => true) }));

const { sendEmail } = await import('../api/_email.js');
const { checkRateLimit } = await import('../api/_rateLimit.js');
const { default: handler, cleanStockPledge } = await import('../api/send-donation-notification.js');

function call(body) {
  const res = { statusCode: 200, headers: {}, body: null,
    setHeader(k, v) { this.headers[k] = v; }, status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; }, end() { return this; } };
  return handler({ method: 'POST', headers: { origin: 'https://supportworkshousing.org' }, body, socket: {} }, res).then(() => res);
}

const valid = {
  kind: 'stock-pledge', name: 'Ada Lovelace', email: 'ada@example.org',
  gift: '25 shares of Apple (AAPL) <b>and</b> 10 of MSFT', transferDate: '2026-11-02',
};

describe('stock pledge', () => {
  beforeEach(() => { sendEmail.mockClear(); checkRateLimit.mockReturnValue(true); });

  it('emails staff, accounting and the donor', async () => {
    const res = await call(valid);
    expect(res.statusCode).toBe(200);
    expect(sendEmail).toHaveBeenCalledTimes(3);
    const to = sendEmail.mock.calls.map(c => c[0].to);
    expect(to).toContain('ada@example.org');
    expect(to).toContain('accountsreceivable@supportworkshousing.org');
  });

  it('gives the donor the transfer instructions, and staff the gift', async () => {
    await call(valid);
    const donor = sendEmail.mock.calls.find(c => c[0].to === 'ada@example.org')[0];
    expect(donor.html).toContain('8862');
    expect(donor.html).toContain('758-02792');
    const staff = sendEmail.mock.calls.find(c => c[0].to === 'accountsreceivable@supportworkshousing.org')[0];
    expect(staff.subject).toContain('from Ada Lovelace: 25 shares of Apple (AAPL)');
    expect(donor.html).toContain('Dear Ada,');
    expect(donor.html).toContain('be in touch to confirm');
    expect(staff.html).toContain('November 2, 2026');
  });

  it('escapes what the donor typed', async () => {
    await call(valid);
    const staff = sendEmail.mock.calls[0][0].html;
    expect(staff).not.toContain('<b>and</b>');
    expect(staff).toContain('&lt;b&gt;and&lt;/b&gt;');
  });

  it('rejects a pledge with no stock, a bad email or no date, and sends nothing', async () => {
    for (const bad of [{ gift: '' }, { email: 'nope' }, { transferDate: '' }, { name: ' ' }]) {
      const res = await call({ ...valid, ...bad });
      expect(res.statusCode).toBe(400);
    }
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('hides the email service\'s error from the donor', async () => {
    sendEmail.mockRejectedValueOnce(new Error('EmailJS send failed (403): API access in strict mode'));
    const res = await call(valid);
    expect(res.statusCode).toBe(502);
    expect(JSON.stringify(res.body)).not.toContain('EmailJS');
  });

  it('is rate limited', async () => {
    checkRateLimit.mockReturnValue(false);
    const res = await call(valid);
    expect(res.statusCode).toBe(429);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('trims long input', () => {
    const { data } = cleanStockPledge({ ...valid, gift: 'g'.repeat(5000), name: 'n'.repeat(500) });
    expect(data.gift).toHaveLength(300);
    expect(data.name).toHaveLength(120);
  });

  it('leaves card donations on their existing path', async () => {
    const res = await call({ transactionId: 'pi_1', amount: '50', firstName: 'A', email: 'a@example.org' });
    expect(res.statusCode).toBe(200);
    expect(sendEmail).toHaveBeenCalledTimes(2);
  });
});
