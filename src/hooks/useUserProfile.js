import { useState, useEffect, useCallback } from "react";
import { readPersistedState, persistPartial } from "../utils/storage.js";
import { sanitize } from "../utils/sanitizers.js";

const KEY = "userProfile";

const DEFAULT_PROFILE = { name: "Alex", email: "alex@example.com" };

function loadInitial(initialUser) {
  try {
    const state = readPersistedState();
    const stored = state?.[KEY];
    if (stored && typeof stored === "object" && (stored.name || stored.email)) {
      return { ...DEFAULT_PROFILE, ...stored };
    }
    if (initialUser && typeof initialUser === "object") {
      return {
        name: sanitize(initialUser.name) || DEFAULT_PROFILE.name,
        email: sanitize(initialUser.email) || initialUser.email || DEFAULT_PROFILE.email,
      };
    }
  } catch (e) {
    if (import.meta.env?.DEV) console.warn("[Clearpath] useUserProfile load:", e?.message);
  }
  return { ...DEFAULT_PROFILE };
}

export function useUserProfile(initialUser) {
  const [userProfile, setUserProfile] = useState(() => loadInitial(initialUser));

  useEffect(() => {
    if (initialUser?.name) setUserProfile((p) => ({ ...p, name: sanitize(initialUser.name) || p.name, email: initialUser.email || p.email }));
  }, [initialUser?.name, initialUser?.email]);

  useEffect(() => {
    persistPartial({ [KEY]: userProfile });
  }, [userProfile]);

  const updateProfile = useCallback((updates) => {
    setUserProfile((prev) => ({
      ...prev,
      ...(updates.name != null && { name: sanitize(updates.name) || prev.name }),
      ...(updates.email != null && { email: sanitize(updates.email) || prev.email }),
    }));
  }, []);

  return { userProfile, setUserProfile, updateProfile };
}
