/**
 * Clearpath Finance — Persistent login session (localStorage)
 */

const AUTH_KEY = "clearpath_auth_v1";

function safeParse(str, fallback) {
  try {
    if (str == null || str === "") return fallback;
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

/**
 * Save logged-in user so they stay logged in on refresh.
 */
export function saveSession(user) {
  try {
    if (typeof window === "undefined" || !window.localStorage || !user) return;
    window.localStorage.setItem(AUTH_KEY, JSON.stringify({
      user: { name: user.name, email: user.email },
      loggedInAt: Date.now(),
    }));
  } catch (e) {
    if (import.meta.env?.DEV) console.warn("[Clearpath] auth save error:", e?.message);
  }
}

/**
 * Restore session if present. Returns { user } or null.
 */
export function getSession() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const raw = window.localStorage.getItem(AUTH_KEY);
    const data = safeParse(raw, null);
    if (!data?.user?.email) return null;
    return { user: data.user };
  } catch (e) {
    return null;
  }
}

/**
 * Clear session on logout.
 */
export function clearSession() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.removeItem(AUTH_KEY);
  } catch (e) {
    if (import.meta.env?.DEV) console.warn("[Clearpath] auth clear error:", e?.message);
  }
}
