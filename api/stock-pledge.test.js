import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./_email.js', () => ({ sendEmail: vi.fn(async () => ({})) }));
vi.mock('./_rateLimit.js', () => ({ checkRateLimit: vi.fn(() => true) }));

const { sendEmail } = await import('./_email.js');
const { checkRateLimit } = await import('./_rateLimit.js');
const { default: handler, cleanStockPledge } = await import('./send-donation-notification.js');

function call(body) {
  const res = { statusCode: 200, headers: {}, body: null,
    setHeader(k, v) { this.headers[k] = v; }, status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; }, end() { return this; } };
  return handler({ method: 'POST', headers: { origin: 'https://supportworkshousing.org' }, body, socket: {} }, res).then(() => res);
}

const valid = {
  kind: 'stock-pledge', firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.org',
  stocks: [{ name: 'Apple (AAPL)', shares: '25' }, { name: '', shares: '' }],
  approxValue: '5000', transferDate: '2026-11-02', brokerFirm: 'Fidelity', note: 'In memory of <b>Byron</b>',
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
    expect(staff.subject).toContain('Apple (AAPL)');
    expect(staff.html).toContain('25 shares');
    expect(staff.html).toContain('November 2, 2026');
  });

  it('escapes what the donor typed', async () => {
    await call(valid);
    const staff = sendEmail.mock.calls[0][0].html;
    expect(staff).not.toContain('<b>Byron</b>');
    expect(staff).toContain('&lt;b&gt;Byron&lt;/b&gt;');
  });

  it('rejects a pledge with no stock, a bad email or no date, and sends nothing', async () => {
    for (const bad of [{ stocks: [] }, { email: 'nope' }, { transferDate: '' }]) {
      const res = await call({ ...valid, ...bad });
      expect(res.statusCode).toBe(400);
    }
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('is rate limited', async () => {
    checkRateLimit.mockReturnValue(false);
    const res = await call(valid);
    expect(res.statusCode).toBe(429);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('keeps at most five stocks and trims long input', () => {
    const { data } = cleanStockPledge({ ...valid, stocks: Array(9).fill({ name: 'X', shares: '1' }), note: 'n'.repeat(5000) });
    expect(data.stocks).toHaveLength(5);
    expect(data.note).toHaveLength(1000);
  });

  it('leaves card donations on their existing path', async () => {
    const res = await call({ transactionId: 'pi_1', amount: '50', firstName: 'A', email: 'a@example.org' });
    expect(res.statusCode).toBe(200);
    expect(sendEmail).toHaveBeenCalledTimes(2);
  });
});
