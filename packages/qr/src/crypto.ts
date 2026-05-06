import { createHmac, timingSafeEqual } from "crypto";

/**
 * SERVER-ONLY. Signs a QR payload using HMAC-SHA256.
 *
 * The encoded string format is:  `{prefix}:{id}:{hmac}`
 *
 * Examples:
 *   ticket:[qr_code_id]:[hmac]   — event ticket check-in
 *   pass:[member_id]:[hmac]      — membership verification
 *
 * To add a new use-case, call signPayload with your own prefix and verify
 * with verifyPayload, then dispatch on the returned prefix.
 */
export function signPayload(prefix: string, id: string, secret: string): string {
  const hmac = createHmac("sha256", secret).update(id).digest("hex");
  return `${prefix}:${id}:${hmac}`;
}

/**
 * SERVER-ONLY. Verifies a signed QR payload.
 * Returns { prefix, id } on success, null if invalid or tampered.
 * Uses constant-time comparison to prevent timing attacks.
 */
export function verifyPayload(
  raw: string,
  secret: string,
): { prefix: string; id: string } | null {
  const parts = raw.split(":");
  if (parts.length !== 3) return null;

  const [prefix, id, receivedHmac] = parts as [string, string, string];

  const expectedHmac = createHmac("sha256", secret).update(id).digest("hex");

  const a = Buffer.from(receivedHmac, "hex");
  const b = Buffer.from(expectedHmac, "hex");

  if (a.length !== b.length || a.length === 0) return null;
  if (!timingSafeEqual(a, b)) return null;

  return { prefix, id };
}
