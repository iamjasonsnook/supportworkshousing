import { describe, it, expect } from 'vitest';
import { coverFeeFor, money, STRIPE_PERCENT, STRIPE_FIXED } from '../src/utils/fees.js';

describe('coverFeeFor', () => {
  it('adds enough that the charity nets the whole gift after Stripe fees', () => {
    for (const gift of [1, 5, 25, 50, 100, 250, 500, 1000, 2500, 50000]) {
      const total = gift + coverFeeFor(gift);
      const net = total - (total * STRIPE_PERCENT + STRIPE_FIXED);
      expect(Math.abs(net - gift)).toBeLessThan(0.01);
    }
  });
  it('matches the worked example', () => { expect(coverFeeFor(100)).toBe(2.56); });
  it('is zero for no gift', () => { expect(coverFeeFor(0)).toBe(0); expect(coverFeeFor('')).toBe(0); });
  it('formats whole and part dollars', () => { expect(money(100)).toBe('100'); expect(money(102.56)).toBe('102.56'); });
});
