/**
 * Clearpath Finance — Email verification (mock: in-memory/sessionStorage).
 * In production, replace with a backend that sends a real email (e.g. Resend, SendGrid).
 */

const VERIFY_PREFIX = "clearpath_verify_";

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * "Send" verification code to email. Mock: store code in sessionStorage keyed by email.
 * Returns the code so UI can show it in dev; production backend would email it.
 */
export function sendVerificationCode(email) {
  if (!email || typeof email !== "string") return null;
  const code = generateCode();
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.setItem(VERIFY_PREFIX + email.trim().toLowerCase(), code);
    }
  } catch (e) {
    if (import.meta.env?.DEV) console.warn("[Clearpath] verify send error:", e?.message);
  }
  return code;
}

/**
 * Verify the code entered by the user. Returns true if code matches.
 */
export function verifyCode(email, code) {
  if (!email || !code) return false;
  try {
    if (typeof window === "undefined" || !window.sessionStorage) return false;
    const key = VERIFY_PREFIX + email.trim().toLowerCase();
    const stored = window.sessionStorage.getItem(key);
    const match = stored && String(code).trim() === stored;
    if (match) window.sessionStorage.removeItem(key);
    return match;
  } catch (e) {
    return false;
  }
}
