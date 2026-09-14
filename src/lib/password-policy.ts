/**
 * Server-side password rules.
 *
 * The forms already check length in the browser, but that is a convenience,
 * not a control - anyone can POST straight to the API. These are the rules
 * that actually hold.
 */

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 200;

/** Returns an Indonesian error message, or null when the password is fine. */
export function validatePassword(password: unknown): string | null {
  if (typeof password !== "string") return "Kata sandi tidak valid.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`;
  }
  // Bcrypt only reads the first 72 bytes; an unbounded input is also a cheap
  // way to burn CPU on hashing, so cap it.
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Kata sandi maksimal ${MAX_PASSWORD_LENGTH} karakter.`;
  }
  return null;
}

/** Minimal shape check so obviously bogus addresses never reach the database. */
export function validateEmail(email: unknown): string | null {
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return "Format email tidak valid.";
  }
  if (email.length > 254) return "Email terlalu panjang.";
  return null;
}
