import { useState, useEffect, useCallback } from "react";
import { readPersistedState, persistPartial } from "../utils/storage.js";
import { BASE_TRANSACTIONS } from "../constants/defaults.js";

const KEY = "transactions";

function loadInitial() {
  try {
    const state = readPersistedState();
    const stored = state?.[KEY];
    if (Array.isArray(stored) && stored.length > 0) return stored;
  } catch (e) {
    if (import.meta.env?.DEV) console.warn("[Clearpath] useTransactions load:", e?.message);
  }
  return BASE_TRANSACTIONS;
}

export function useTransactions() {
  const [transactions, setTransactions] = useState(loadInitial);

  useEffect(() => {
    persistPartial({ [KEY]: transactions });
  }, [transactions]);

  const addTransaction = useCallback((tx) => {
    if (!tx || typeof tx.amount !== "number") return;
    const id = tx.id ?? Date.now();
    setTransactions((prev) => [{ ...tx, id }, ...prev]);
    if (import.meta.env?.DEV) console.log("[Clearpath] transaction added", id);
  }, []);

  const updateTransaction = useCallback((updated) => {
    if (!updated?.id) return;
    setTransactions((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
    if (import.meta.env?.DEV) console.log("[Clearpath] transaction updated", updated.id);
  }, []);

  const deleteTransaction = useCallback((id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    if (import.meta.env?.DEV) console.log("[Clearpath] transaction deleted", id);
  }, []);

  return {
    transactions,
    setTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
