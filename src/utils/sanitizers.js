/**
 * Clearpath Finance — Input sanitization & validation
 * XSS protection, safe number parsing, prompt injection filtering
 */

const MAX_STRING_LENGTH = 500;
const MAX_PROMPT_LENGTH = 1000;
const AMOUNT_MIN = 0;
const AMOUNT_MAX = 1_000_000;

/**
 * Sanitize user string input (XSS protection, length guard)
 */
export function sanitize(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim()
    .slice(0, MAX_STRING_LENGTH);
}

/**
 * Safe amount parsing: returns null if invalid or out of range
 */
export function sanitizeAmount(val) {
  if (val === null || val === undefined) return null;
  const num = parseFloat(String(val).replace(/[^0-9.]/g, ""));
  if (isNaN(num) || num < AMOUNT_MIN || num > AMOUNT_MAX) return null;
  return Math.round(num * 100) / 100;
}

export function validateEmail(email) {
  if (typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Sanitize AI chat input — strip prompt injection patterns, HTML, length guard
 */
export function sanitizePrompt(input) {
  if (typeof input !== "string") return "";
  const stripped = input
    .replace(/ignore (previous|all|above|system) instructions?/gi, "")
    .replace(/you are now|pretend to be|act as|jailbreak/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, MAX_PROMPT_LENGTH);
  return stripped;
}
