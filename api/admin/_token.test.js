/**
 * Tests for the admin API's session tokens.
 *
 * The scope rules are the point. A second password for the Crossings
 * dashboard is only meaningfully separate if a token issued by it cannot
 * open anything else, and that property is easy to break by accident in a
 * later edit — so it is asserted rather than left to a careful reading.
 */
import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { signToken, verifyToken } from './_token.js';

const SECRET = 'test-secret-not-a-real-one';

describe('signToken / verifyToken', () => {
  it('accepts an admin token on an admin route', () => {
    expect(verifyToken(signToken(SECRET, 'admin'), SECRET, ['admin'])).toBe(true);
  });

  it('defaults to the admin scope when none is named', () => {
    expect(verifyToken(signToken(SECRET), SECRET, ['admin'])).toBe(true);
  });

  // The whole reason scopes exist.
  it('refuses a crossings token on an admin route', () => {
    expect(verifyToken(signToken(SECRET, 'crossings'), SECRET, ['admin'])).toBe(false);
  });

  it('accepts a crossings token on the crossings route', () => {
    const t = signToken(SECRET, 'crossings');
    expect(verifyToken(t, SECRET, ['crossings', 'admin'])).toBe(true);
  });

  it('accepts an admin token on the crossings route', () => {
    const t = signToken(SECRET, 'admin');
    expect(verifyToken(t, SECRET, ['crossings', 'admin'])).toBe(true);
  });

  it('refuses an unknown scope everywhere', () => {
    const t = signToken(SECRET, 'something-else');
    expect(verifyToken(t, SECRET, ['admin'])).toBe(false);
    expect(verifyToken(t, SECRET, ['crossings', 'admin'])).toBe(false);
  });

  // The scope lives inside the signed payload, so escalating it has to
  // break the signature. This is the attack the design exists to stop.
  it('refuses a token whose scope has been edited to admin', () => {
    const token = signToken(SECRET, 'crossings');
    const [payloadB64, sig] = token.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    payload.scope = 'admin';
    const forged = Buffer.from(JSON.stringify(payload)).toString('base64url');
    expect(verifyToken(`${forged}.${sig}`, SECRET, ['admin'])).toBe(false);
  });

  it('refuses a token signed with a different secret', () => {
    const t = signToken('some-other-secret', 'admin');
    expect(verifyToken(t, SECRET, ['admin'])).toBe(false);
  });

  it('refuses an expired token', () => {
    const payload = {
      iat: Date.now() - 90000000,
      exp: Date.now() - 1000,
      scope: 'admin',
    };
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = crypto.createHmac('sha256', SECRET).update(payloadB64).digest('base64url');
    expect(verifyToken(`${payloadB64}.${sig}`, SECRET, ['admin'])).toBe(false);
  });

  it('refuses malformed and empty tokens', () => {
    for (const t of ['', null, undefined, 'nodot', 'a.b.c', '.', 'x.']) {
      expect(verifyToken(t, SECRET, ['admin'])).toBe(false);
    }
  });
});
