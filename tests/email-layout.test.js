import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

vi.mock('../api/_email.js', () => ({ sendEmail: vi.fn(async () => ({})) }));
vi.mock('../api/_rateLimit.js', () => ({ checkRateLimit: vi.fn(() => true) }));
const { emailLayout } = await import('../api/_emailLayout.js');
const { donorThankYouEmail, stockPledgeDonorEmail } = await import('../api/send-donation-notification.js');
const { everyOrgDonationEmail, overlapEmail } = await import('../api/admin/[...path].js');

const hasLayout = html => html.includes('logo-white.png') && html.includes('Making Homelessness History') && html.includes('max-width:640px');

describe('emailLayout', () => {
  it('wraps a body in the plum header and the footer', () => {
    const html = emailLayout({ title: 'Hello', subtitle: 'Oct 1 to Nov 5', body: '<p>Body text</p>', css: '.box{color:red}' });
    expect(hasLayout(html)).toBe(true);
    expect(html).toContain('>Hello</div>');
    expect(html).toContain('Oct 1 to Nov 5');
    expect(html).toContain('<p>Body text</p>');
    expect(html).toContain('.box{color:red}');
  });

  it('leaves the subtitle out when there is none', () => {
    expect(emailLayout({ title: 'T', body: '' })).not.toContain('#F5DCE8');
  });
});

describe('every website email uses the shared layout', () => {
  it('builders that are exported render inside it', () => {
    const d = { firstName: 'Ada', lastName: 'Lovelace', email: 'a@example.org', amount: 50 };
    expect(hasLayout(donorThankYouEmail({ ...d, monthly: false, date: new Date() }).html)).toBe(true);
    expect(hasLayout(stockPledgeDonorEmail({ name: 'Ada Lovelace', email: 'a@example.org', approxValue: 1000, transferDate: '2026-11-20' }).html)).toBe(true);
    expect(hasLayout(everyOrgDonationEmail({ ...d, paymentMethod: 'card' }).html)).toBe(true);
    expect(hasLayout(overlapEmail([{ name: 'Ada', email: 'a@example.org', bloomerang: { amount: 25, frequency: 'Monthly', since: '2024-01-01' }, stripe: { amount: 25, since: '2026-10-30' } }]).html)).toBe(true);
  });

  // A new email written the old way (its own <!DOCTYPE> and header) would
  // drift from the brand. Pages shown in the browser are not emails and keep
  // their own HTML: the approve/deny pages sent with res.send, and the check
  // review page built by _checkIntake.js's page() helper.
  it('no api file builds its own email page', () => {
    const dir = path.resolve(__dirname, '../api');
    const files = [];
    const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.js') && files.push(path.join(d, e.name)));
    walk(dir);
    const offenders = [];
    for (const f of files) {
      if (f.endsWith('_emailLayout.js')) continue;
      const src = fs.readFileSync(f, 'utf8');
      for (let i = src.indexOf('<!DOCTYPE'); i >= 0; i = src.indexOf('<!DOCTYPE', i + 1)) {
        if (!/(res\.status\(\d+\)\.send\(`|const page = \(title, inner\) => `)\s*$/.test(src.slice(Math.max(0, i - 60), i))) offenders.push(`${path.basename(f)}:${src.slice(0, i).split('\n').length}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
