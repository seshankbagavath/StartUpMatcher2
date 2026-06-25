/**
 * Auth helpers — password hashing and session token utilities.
 * Uses Node.js built-in crypto (no external deps needed).
 */
import crypto from "crypto";

/** Hash a plaintext password using SHA-256 + a random salt. */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .createHmac("sha256", salt)
    .update(password)
    .digest("hex");
  return `${salt}:${hash}`;
}

/** Compare a plaintext password against a stored hash. */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const attempt = crypto
    .createHmac("sha256", salt)
    .update(password)
    .digest("hex");
  return attempt === hash;
}

/** Generate a cryptographically-random session token. */
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/** Extract bearer token from Authorization header. */
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}
