import { useState, useEffect, useCallback } from "react";
import { readPersistedState, persistPartial } from "../utils/storage.js";

const KEY = "settings";
const DEFAULTS = { biometricEnabled: false, aiNotifications: true, connectedBanks: [] };

function loadInitial() {
  try {
    const state = readPersistedState();
    const stored = state?.[KEY];
    if (stored && typeof stored === "object") return { ...DEFAULTS, ...stored };
  } catch (e) {
    if (import.meta.env?.DEV) console.warn("[Clearpath] useSettings load:", e?.message);
  }
  return { ...DEFAULTS };
}

export function useSettings() {
  const [settings, setSettings] = useState(loadInitial);

  useEffect(() => {
    persistPartial({ [KEY]: settings });
  }, [settings]);

  const setBiometricEnabled = useCallback((value) => {
    setSettings((s) => ({ ...s, biometricEnabled: !!value }));
  }, []);

  const setAiNotifications = useCallback((value) => {
    setSettings((s) => ({ ...s, aiNotifications: !!value }));
  }, []);

  const addConnectedBank = useCallback((bank) => {
    setSettings((s) => ({
      ...s,
      connectedBanks: [...new Set([...(s.connectedBanks || []), bank])],
    }));
  }, []);

  return {
    settings,
    setSettings,
    biometricEnabled: settings.biometricEnabled,
    aiNotifications: settings.aiNotifications,
    connectedBanks: Array.isArray(settings.connectedBanks) ? settings.connectedBanks : [],
    setBiometricEnabled,
    setAiNotifications,
    addConnectedBank,
  };
}
