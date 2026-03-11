import { useState, useEffect, useCallback } from "react";
import { readPersistedState, persistPartial } from "../utils/storage.js";
import { DEFAULT_CATEGORIES, DEFAULT_CATEGORY_IDS } from "../constants/defaults.js";
import { sanitize } from "../utils/sanitizers.js";

const KEY = "categories";

function loadInitial() {
  try {
    const state = readPersistedState();
    const stored = state?.[KEY];
    if (Array.isArray(stored) && stored.length > 0) return stored;
  } catch (e) {
    if (import.meta.env?.DEV) console.warn("[Clearpath] useCategories load:", e?.message);
  }
  return DEFAULT_CATEGORIES;
}

export { isDefaultCategory } from "../constants/defaults.js";

export function useCategories() {
  const [categories, setCategories] = useState(loadInitial);

  useEffect(() => {
    persistPartial({ [KEY]: categories });
  }, [categories]);

  const addCategory = useCallback(({ name, color, icon }) => {
    const safeName = sanitize(name);
    if (!safeName) return;
    setCategories((prev) => {
      if (prev.some((c) => c.name.toLowerCase() === safeName.toLowerCase())) return prev;
      const id = `custom_${Date.now()}`;
      return [...prev, { id, name: safeName, color: color || "#C4A882", icon: icon || "📌" }];
    });
  }, []);

  const updateCategory = useCallback((id, updates) => {
    if (DEFAULT_CATEGORY_IDS.includes(id) && updates.id !== undefined) return;
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, name: updates.name != null ? sanitize(updates.name) || c.name : c.name } : c))
    );
  }, []);

  const deleteCategory = useCallback((id) => {
    if (DEFAULT_CATEGORY_IDS.includes(id)) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return {
    categories,
    setCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  };
}
