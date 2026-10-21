import { describe, it, expect, vi } from 'vitest';

vi.mock('../api/_email.js', () => ({ sendEmail: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }));
const { summariseNudge } = await import('../api/admin/[...path].js');

const row = (event, value, n) => ({ dimensionValues: [{ value: event }, { value }], metricValues: [{ value: String(n) }] });

describe('summariseNudge', () => {
  const counts = { nudge_shown: 100, nudge_expand: 12, nudge_donate_click: 7 };

  it('reports totals from the event counts', () => {
    expect(summariseNudge(counts, null, null)).toEqual({ shown: 100, expanded: 12, donateClicks: 7, byMessage: null, byState: null });
  });

  it('groups by message, most shown first, ignoring rows from before the dimension existed', () => {
    const byMessage = { rows: [
      row('nudge_shown', 'joel', 30), row('nudge_shown', 'retention', 50), row('nudge_expand', 'retention', 5),
      row('nudge_donate_click', 'retention', 3), row('nudge_donate_click', 'joel', 1), row('nudge_shown', '(not set)', 20),
    ] };
    const s = summariseNudge(counts, byMessage, null);
    expect(s.byMessage).toEqual([
      { message: 'retention', shown: 50, expanded: 5, donateClicks: 3 },
      { message: 'joel', shown: 30, expanded: 0, donateClicks: 1 },
    ]);
  });

  it('splits donate clicks into pill and card', () => {
    const byState = { rows: [row('nudge_donate_click', 'minimized', 4), row('nudge_donate_click', 'expanded', 3), row('nudge_shown', '(not set)', 100)] };
    expect(summariseNudge(counts, null, byState).byState).toEqual({ minimized: 4, expanded: 3 });
  });

  it('handles an empty period', () => {
    expect(summariseNudge({}, { rows: [] }, {})).toEqual({ shown: 0, expanded: 0, donateClicks: 0, byMessage: [], byState: { minimized: 0, expanded: 0 } });
  });
});
