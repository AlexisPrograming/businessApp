import { useState, useEffect, useMemo, useCallback } from "react";
import { readPersistedState, persistPartial } from "../utils/storage.js";
import { DEFAULT_FINANCIAL_DATA } from "../constants/defaults.js";
import {
  getWeeklySpendByDay,
  getTotalSpent,
  getCategoryTotals,
  currentMonthPredicate,
  computeBalance,
} from "../utils/financeCalculations.js";

const KEY = "financialData";

function loadInitial() {
  try {
    const state = readPersistedState();
    const stored = state?.[KEY];
    if (stored && typeof stored === "object") {
      return { ...DEFAULT_FINANCIAL_DATA, ...stored };
    }
  } catch (e) {
    if (import.meta.env?.DEV) console.warn("[Clearpath] useFinance load:", e?.message);
  }
  return { ...DEFAULT_FINANCIAL_DATA };
}

export function useFinance(transactions) {
  const [financialData, setFinancialData] = useState(loadInitial);

  useEffect(() => {
    persistPartial({ [KEY]: financialData });
  }, [financialData]);

  const monthPredicate = useMemo(() => currentMonthPredicate(), []);

  const monthSpent = useMemo(() => {
    if (!Array.isArray(transactions)) return financialData.monthSpent ?? 0;
    return getTotalSpent(transactions, monthPredicate);
  }, [transactions, monthPredicate, financialData.monthSpent]);

  const balance = useMemo(() => {
    const initial = financialData.balance ?? DEFAULT_FINANCIAL_DATA.balance;
    return computeBalance(initial, transactions, null);
  }, [financialData.balance, transactions]);

  const weeklySpendByDay = useMemo(
    () => (Array.isArray(transactions) ? getWeeklySpendByDay(transactions) : [0, 0, 0, 0, 0, 0, 0]),
    [transactions]
  );

  const categoryTotals = useMemo(
    () => (Array.isArray(transactions) ? getCategoryTotals(transactions, monthPredicate) : {}),
    [transactions, monthPredicate]
  );

  const updateFinancialData = useCallback((updates) => {
    setFinancialData((prev) => ({ ...prev, ...updates }));
  }, []);

  const derived = useMemo(
    () => ({
      monthSpent,
      balance,
      weeklySpendByDay,
      categoryTotals,
      budgetPct:
        (financialData.monthBudget > 0 && Math.round((monthSpent / financialData.monthBudget) * 100)) || 0,
      savingsPct:
        (financialData.savingsGoal > 0 &&
          Math.round((financialData.savedSoFar / financialData.savingsGoal) * 100)) ||
        0,
    }),
    [monthSpent, balance, weeklySpendByDay, categoryTotals, financialData.monthBudget, financialData.savingsGoal, financialData.savedSoFar]
  );

  return {
    financialData: { ...financialData, monthSpent, balance },
    setFinancialData,
    updateFinancialData,
    derived,
  };
}
