import crypto from 'crypto';

/**
 * Session tokens and password hashing.
 *
 * The previous scheme was `base64(userId:timestamp)` with no signature, so
 * anyone who knew (or guessed) a user id could mint a valid session for that
 * user — including the admin. Tokens are now HMAC-signed and expire.
 */

export const SESSION_COOKIE = 'session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

// Bootstrap admin: lets the original account keep admin rights before the
// isAdmin column has been set on it. Email is unique, so unlike the previous
// `name === 'Admin'` check this cannot be claimed by registering a new user.
export const BOOTSTRAP_ADMIN_EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@b2b.com';

let warnedAboutSecret = false;
// Only used when no secret is configured. Regenerated each boot, which
// invalidates existing sessions on restart — acceptable as a fallback, but the
// warning below tells the operator to set a real secret.
const ephemeralSecret = crypto.randomBytes(32).toString('hex');

function getSecret(): string {
  const configured = process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET;
  if (configured) return configured;

  if (!warnedAboutSecret) {
    warnedAboutSecret = true;
    console.warn(
      '[auth] SESSION_SECRET is not set — using a random per-process secret. ' +
      'All users will be logged out on every restart. Set SESSION_SECRET in the environment.'
    );
  }
  return ephemeralSecret;
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

export function createSessionToken(userId: string): string {
  const payload = `${userId}.${Date.now()}`;
  const encoded = Buffer.from(payload).toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

/** Returns the user id, or null when the token is missing, forged or expired. */
export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null;

  const separator = token.lastIndexOf('.');
  if (separator <= 0) return null;

  const encoded = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = sign(encoded);

  // Constant-time compare; timingSafeEqual throws on length mismatch.
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let payload: string;
  try {
    payload = Buffer.from(encoded, 'base64url').toString();
  } catch {
    return null;
  }

  const dot = payload.lastIndexOf('.');
  if (dot <= 0) return null;

  const userId = payload.slice(0, dot);
  const issuedAt = Number(payload.slice(dot + 1));
  if (!userId || !Number.isFinite(issuedAt)) return null;
  if (Date.now() - issuedAt > SESSION_MAX_AGE_SECONDS * 1000) return null;

  return userId;
}

// ─── Password hashing ───
// scrypt with a per-user salt, replacing unsalted SHA-256 (which is fast enough
// to brute-force and identical for identical passwords across accounts).

const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

/**
 * Verifies a password against either the new scrypt format or the legacy
 * unsalted SHA-256 hash. `needsUpgrade` signals that the caller should re-hash
 * and persist, so existing accounts migrate transparently on next login.
 */
export function verifyPassword(
  password: string,
  stored: string | null | undefined
): { ok: boolean; needsUpgrade: boolean } {
  if (!stored) return { ok: false, needsUpgrade: false };

  if (stored.startsWith('scrypt$')) {
    const [, salt, expectedHex] = stored.split('$');
    if (!salt || !expectedHex) return { ok: false, needsUpgrade: false };
    const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
    const expected = Buffer.from(expectedHex, 'hex');
    const ok =
      derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
    return { ok, needsUpgrade: false };
  }

  // Legacy: bare SHA-256 hex digest.
  if (/^[a-f0-9]{64}$/i.test(stored)) {
    const legacy = crypto.createHash('sha256').update(password).digest();
    const expected = Buffer.from(stored, 'hex');
    const ok =
      legacy.length === expected.length && crypto.timingSafeEqual(legacy, expected);
    return { ok, needsUpgrade: ok };
  }

  return { ok: false, needsUpgrade: false };
}
