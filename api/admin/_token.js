/**
 * Signed session tokens for the admin API.
 *
 * Moved out of the route file so the scope rules can be tested directly:
 * they are what keeps a second, weaker password from granting more than it
 * should, and that is worth a test rather than a careful reading.
 */
import crypto from 'crypto';

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Tokens carry a scope, and it is inside the signed payload rather than
 * beside it, so it cannot be edited without breaking the HMAC.
 *
 * This is what makes a second password mean anything. Without a scope,
 * every valid token opens every admin route, so adding a login for the
 * Crossings dashboard would have handed out full admin access to anyone
 * who knew that dashboard's password -- a weaker password granting
 * strictly more than it should.
 */
export function signToken(secret, scope = 'admin') {
  const payload = {
    iat: Date.now(),
    exp: Date.now() + TOKEN_EXPIRY_MS,
    scope,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${sig}`;
}

export function verifyToken(token, secret, allowedScopes = ['admin']) {
  if (!token || !token.includes('.')) return false;
  const [payloadB64, sig] = token.split('.');
  if (!payloadB64 || !sig) return false;

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  // Constant-time comparison for signature
  if (sig.length !== expectedSig.length) return false;
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;

  // Check expiration and scope
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (!payload.exp || Date.now() > payload.exp) return false;
    // Tokens issued before scopes existed carry none. They were full admin
    // tokens, so that is what they stay -- treating them as unscoped would
    // log every signed-in admin out, and they age out within 24 hours.
    const scope = payload.scope || 'admin';
    if (!allowedScopes.includes(scope)) return false;
  } catch {
    return false;
  }
  return true;
}
