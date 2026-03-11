/**
 * Clearpath Finance — Persistent storage (localStorage) with safe read/write
 */

const STORAGE_KEY = "clearpath_finance_v1";

function safeJsonParse(str, fallback) {
  try {
    if (str == null || str === "") return fallback;
    return JSON.parse(str);
  } catch (e) {
    if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
      console.warn("[Clearpath] storage parse error:", e?.message);
    }
    return fallback;
  }
}

function safeJsonStringify(value) {
  try {
    return JSON.stringify(value);
  } catch (e) {
    if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
      console.warn("[Clearpath] storage stringify error:", e?.message);
    }
    return null;
  }
}

/**
 * Read full persisted state. Returns null on error or missing.
 */
export function readPersistedState() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return safeJsonParse(raw, null);
  } catch (e) {
    if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
      console.warn("[Clearpath] storage read error:", e?.message);
    }
    return null;
  }
}

/**
 * Write full state. Catches errors and logs in dev.
 */
export function writePersistedState(state) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    const str = safeJsonStringify(state);
    if (str != null) window.localStorage.setItem(STORAGE_KEY, str);
  } catch (e) {
    if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
      console.warn("[Clearpath] storage write error:", e?.message);
    }
  }
}

/**
 * Merge partial state into persisted state, then write.
 */
export function persistPartial(partial) {
  const current = readPersistedState() || {};
  writePersistedState({ ...current, ...partial });
}
